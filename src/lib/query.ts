import { IntRegex } from "./regex";
import { SheetColumn } from "./sheetColumn";

export type ValueDataType = "number" | "string";
export const AtomicValueOperators = [
  "",
  "$lt",
  "$lte",
  "$gt",
  "$gte",
  "$ne",
  "$in",
  "$like",
] as const;
export type AtomicValueOperator = typeof AtomicValueOperators[number];
export interface AtomicValueCondition {
  groupId?: string;
  columnIndex: number;
  operator: AtomicValueOperator;
  value: ValueDataType | ValueDataType[];
}

export type OrCondition = { [id: string]: AtomicValueCondition[] };
export type ValueCondition = AtomicValueCondition | OrCondition;
export const isOrCondition = (condition: ValueCondition) => {
  return (
    !Object.prototype.hasOwnProperty.call(condition, "operator") ||
    typeof (condition as any).operator !== "string"
  );
};

export const ColumnFilterOperators = ["$select", "$deselect"] as const;
export type ColumnFilterOperator = typeof ColumnFilterOperators[number];
export interface ColumnFilterCondition {
  include: boolean;
  columnIndexes: number[];
}

export const RowFilterOperators = ["$skip", "$limit"] as const;
export type RowFilterOperator = typeof RowFilterOperators[number];
export interface RowFilterCondition {
  operator: RowFilterOperator;
  value: number;
}

export const RowSortOperators = ["$sort"] as const;
export type RowSortOperator = typeof RowSortOperators[number];
export interface RowSortCondition {
  columnIndex: number;
  isAsc: boolean;
}

export interface QueryCondition {
  valueConditions: ValueCondition[];
  columnFilterConditions: ColumnFilterCondition[];
  rowFilterConditions: RowFilterCondition[];
  rowSortOperators: RowSortCondition[];
}

export const parseConditionsOfQuery = (
  query: NodeJS.Dict<string | string[]>,
  columnPicker: (title: string) => SheetColumn
) => {
  const condition: QueryCondition = {
    valueConditions: [],
    columnFilterConditions: [],
    rowFilterConditions: [],
    rowSortOperators: [],
  };

  // append all conditions
  for (const key in query) {
    if (!Object.prototype.hasOwnProperty.call(query, key)) continue;
    appendConditionOfQueryItem(condition, key, query[key], columnPicker);
  }

  // group or conditions
  const orCondition: OrCondition = {};
  const valueConditions: AtomicValueCondition[] = [];

  (condition.valueConditions as AtomicValueCondition[]).forEach(
    (valueCondition) => {
      if (valueCondition.groupId != null) {
        if (
          Object.prototype.hasOwnProperty.call(
            orCondition,
            valueCondition.groupId
          )
        ) {
          orCondition[valueCondition.groupId!].push(valueCondition);
        } else {
          orCondition[valueCondition.groupId!] = [valueCondition];
        }
      } else {
        valueConditions.push(valueCondition);
      }
    }
  );

  // update valueConditions if or conditions exists
  if (Object.keys(orCondition).length > 0) {
    condition.valueConditions = [];
    condition.valueConditions.concat(valueConditions);
    condition.valueConditions.push(orCondition);
  }

  return condition;
};

const parseOrGroupId = (queryKey: string) => {
  if (!queryKey.startsWith("$or[")) {
    return {
      orGroupId: undefined,
      fieldKey: queryKey,
    };
  }

  const idStart = "$or[".length;
  const idEnd = queryKey.indexOf("]", idStart);
  if (idEnd <= idStart) {
    throw new Error(
      `invalid query key '${queryKey}', suggested format: '$or[1]fieldname=xxx'`
    );
  }

  return {
    orGroupId: queryKey.substring(idStart, idEnd),
    fieldKey: queryKey.substring(idEnd + 1),
  };
};

