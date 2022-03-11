const request = require('supertest');

test('Path must not empty', async () => {
    const app = (process as any).app;
    const response = await request(app.callback()).get('/');
    expect(response.status).toBe(404);
});
