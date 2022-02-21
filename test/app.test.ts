const request = require('supertest');
import {App, initApp} from '../src/app';


test('Init App', async () => {
    await initApp();
});


test('Path must not empty', async () => {
    const response = await request(App.callback()).get('/');
    expect(response.status).toBe(404);
});

test('List sheets', async () => {
    const response = await request(App.callback()).get('/sheets');
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBe(result.data.length);

    const sheet = (result.data as any[]).find(sheet => sheet.tableId === "2602258009");
    expect(sheet.file).toBe("test_files/us-stock-holiday.xlsx");
    expect(sheet.sheet).toBe("us-stock-holiday");
});

test('Get sheet - no querying', async () => {
    const response = await request(App.callback()).get('/sheets');
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBe(result.data.length);

    const sheet = (result.data as any[]).find(sheet => sheet.tableId === "2602258009");
    expect(sheet.file).toBe("test_files/us-stock-holiday.xlsx");
    expect(sheet.sheet).toBe("us-stock-holiday");
});