const appendConditionOfQueryItem = (
  result: QueryCondition,
  queryKey: string,
  value: string | string[],
  columnPicker: (title: string) => SheetColumn
) => {
  try {
    const { orGroupId, fieldKey } = parseOrGroupId(queryKey);
    appendAtomicCondition(result, fieldKey, value, columnPicker, orGroupId);
  } catch (error) {
    const itemDesc = (typeof value === "string" ? [value] : value)
      .map((v) => `${queryKey}=${v}`)
      .join("&");

    var rawErrDesc = `${error}`;
    if (rawErrDesc.startsWith("Error: ")) {
      rawErrDesc = rawErrDesc.substring("Error: ".length);
    }

    throw new Error(`${rawErrDesc} when parse query item '${itemDesc}'`);
  }
};

const appendAtomicCondition = (
  result: QueryCondition,
  queryKey: string,
  value: string | string[],
  columnPicker: (title: string) => SheetColumn,
  orGroupId?: string
) => {
  const operatorStart = queryKey.lastIndexOf("$");

  // case 1: operator =
  if (operatorStart < 0) {
    const column = columnPicker(queryKey);
    result.valueConditions.push({
      groupId: orGroupId,
      columnIndex: column.columnIndex,
      operator: "",
      value: column.parseValueAsSameDataType(
        typeof value === "string"
          ? (value as ValueDataType)
          : (value as ValueDataType[]),
        ""
      ),
    });

    return;
  }

  const operator = queryKey.substring(operatorStart);

  // case 2: row filter operators by compare cell value
  if (AtomicValueOperators.includes(operator as AtomicValueOperator)) {
    const column = columnPicker(queryKey.substring(0, operatorStart));
    result.valueConditions.push({
      groupId: orGroupId,
      columnIndex: column.columnIndex,
      operator: operator as AtomicValueOperator,
      value: column.parseValueAsSameDataType(
        typeof value === "string"
          ? (value as ValueDataType)
          : (value as ValueDataType[]),
        operator as AtomicValueOperator
      ),
    });

    return;
  }

  if (orGroupId != null) {
    throw new Error(`unsupported operator '${operator}' combin with $or`);
  }

  // case 3: pick columns of results
  if (ColumnFilterOperators.includes(operator as ColumnFilterOperator)) {
    const columns = (typeof value === "string" ? [value] : value).map((title) =>
      columnPicker(title)
    );
    result.columnFilterConditions.push({
      include: (operator as ColumnFilterOperator) === "$select",
      columnIndexes: columns.map((column) => column.columnIndex),
    });

    return;
  }

  // case 4: pick rows of results
  if (RowFilterOperators.includes(operator as RowFilterOperator)) {
    if (typeof value !== "string") {
      throw new Error(`operator '${operator}' are duplicated`);
    }
    if (queryKey !== operator) {
      throw new Error(`operator '${operator}' should has no prefix`);
    }
    try {
      if (IntRegex.test(value)) {
        const int = parseInt(value);
        result.rowFilterConditions.push({
          operator: operator as RowFilterOperator,
          value: int,
        });

        return;
      }
      throw new Error("invalid format");
    } catch (error) {
      throw new Error(`operator '${operator}' has non-integer value'${value}'`);
    }
  }

  // case 5: sort results
  if (RowSortOperators.includes(operator as RowSortOperator)) {
    if (queryKey !== operator) {
      throw new Error(`operator '${operator}' should has no prefix`);
    }

    (typeof value === "string" ? [value] : value).forEach((item) => {
      try {
        const columnIndex = columnPicker(item).columnIndex;
        result.rowSortOperators.push({ columnIndex, isAsc: true });

        return;
      } catch (error) {
        const isAsc = item.startsWith("+")
          ? true
          : item.startsWith("-")
          ? false
          : undefined;
        if (isAsc == null) {
          throw error;
        } else {
          const columnIndex = columnPicker(item.substring(1)).columnIndex;
          result.rowSortOperators.push({ columnIndex, isAsc });
        }
      }
    });

    return;
  }

  // case 6: unsupported operator
  throw new Error(`unsupported operator '${operator}'`);
};
