import * as Koa from "koa";
import { agent as request } from "supertest";
import { initApp } from "../src/app";

var app: Koa<Koa.DefaultState, Koa.DefaultContext>;
beforeAll(async () => {
    console.info = () => {};
    app = await initApp();
});

test('Error - invalid query key', async () => {
    const response = await request(app.callback()).get('/sheets/3584589747?name=stock');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/field 'name' not exists/)
});

test('Error - unsupported operator', async () => {
    let response = await request(app.callback()).get('/sheets/3584589747?$name=stock');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/unsupported operator '\$name'/)

    response = await request(app.callback()).get('/sheets/3584589747?id$or=stock');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/unsupported operator '\$or'/)
});

test('Error - operator duplicated', async () => {
    let response = await request(app.callback()).get('/sheets/3584589747?$skip=2&$skip=4');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/operator '\$skip' are duplicated/)

    response = await request(app.callback()).get('/sheets/3584589747?$limit=2&$limit=4');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/operator '\$limit' are duplicated/)

    response = await request(app.callback()).get('/sheets/3584589747?day=20220202&day=20210101');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/duplicated operator\(\)/)

    response = await request(app.callback()).get('/sheets/3584589747?day$lt=20220202&day$lt=20210101');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/duplicated operator\(\$lt\)/)

    response = await request(app.callback()).get('/sheets/3584589747?day$lte=20220202&day$lte=20210101');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/duplicated operator\(\$lte\)/)

    response = await request(app.callback()).get('/sheets/3584589747?day$gt=20220202&day$gt=20210101');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/duplicated operator\(\$gt\)/)

    response = await request(app.callback()).get('/sheets/3584589747?day$gte=20220202&day$gte=20210101');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/duplicated operator\(\$gte\)/)
});

test('Error - operator has prefix', async () => {
    let response = await request(app.callback()).get('/sheets/3584589747?day$skip=2');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/operator '\$skip' should has no prefix/)

    response = await request(app.callback()).get('/sheets/3584589747?day$limit=2');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/operator '\$limit' should has no prefix/)

    response = await request(app.callback()).get('/sheets/3584589747?day$sort=2');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/operator '\$sort' should has no prefix/)
});

test('Error - non-integer value', async () => {
    let response = await request(app.callback()).get('/sheets/3584589747?$skip=b');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/operator '\$skip' has non-integer value/)

    response = await request(app.callback()).get('/sheets/3584589747?$limit=2a');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/operator '\$limit' has non-integer value/)
});

test('Error - field not exist', async () => {
    let response = await request(app.callback()).get('/sheets/3584589747?name=tim');
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/field 'name' not exists/)
});

test('Error - no fields output', async () => {
    const response = await request(app.callback()).get(`/sheets/3584589747?$deselect=id&$select=id`);
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/all columns are ignored to output/)
});

test('Error - $like on number', async () => {
    const response = await request(app.callback()).get(`/sheets/3584589747?Day$like=2021`);
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/cannot use operator \$like on number column/)
});

test('Error - invalid format when parse string as float', async () => {
    const response = await request(app.callback()).get(`/sheets/3584589747?Day=2021b`);
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/invalid format when parse string/)
});

test('Error - not found sheet', async () => {
    const response = await request(app.callback()).get(`/sheets/111`);
    expect(response.status).toBe(403);
    expect(response.text).toMatch(/not found sheet with id 111/)
});