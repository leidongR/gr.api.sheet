import { max_columns_count, min_columns_count, num_to_column } from "./column";
import {
  ValueCondition,
  isOrCondition,
  parseConditionsOfQuery,
  QueryCondition,
  AtomicValueCondition,
  OrCondition,
} from "./query";
import { SheetColumn } from "./sheetColumn";

export class Sheet {
  id: string;
  columns: SheetColumn[];
  columnDict: { [title: string]: number };
  medadata: { [key: string]: string };
  constructor(id: string, metadata: { [key: string]: string }) {
    this.id = id;
    this.medadata = metadata;
  }

  addTitles = (titles: any[]) => {
    var titlesCount: number = titles.length;
    if (titlesCount < min_columns_count || titlesCount > max_columns_count) {
      throw new Error(
        `title row is empty or contains too many columns in sheet(${this.id})`
      );
    }

    var _titles: string[] = titles.map((title) => `${title}`);
    this.columns = _titles.map((title, index) => new SheetColumn(title, index));

    this.columnDict = {};
    this.columns.forEach((column, index) => {
      if (column.titlesInLowerCase.length === 0) {
        throw new Error(
          `empty title at column ${num_to_column(index + 1)} in sheet(${
            this.id
          })`
        );
      }
      const exists_column_index = this.columnDict[column.titlesInLowerCase];
      if (exists_column_index != null) {
        throw new Error(
          `duplicated title found at column ${num_to_column(
            index + 1
          )} and ${num_to_column(exists_column_index + 1)} in sheet(${this.id})`
        );
      }

      this.columnDict[column.titlesInLowerCase] = index;
    });
  };

  addCells = (cells: any[], rowNum: number) => {
    // verify row length with titles length
    if (cells.length !== this.columns.length)
      throw new Error(
        `cells count(${cells.length}) is not matched to ${this.columns.length} at row ${rowNum}`
      );

    // ingore empty row
    let firstNonEmptyCellIndex = cells.findIndex(
      (cell) => cell != null && (typeof cell !== "string" || cell.length > 0)
    );
    if (firstNonEmptyCellIndex < 0) {
      return;
    }

    // store row
    cells.forEach((cell, index) => {
      this.columns[index].push(cell);
    });
  };

  columnWithTitle = (title: string) => {
    const _title = title.toLowerCase().trim();
    if (!Object.prototype.hasOwnProperty.call(this.columnDict, _title)) {
      throw new Error(`field '${title}' not exists in this sheet`);
    }

    return this.columns[this.columnDict[_title]];
  };

  find = (query: NodeJS.Dict<string | string[]>) => {
    // build query condition
    const condition = parseConditionsOfQuery(query, (title: string) =>
      this.columnWithTitle(title)
    );

    // filter rows by query condition
    let rowsOfResults = this.filterByAtomicConditions(
      condition.valueConditions
    );

    // sort result rows
    rowsOfResults = this.sortRows(rowsOfResults, condition);

    // skip and limit result rows
    const skip = condition.rowFilterConditions.find(
      (c) => c.operator === "$skip"
    );
    const skipValue = skip != null && skip.value > 0 ? skip.value : 0;
    const limit = condition.rowFilterConditions.find(
      (c) => c.operator === "$limit"
    );
    const limitValue =
      limit != null && limit.value > 0
        ? limit.value
        : rowsOfResults.length - skipValue;
    rowsOfResults = rowsOfResults.slice(skipValue, limitValue + skipValue);

    // build results data
    const columnsOfResults = this.outputColumnIndexes(condition);
    const results = rowsOfResults.map((row) =>
      this.buildRowObj(row, columnsOfResults)
    );
    return {
      count: results.length,
      data: results,
    };
  };

  private filterByAtomicConditions = (
    conditions: ValueCondition[],
    inRows?: number[]
  ) => {
    return (
      inRows == null ? this.columns[0].cells.map((_, index) => index) : inRows
    ).filter((row) => this.testValueConditions(conditions, row));
  };

  private testAtomicValueCondition = (
    condition: AtomicValueCondition,
    row: number
  ) => {
    return this.columns[condition.columnIndex].testConditionOnRow(
      condition,
      row
    );
  };

  private testAtomicValueConditions = (
    conditions: AtomicValueCondition[],
    row: number
  ) => {
    return (
      conditions.findIndex(
        (condition) => !this.testAtomicValueCondition(condition, row)
      ) < 0
    );
  };

  private testOrCondition = (condition: OrCondition, row: number) => {
    for (const key in condition) {
      if (Object.prototype.hasOwnProperty.call(condition, key)) {
        const _conditions = condition[key];
        if (this.testAtomicValueConditions(_conditions, row)) {
          return true;
        }
      }
    }
    return false;
  };

  private testValueCondition = (condition: ValueCondition, row: number) => {
    if (isOrCondition(condition)) {
      return this.testOrCondition(condition as OrCondition, row);
    } else {
      return this.testAtomicValueCondition(
        condition as AtomicValueCondition,
        row
      );
    }
  };

  private testValueConditions = (conditions: ValueCondition[], row: number) => {
    return (
      conditions.findIndex(
        (condition) => !this.testValueCondition(condition, row)
      ) < 0
    );
  };

  private sortRows = (rows: number[], condition: QueryCondition) => {
    if (condition.rowSortOperators.length === 0) return rows;

    return rows.sort((a, b) => {
      var compareResult = 0;
      for (let index = 0; index < condition.rowSortOperators.length; index++) {
        const rowSortOperator = condition.rowSortOperators[index];
        const column = this.columns[rowSortOperator.columnIndex];
        compareResult = column.compareRows(a, b);
        if (compareResult === 0) {
          continue;
        }

        if (!rowSortOperator.isAsc) {
          compareResult = -compareResult;
        }
        break;
      }
      return compareResult;
    });
  };

  private outputColumnIndexes = (condition: QueryCondition) => {
    const includedCondition = condition.columnFilterConditions.find(
      (condition) => condition.include
    );
    let columnIndexes =
      includedCondition != null
        ? includedCondition.columnIndexes
        : this.columns.map((_, index) => index);

    const excludedCondition = condition.columnFilterConditions.find(
      (condition) => !condition.include
    );
    if (excludedCondition != null) {
      columnIndexes = columnIndexes.filter(
        (columnIndex) => !excludedCondition.columnIndexes.includes(columnIndex)
      );
    }

    if (columnIndexes.length === 0) {
      throw new Error(
        "all columns are ignored to output, please review query items: $select, and $deselect"
      );
    }

    return columnIndexes;
  };

  private buildRowObj = (row: number, columnIndexes: number[]) => {
    let obj: { [key: string]: any } = {};
    columnIndexes.forEach((columnIndex) => {
      const column = this.columns[columnIndex];
      obj[column.title] = column.cells[row];
    });
    return obj;
  };

  schema = () => {
    return this.columns.map((column) => {
      return {
        title: column.title,
        dataType: column.dataType,
      };
    });
  };
}
