import * as Koa from "koa";
import { agent as request } from "supertest";
import { initApp } from "../src/app";

var app: Koa<Koa.DefaultState, Koa.DefaultContext>;
beforeAll(async () => {
    console.info = () => {};
    app = await initApp();
});

test('Http Methods', async () => {
    let response = await request(app.callback()).head('/sheets');
    expect(response.status).toBe(403);

    response = await request(app.callback()).post('/sheets');
    expect(response.status).toBe(403);

    response = await request(app.callback()).patch('/sheets');
    expect(response.status).toBe(403);

    response = await request(app.callback()).delete('/sheets');
    expect(response.status).toBe(403);
});

test('List sheets', async () => {
    const response = await request(app.callback()).get('/sheets');
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBe(result.data.length);

    const sheet = (result.data as any[]).find(sheet => sheet.sheetId === "3584589747");
    expect(sheet.filepath).toBe("test_files/us-stock-holiday.xlsx");
    expect(sheet.sheetName).toBe("us-stock-holiday");

    const schema = (sheet.schema as any[]);
    expect(schema.length).toBe(5);
    expect(schema[0].title).toBe("ID");
    expect(schema[0].dataType).toBe("number");
    expect(schema[2].title).toBe("Exchange");
    expect(schema[2].dataType).toBe("string");
});

test('List sheets - no schema', async () => {
    const response = await request(app.callback()).get('/sheets?schema=false');
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBe(result.data.length);

    const sheet = (result.data as any[]).find(sheet => sheet.sheetId === "3584589747");
    expect(sheet.schema).toBe(undefined);
});
