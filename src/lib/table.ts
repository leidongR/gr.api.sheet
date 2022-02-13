import { max_columns_count, min_columns_count, num_to_column } from "./column";

export class Table {
  id: string;
  titles: string[];
  titleDict: { [title: string]: number };
  columnCount: number;
  rows: {
    rowNum: number;
    cells: any[];
  }[];
  rowNums: number[];
  medadata: { [key: string]: string };
  constructor(id: string, metadata: { [key: string]: string }) {
    this.id = id;
    this.medadata = metadata;
  }

  addTitles = (titles: any[]) => {
    var titleRow: string[] = titles;
    var titlesCount: number = titleRow.length;
    if (titlesCount < min_columns_count || titlesCount > max_columns_count) {
      throw new Error(
        `title row is empty or contains too many columns in table(${this.id})`
      );
    }

    titleRow = titleRow.map((title) => `${title}`);
    const titleDict: { [title: string]: number } = {};
    for (let index = 0; index < titleRow.length; index++) {
      const title = titleRow[index];
      const column_num = index + 1;
      if (title.length === 0) {
        throw new Error(
          `empty title at column ${num_to_column(column_num)} in table(${
            this.id
          })`
        );
      }

      const exists_column_num = titleDict[title];
      if (exists_column_num != null) {
        throw new Error(
          `duplicated title found at column ${num_to_column(
            column_num
          )} and ${num_to_column(exists_column_num)} in table(${this.id})`
        );
      }

      titleDict[title] = column_num;
    }

    this.titles = titleRow;
    this.titleDict = titleDict;
    this.columnCount = titlesCount;
  };

  addCells = (cells: any[], rowNum: number) => {
    // verify row length with titles length
    if (cells.length !== this.columnCount)
      throw new Error(
        `cells count(${cells.length}) is not matched to ${this.columnCount} at row ${rowNum}`
      );

    // ingore empty row
    let firstNonEmptyCellIndex = cells.findIndex(
      (cell) => cell != null && (typeof cell !== "string" || cell.length > 0)
    );
    if (firstNonEmptyCellIndex < 0) {
      return;
    }

    // store row
    if (this.rows == null) this.rows = [];
    this.rows.push({
      rowNum,
      cells,
    });
  };

  find = (opts: { [key: string]: string }) => {
    const results = this.rows
      .filter((row) => true)
      .map((_, index) => this.buildRowObj(index));
    return {
      count: results.length,
      data: results,
    };
  };

  private buildRowObj = (
    rowIndex: number,
    includedTitles?: string[],
    excludedTitles?: string[]
  ) => {
    // build titles of result
    let titles = this.titles;
    if (includedTitles != null) {
      titles = titles.filter((title) => includedTitles.includes(title));
    }

    if (excludedTitles != null) {
      titles = titles.filter((title) => !excludedTitles.includes(title));
    }

    // build result
    let obj: { [key: string]: any } = {};
    let cells = this.rows[rowIndex].cells;

    titles.forEach((title) => {
      obj[title] = cells[this.titleDict[title]];
    });
    return obj;
  };
}
