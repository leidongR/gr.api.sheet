const upper_char_ref_num = "A".charCodeAt(0) - 1;
const lower_char_ref_num = "a".charCodeAt(0) - 1;
export const min_columns_count = 1;
export const max_columns_count = 27 * 26;

/**
 * transfer column number as column name
 * @param num column number, from 1 to 27 * 26
 * @returns A, B, C, ... , Z, AA, AB, ... or ZZ
 */
export const num_to_column = (num: number): string => {
  if (num < min_columns_count || num > max_columns_count) {
    throw new Error(
      `column number(${num}) is out of range [${min_columns_count}, ${max_columns_count}]`
    );
  }

  if (num <= 26) return String.fromCharCode(upper_char_ref_num + num);

  let right = num % 26;
  if (right == 0) right = 26;
  let left = (num - right) / 26;
  return num_to_column(left) + num_to_column(right);
};

const char_to_num = (c: string): number => {
  let code = c.charCodeAt(0);
  let num = code - upper_char_ref_num;
  if (num >= 1 && num <= 26) return num;

  num = code - lower_char_ref_num;
  if (num >= 1 && num <= 26) return num;

  throw new Error(`column char(${c}) is is not in a~z, or A~Z`);
};

/**
 * transfer column name as column number
 * @param column column name, A, B, C, ... , Z, AA, AB, ... or ZZ
 * @returns column number, from 1 to 27 * 26
 */
export const column_to_num = (column: string): number => {
  const l = column.length;
  if (l === 0) throw new Error(`column is empty`);

  if (l > 2) throw new Error(`column is too long(> 2)`);

  if (l == 1) {
    return char_to_num(column);
  }

  return 26 * column_to_num(column[0]) + column_to_num(column[1]);
};
