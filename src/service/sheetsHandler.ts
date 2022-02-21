import * as Koa from "koa";
import { getTable, listTable } from "../lib/sheets";

class SheetsHandler {
  constructor() {}
  static methodHandlerMapping = {
    GET: SheetsHandler.get,
  };
  static supportedMethods = Object.keys(SheetsHandler.methodHandlerMapping);

  static async rest(ctx: Koa.Context) {
    try {
      // verify http method
      const method = ctx.request.method;
      if (!SheetsHandler.supportedMethods.includes(method)) {
        throw new Error(
          `unsupported http method \'${method}\', opts: ${SheetsHandler.supportedMethods.join(
            ","
          )}`
        );
      }

      // handling
      await (SheetsHandler.methodHandlerMapping as any)[method](ctx);
    } catch (err) {
      ctx.throw(403, err);
    }
  }

  static async get(ctx: Koa.Context) {
    ctx.body = listTable({});
  }
}

export default SheetsHandler;
