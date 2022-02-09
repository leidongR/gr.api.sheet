import * as XLSX from "xlsx";
import { getFileName } from "./file";

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
    console.log(data);

    // check rows count
    if (data.length < 2) {
        throw new Error(`no content in local file(${filepath})`)
    }

    // verify title row
    const titleRow = data[0];
    titleRow.map(title => `${title}`)

    // add to cache
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
