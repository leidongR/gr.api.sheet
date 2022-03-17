import * as Koa from "koa";
import { agent as request } from "supertest";
import { initApp } from "../src/app";

var app: Koa<Koa.DefaultState, Koa.DefaultContext>;
beforeAll(async () => {
    console.info = () => {};
    app = await initApp();
});

test('Get sheet - no querying', async () => {
    const response = await request(app.callback()).get('/sheets/3584589747');
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(53);
    expect(result.count).toBe(result.data.length);

    const row = (result.data as any[]).find(row => row.ID === 1);
    expect(row.Day).toBe(20170102);
});
