import {
  AtomicValueCondition,
  AtomicValueOperator,
  ValueDataType,
} from "./query";
import { FloatRegex } from "./regex";

export class SheetColumn {
  columnIndex: number;
  titlesInLowerCase: string;
  title: string;
  dataType: ValueDataType;
  cells: ValueDataType[];
  constructor(title: string, index: number) {
    this.columnIndex = index;
    this.titlesInLowerCase = title.toLowerCase();
    this.title = title;
    this.dataType = "string";
    this.cells = [];
  }

  push(cell: ValueDataType) {
    let _cell: ValueDataType;
    switch (this.dataType) {
      case "string":
        _cell = `${cell}`;
        break;

      case "number":
        if (typeof cell === "number") {
          _cell = cell;
        } else {
          this.dataType = "string";
          _cell = `${cell}`;
        }
        break;

      default:
        if (typeof cell === "number") {
          this.dataType = "number";
          _cell = cell;
        } else {
          this.dataType = "string";
          _cell = `${cell}`;
        }
        break;
    }

    this.cells.push(_cell);
  }

  private _parseValueAsSameDataType = (
    value: ValueDataType,
    operator: AtomicValueOperator
  ) => {
    const t = typeof value;
    if (this.dataType === "number") {
      if (operator === "$like")
        throw new Error(`cannot use operator $like on number column`);

      if (t === "number") {
        return value;
      } else {
        if (FloatRegex.test(value as string))
          return parseFloat(value as string) as any as ValueDataType;
        throw new Error(
          `invalid format when parse string("${value}") as float`
        );
      }
    } else {
      return `${value}` as ValueDataType;
    }
  };

  parseValueAsSameDataType = (
    value: ValueDataType | ValueDataType[],
    operator: AtomicValueOperator
  ) => {
    if (Array.isArray(value)) {
      if (["$lt", "$lte", "$gt", "$gte", ""].includes(operator)) {
        throw new Error(`duplicated operator(${operator})`);
      }
      return value.map((v) => this._parseValueAsSameDataType(v, operator));
    }

    return this._parseValueAsSameDataType(value, operator);
  };

  testConditionOnRow = (condition: AtomicValueCondition, row: number) => {
    const value = this.cells[row];
    const conValue = condition.value;
    switch (condition.operator) {
      case "$lt":
        return value < (conValue as ValueDataType);
      case "$lte":
        return value <= (conValue as ValueDataType);
      case "$gt":
        return value > (conValue as ValueDataType);
      case "$gte":
        return value >= (conValue as ValueDataType);
      case "":
        return value === (conValue as ValueDataType);
      case "$in":
        return (Array.isArray(conValue) ? conValue : [conValue]).includes(
          value
        );
      case "$ne":
        return !(Array.isArray(conValue) ? conValue : [conValue]).includes(
          value
        );
      case "$like":
        return (
          (
            (Array.isArray(conValue) ? conValue : [conValue]) as string[]
          ).findIndex((pattern) => (value as string).indexOf(pattern) >= 0) >= 0
        );

      default:
        throw new Error(`unsupported operator(${condition.operator})`);
    }
  };

  compareRows = (a: number, b: number) => {
    if (this.dataType === 'number') {
      return (this.cells[a] as any as number) - ((this.cells[b] as any as number));
    } else {
      return (this.cells[a] as any as string).localeCompare(((this.cells[b] as any as string)))
    }
  }
}
