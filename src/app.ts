import * as Koa from "koa";
import * as cors from "@koa/cors";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import SheetsHandler from "./service/sheetsHandler";
import config = require("config");
import { readLocalFile } from "./lib/sheets";
import { filesInFolders } from "./lib/file";
import SheetHandler from "./service/sheetHandler";

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
  console.info(`[Info] begin to init app`);

  // init local files
  const localPathes = config.get("source.local") as string[];
  const localFilePaths = filesInFolders(localPathes, ["xlsx"], true);
  localFilePaths.forEach((filepath) => {
    readLocalFile(filepath);
  });

  console.info(`[Info] init app successfully`);

  return app;
};
