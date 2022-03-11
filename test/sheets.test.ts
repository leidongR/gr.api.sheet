const request = require('supertest');

test('List sheets', async () => {
    const app = (process as any).app;
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
