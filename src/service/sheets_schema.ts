import * as Koa from "koa";

class SheetsSchemaHandler {
  constructor() {}
  static methodHandlerMapping = {
    "GET": SheetsSchemaHandler.get
  }
  static supportedMethods = Object.keys(SheetsSchemaHandler.methodHandlerMapping)


  static async rest(ctx: Koa.Context) {
    try {
      // verify http method
      const method = ctx.request.method;
      if (!SheetsSchemaHandler.supportedMethods.includes(method)) {
        throw new Error(`unsupported http method \'${method}\', opts: ${SheetsSchemaHandler.supportedMethods.join(",")}`);
      }

      // verify sheet id
      const sheetId = ctx.request.path.substring("/sheets/".length, ctx.request.path.length - "/schema".length)

      // handling
      await (SheetsSchemaHandler.methodHandlerMapping as any)[method](ctx, sheetId);
    } catch (err) {
      ctx.throw(403, err);
    }
  }

  static async get(ctx: Koa.Context, sheetId: string) {
    ctx.body = {
      method: ctx.request.method,
      url: ctx.request.path,
      sheetId: sheetId
    }
  }


}

export default SheetsSchemaHandler;
