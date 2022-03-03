import * as fss from "fs";

export const getFileName = (filepath: string) => {
  return filepath.split("\\").pop().split("/").pop();
};

export const filesInFolder = (
  path: string,
  allowedExts: string[],
  throwIfNotExists: boolean = true
) => {
  var filepaths: string[] = [];
  if (fss.existsSync(path)) {
    if (fss.lstatSync(path).isDirectory()) {
      fss.readdirSync(path).forEach((_path) => {
        const _filepaths = filesInFolder(
          path + "/" + _path,
          allowedExts,
          throwIfNotExists
        );
        if (_filepaths.length > 0) {
          filepaths = filepaths.concat(_filepaths);
        }
      });
    } else {
      var re = /(?:\.([^.]+))?$/;
      var ext = re.exec(path)[1];
      var extLowerCase = ext.toLowerCase();
      if (allowedExts.includes(extLowerCase)) {
        if (extLowerCase === "xlsx" && getFileName(path).startsWith("~$")) {
          console.info(`[Info] ignore file at path(${path})}`);
        } else {
          filepaths.push(path);
        }
      } else {
        console.info(
          `[Info] ignore file at path(${path}) with disallowed ext, opts: ${allowedExts.join(
            ", "
          )}`
        );
      }
    }
  } else {
    const errMsg = `path(${path}) not exists`;
    if (throwIfNotExists) {
      throw new Error(errMsg);
    } else {
      console.warn(`[Warn] ${errMsg}`);
    }
  }

  return filepaths;
};

export const filesInFolders = (
  paths: string[],
  allowedExts: string[],
  throwIfNotExists: boolean = true
) => {
  var filepaths: string[] = [];
  paths.forEach((path) => {
    const _filepaths = filesInFolder(path, allowedExts, throwIfNotExists);
    if (_filepaths.length > 0) {
      filepaths = filepaths.concat(_filepaths);
    }
  });
  return filepaths;
};
