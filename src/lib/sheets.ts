import * as XLSX from "xlsx";
import { hashString } from "./hash";
import { Sheet } from "./sheet";

const __sharedSheets: { [key: string]: Sheet } = {};
export const getSheet = (sheetId: string) => {
  if (!Object.prototype.hasOwnProperty.call(__sharedSheets, sheetId)) {
    throw new Error(`not found sheet with id ${sheetId}`);
  }

  return __sharedSheets[sheetId];
};

export const listSheet = (query: NodeJS.Dict<string | string[]>) => {
  // get query opts
  const includeSchema =
    `${query.schema || "true"}`.toLocaleLowerCase() === "true";

  // build results
  const results = [];
  for (const key in __sharedSheets) {
    if (Object.prototype.hasOwnProperty.call(__sharedSheets, key)) {
      const sheet = __sharedSheets[key];
      const sheetInfo = {
        sheetId: key,
        ...sheet.medadata,
      };
      if (includeSchema) {
        (sheetInfo as any)["schema"] = sheet.schema();
      }

      results.push(sheetInfo);
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
    var excelSheet = workbook.Sheets[sheetName];
    var data: any[][] = XLSX.utils.sheet_to_json(excelSheet, {
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

    // build sheet
    const sheetMeta = { filepath, sheetName };
    const sheetId = hashString(JSON.stringify(sheetMeta));
    const sheet = new Sheet(sheetId, { filepath, sheetName });

    sheet.addTitles(data[0]);

    for (let index = 0; index < data.length; index++) {
      const rowNum = index + 1;
      if (rowNum === 1) sheet.addTitles(data[0]);
      else sheet.addCells(data[index], rowNum);
    }

    // add to cache
    __sharedSheets[sheet.id] = sheet;
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
