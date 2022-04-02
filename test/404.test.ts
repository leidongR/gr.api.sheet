import * as Koa from "koa";
import { agent as request } from "supertest";
import { initApp } from "../src/app";

var app: Koa<Koa.DefaultState, Koa.DefaultContext>;
beforeAll(async () => {
  console.info = () => {};
  app = await initApp();
});

test("Path must not empty", async () => {
  const response = await request(app.callback()).get("/");
  expect(response.status).toBe(404);
});
