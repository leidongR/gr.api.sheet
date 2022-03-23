import * as Koa from "koa";
import { agent as request } from "supertest";
import { initApp } from "../src/app";

var app: Koa<Koa.DefaultState, Koa.DefaultContext>;
beforeAll(async () => {
    console.info = () => {};
    app = await initApp();
});

test('Http Methods', async () => {
    let response = await request(app.callback()).head('/sheets/3692307804');
    expect(response.status).toBe(403);

    response = await request(app.callback()).post('/sheets/3692307804');
    expect(response.status).toBe(403);

    response = await request(app.callback()).patch('/sheets/3692307804');
    expect(response.status).toBe(403);

    response = await request(app.callback()).delete('/sheets/3692307804');
    expect(response.status).toBe(403);
});

test('Get sheet - no querying', async () => {
    const response = await request(app.callback()).get('/sheets/3692307804');
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(53);
    expect(result.count).toBe(result.data.length);

    const row = (result.data as any[]).find(row => row.序号 === 1);
    expect(row.日期).toBe(20170102);
});

test('Get sheet - = - not found', async () => {
    const response = await request(app.callback()).get('/sheets/3692307804?%E6%97%A5%E6%9C%9F=20220215');
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(0);
    expect(result.count).toBe(result.data.length);
});

test('Get sheet - =', async () => {
    const day = 20220221;
    const response = await request(app.callback()).get(`/sheets/3692307804?%E6%97%A5%E6%9C%9F=20220221`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(1);
    expect(result.count).toBe(result.data.length);
    expect((result.data as any[])[0].日期).toBe(20220221);
});

test('Get sheet - = - string', async () => {
    const day = 20220221;
    const response = await request(app.callback()).get(`/sheets/3692307804?%E8%AF%B4%E6%98%8E=%E6%B5%8B%E8%AF%95%E8%AF%B4%E6%98%8E`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(52);
    expect(result.count).toBe(result.data.length);
    expect((result.data as any[])[0].说明).toBe("测试说明");
});

test('Get sheet - $lt, $gt', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?%E6%97%A5%E6%9C%9F$gt=20211231&%E6%97%A5%E6%9C%9F$lt=20230101`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(8);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect(item.日期).toBeGreaterThan(20211231);
        expect(item.日期).toBeLessThan(20230101);
    });
});

test('Get sheet - $lt, $gt - string', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?%E5%81%87%E6%97%A5$gt=A&%E5%81%87%E6%97%A5$lt=F`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    expect(result.count).toBe(6);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect((item.假日 as string).localeCompare('A')).toBe(1);
        expect((item.假日 as string).localeCompare('F')).toBe(-1);
    });
});

test('Get sheet - $lte, $gte', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?%E6%97%A5%E6%9C%9F$gte=20220117&%E6%97%A5%E6%9C%9F$lte=20220415`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(3);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect(item.日期).toBeGreaterThanOrEqual(20220117);
        expect(item.日期).toBeLessThanOrEqual(20220415);
    });
});

test('Get sheet - $lte, $gte - string', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?%E5%81%87%E6%97%A5$gte=Christmas&%E5%81%87%E6%97%A5$lte=Independence Day`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    expect(result.count).toBe(19);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect((item.假日 as string).localeCompare('Christmas')).toBeGreaterThan(-1);
        expect((item.假日 as string).localeCompare('Independence Day')).toBeLessThan(1);
    });
});

test('Get sheet - $in', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?%E6%97%A5%E6%9C%9F$in=20220117&%E6%97%A5%E6%9C%9F$in=20220415&%E4%BA%A4%E6%98%93%E6%89%80$in=NYSE`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(2);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect([20220117, 20220415]).toContain(item.日期)
    });
});

test('Get sheet - $in - string', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?%E5%81%87%E6%97%A5$in=Washington%E2%80%99s%20Birthday&%E5%81%87%E6%97%A5$in=Thanksgiving Day`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(11);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect(["Washington’s Birthday", "Thanksgiving Day"]).toContain(item.假日)
    });
});

