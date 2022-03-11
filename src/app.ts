import * as Koa from "koa";
import * as cors from "@koa/cors";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import * as fss from "fs";
import * as fs from "fs/promises";
import SheetsHandler from "./service/sheetsHandler";
import { getProcessEnv } from "./lib/fieldPicker";
import config = require("config");
import { readLocalFile } from "./lib/sheets";
import { filesInFolders } from "./lib/file";
import SheetHandler from "./service/sheetHandler";

// check required envs
const initedMark = getProcessEnv("APP_INITED_MARK", "/tmp/isAppInited");

const app = new Koa();
const router = new Router();
app.use(cors());

// Rest Handler
router.all("(/sheets/[^/]+[/]*)", SheetHandler.rest);
router.all("(/sheets[/]*)", SheetsHandler.rest);

// parse request body
app.use(bodyParser());
//Use the Router on the sub routes
app.use(router.routes());

export const initApp = async () => {
  console.log(`[Info] begin to init app`);

  // delete mark file
  if (fss.existsSync(initedMark)) await fs.rm(initedMark);

  // init local files
  const localPathes = config.get("source.local") as string[];
  const localFilePaths = filesInFolders(localPathes, ["xlsx", "csv"], true);
  localFilePaths.forEach((filepath) => {
    readLocalFile(filepath);
  });

  // create mark file. this file is used by readinessProbe
  await fs.writeFile(initedMark, "inited");

  console.log(`[Info] init app successfully`);

  return app;
};
