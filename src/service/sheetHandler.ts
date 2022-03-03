import * as Koa from "koa";
import { getSheet } from "../lib/sheets";

class SheetHandler {
  constructor() {}
  static methodHandlerMapping = {
    GET: SheetHandler.get,
  };
  static supportedMethods = Object.keys(SheetHandler.methodHandlerMapping);

  static async rest(ctx: Koa.Context) {
    try {
      // verify http method
      const method = ctx.request.method;
      if (!SheetHandler.supportedMethods.includes(method)) {
        throw new Error(
          `unsupported http method \'${method}\', opts: ${SheetHandler.supportedMethods.join(
            ","
          )}`
        );
      }

      // verify sheet id
      var sheetId = ctx.request.path.substring("/sheets/".length);
      if (sheetId.endsWith("/")) {
        sheetId = sheetId.replace(/[/]+/g, "");
      }

      // handling
      await (SheetHandler.methodHandlerMapping as any)[method](ctx, sheetId);
    } catch (err) {
      ctx.throw(403, err);
    }
  }

  static async get(ctx: Koa.Context, sheetId: string) {
    ctx.body = getSheet(sheetId).find(ctx.query);
  }
}

export default SheetHandler;
