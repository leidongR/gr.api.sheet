import * as XLSX from "xlsx";
import { hashString } from "./hash";
import { Table } from "./table";

export interface LocalFile {
  filepath: string;
  type: "excel" | "csv";
  sheetName?: string; // sheet name of excel file; undefined for csv file
}

export type SheetSource = LocalFile;

export interface Sheet {
  id: string; // unique id of sheet
  source: SheetSource;
}

const __sharedTables: { [key: string]: Table } = {};
export const getTable = (tableId: string, opts: { [key: string]: string }) => {
  if (!Object.prototype.hasOwnProperty.call(__sharedTables, tableId)) {
    throw new Error(`not found table with id ${tableId}`);
  }

  return __sharedTables[tableId].find(opts);
};

export const listTable = (opts: { [key: string]: string }) => {
  const results = [];
  for (const key in __sharedTables) {
    if (Object.prototype.hasOwnProperty.call(__sharedTables, key)) {
      results.push({
        tableId: key,
        ...__sharedTables[key].medadata,
      });
    }
  }
  return {
    count: results.length,
    data: results,
  };
};

const readLocalExcelFile = (filepath: string) => {
  var workbook = XLSX.readFile(filepath);
  var sheetNames = workbook.SheetNames;
  sheetNames.forEach((sheetName) => {
    var sheet = workbook.Sheets[sheetName];
    var data: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
      raw: true,
      rawNumbers: true,
    });

    // check rows count
    if (data.length < 2) {
      throw new Error(`no content in local file(${filepath})`);
    }

    // build table
    const tableMeta = { file: filepath, sheet: sheetName };
    const tableId = hashString(JSON.stringify(tableMeta));
    const table = new Table(tableId, { file: filepath, sheet: sheetName });

    table.addTitles(data[0]);

    for (let index = 0; index < data.length; index++) {
      const rowNum = index + 1;
      if (rowNum === 1) table.addTitles(data[0]);
      else table.addCells(data[index], rowNum);
    }

    // add to cache
    __sharedTables[table.id] = table;
  });
};

export const readLocalFile = (filepath: string) => {
  var re = /(?:\.([^.]+))?$/;
  var ext = re.exec(filepath)[1];
  var extLowerCase = ext.toLowerCase();
  if (extLowerCase === "xlsx") {
    readLocalExcelFile(filepath);
  } else {
    throw new Error(
      `unsupported local file type(\'.${ext}\'), full file path: ${filepath}`
    );
  }
};