test('Get sheet - $ne - number', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?%E6%97%A5%E6%9C%9F$gt=20211231&%E6%97%A5%E6%9C%9F$lt=20230101&%E6%97%A5%E6%9C%9F$ne=20220117&%E6%97%A5%E6%9C%9F$ne=20220415`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(6);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect([20220117, 20220415]).not.toContain(item.日期)
    });
});

test('Get sheet - $ne - string', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?%E4%BA%A4%E6%98%93%E6%89%80$ne=NYSE`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(0);
    expect(result.count).toBe(result.data.length);
});

test('Get sheet - $like', async () => {
    let response = await request(app.callback()).get(`/sheets/3692307804?%E6%97%A5%E6%9C%9F$like=2021`);
    expect(response.status).toBe(403);


    response = await request(app.callback()).get(`/sheets/3692307804?%E5%81%87%E6%97%A5$like=New`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(5);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect(item.假日 as string).toMatch(/New/);
    });
});

test('Get sheet - $select + $limit', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?$select=%E6%97%A5%E6%9C%9F&$select=%E5%81%87%E6%97%A5&$select=%E4%BA%A4%E6%98%93%E6%89%80&$limit=2`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(2);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect(item.序号 != null).toBe(false);
        expect(item.日期 != null).toBe(true);
        expect(item.交易所 != null).toBe(true);
        expect(item.假日 != null).toBe(true);
        expect(item.说明 != null).toBe(false);
    });
});

test('Get sheet - $deselect + $limit', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?$deselect=%E5%BA%8F%E5%8F%B7&$deselect=%E8%AF%B4%E6%98%8E&$limit=2`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(2);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        expect(item.序号 != null).toBe(false);
        expect(item.日期 != null).toBe(true);
        expect(item.交易所 != null).toBe(true);
        expect(item.假日 != null).toBe(true);
        expect(item.说明 != null).toBe(false);
    });
});

test('Get sheet - $skip + $limit', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?$skip=2&$limit=2`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(2);
    expect(result.count).toBe(result.data.length);
    expect((result.data as any[])[0].日期).toBe(20170220);
    expect((result.data as any[])[1].日期).toBe(20170414);
});

test('Get sheet - $sort', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?$sort=%E5%81%87%E6%97%A5&$sort=-%E6%97%A5%E6%9C%9F`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(53);
    expect(result.count).toBe(result.data.length);

    const data: {日期: number, 假日: string}[] = result.data;
    for (let index = 0; index < data.length - 1; index++) {
        const curr = data[index];
        const next = data[index + 1];

        const compareHoliday = curr.假日.localeCompare(next.假日);
        expect(compareHoliday).toBeLessThan(1);
        if (compareHoliday === 0) {
            const compareDay = curr.日期 > next.日期 ? 1 : (curr.日期 === next.日期 ? 0 : -1);
            expect(compareDay).toBeGreaterThan(-1);
        }
    }
});

test('Get sheet - $or', async () => {
    const response = await request(app.callback()).get(`/sheets/3692307804?$or[0]%E6%97%A5%E6%9C%9F$gte=20200101&$or[0]%E5%81%87%E6%97%A5=Christmas&$or[1]%E6%97%A5%E6%9C%9F$lt=20200101&$or[1]%E5%81%87%E6%97%A5$like=Washington`);
    expect(response.status).toBe(200);

    const result = JSON.parse(response.text);
    
    expect(result.count).toBe(5);
    expect(result.count).toBe(result.data.length);
    (result.data as any[]).forEach(item => {
        const _item: {日期: number; 假日: string} = item;
        if (_item.日期 >= 20200101) {
            expect(item.假日).toBe("Christmas");
        } else {
            expect(item.假日).toMatch(/Washington/);
        }
        
    });
});