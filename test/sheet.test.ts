import * as Koa from "koa";
import { agent as request } from "supertest";
import { initApp } from "../src/app";

var app: Koa<Koa.DefaultState, Koa.DefaultContext>;
beforeAll(async () => {
  console.info = () => {};
  app = await initApp();
});

test("Http Methods", async () => {
  let response = await request(app.callback()).head("/sheets/3584589747");
  expect(response.status).toBe(403);

  response = await request(app.callback()).post("/sheets/3584589747");
  expect(response.status).toBe(403);

  response = await request(app.callback()).patch("/sheets/3584589747");
  expect(response.status).toBe(403);

  response = await request(app.callback()).delete("/sheets/3584589747");
  expect(response.status).toBe(403);
});

test("Get sheet - no querying", async () => {
  const response = await request(app.callback()).get("/sheets/3584589747");
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(53);
  expect(result.count).toBe(result.data.length);

  const row = (result.data as any[]).find((row) => row.ID === 1);
  expect(row.Day).toBe(20170102);
});

test("Get sheet - = - not found", async () => {
  const response = await request(app.callback()).get(
    "/sheets/3584589747?day=20220215"
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(0);
  expect(result.count).toBe(result.data.length);
});

test("Get sheet - =", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?day=20220221`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(1);
  expect(result.count).toBe(result.data.length);
  expect((result.data as any[])[0].Day).toBe(20220221);
});

test("Get sheet - = - string", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?Description=`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(52);
  expect(result.count).toBe(result.data.length);
  expect((result.data as any[])[0].Description).toBe("");
});

test("Get sheet - $lt, $gt", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?day$gt=20211231&day$lt=20230101`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(8);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect(item.Day).toBeGreaterThan(20211231);
    expect(item.Day).toBeLessThan(20230101);
  });
});

test("Get sheet - $lt, $gt - string", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?holiday$gt=A&holiday$lt=F`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);
  expect(result.count).toBe(6);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect((item.Holiday as string).localeCompare("A")).toBe(1);
    expect((item.Holiday as string).localeCompare("F")).toBe(-1);
  });
});

test("Get sheet - $lte, $gte", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?day$gte=20220117&day$lte=20220415`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(3);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect(item.Day).toBeGreaterThanOrEqual(20220117);
    expect(item.Day).toBeLessThanOrEqual(20220415);
  });
});

test("Get sheet - $lte, $gte - string", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?holiday$gte=Christmas&holiday$lte=Independence Day`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);
  expect(result.count).toBe(19);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect((item.Holiday as string).localeCompare("Christmas")).toBeGreaterThan(
      -1
    );
    expect(
      (item.Holiday as string).localeCompare("Independence Day")
    ).toBeLessThan(1);
  });
});

test("Get sheet - $in", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?day$in=20220117&day$in=20220415&Exchange$in=NYSE`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(2);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect([20220117, 20220415]).toContain(item.Day);
  });
});

test("Get sheet - $in - string", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?holiday$in=Washington%E2%80%99s%20Birthday&holiday$in=Thanksgiving Day`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(11);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect(["Washington’s Birthday", "Thanksgiving Day"]).toContain(
      item.Holiday
    );
  });
});

test("Get sheet - $ne - number", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?day$gt=20211231&day$lt=20230101&day$ne=20220117&day$ne=20220415`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(6);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect([20220117, 20220415]).not.toContain(item.Day);
  });
});

test("Get sheet - $ne - string", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?Exchange$ne=NYSE`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(0);
  expect(result.count).toBe(result.data.length);
});

test("Get sheet - $like", async () => {
  let response = await request(app.callback()).get(
    `/sheets/3584589747?day$like=2021`
  );
  expect(response.status).toBe(403);

  response = await request(app.callback()).get(
    `/sheets/3584589747?holiday$like=New`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(5);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect(item.Holiday as string).toMatch(/New/);
  });
});

test("Get sheet - $select + $limit", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?$select=day&$select=holiday&$select=exchange&$limit=2`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(2);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect(item.ID != null).toBe(false);
    expect(item.Day != null).toBe(true);
    expect(item.Exchange != null).toBe(true);
    expect(item.Holiday != null).toBe(true);
    expect(item.Description != null).toBe(false);
  });
});

test("Get sheet - $deselect + $limit", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?$deselect=id&$deselect=description&$limit=2`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(2);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    expect(item.ID != null).toBe(false);
    expect(item.Day != null).toBe(true);
    expect(item.Exchange != null).toBe(true);
    expect(item.Holiday != null).toBe(true);
    expect(item.Description != null).toBe(false);
  });
});

test("Get sheet - $skip + $limit", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?$skip=2&$limit=2`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(2);
  expect(result.count).toBe(result.data.length);
  expect((result.data as any[])[0].Day).toBe(20170220);
  expect((result.data as any[])[1].Day).toBe(20170414);
});

test("Get sheet - $sort", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?$sort=Holiday&$sort=-day`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(53);
  expect(result.count).toBe(result.data.length);

  const data: { Day: number; Holiday: string }[] = result.data;
  for (let index = 0; index < data.length - 1; index++) {
    const curr = data[index];
    const next = data[index + 1];

    const compareHoliday = curr.Holiday.localeCompare(next.Holiday);
    expect(compareHoliday).toBeLessThan(1);
    if (compareHoliday === 0) {
      const compareDay =
        curr.Day > next.Day ? 1 : curr.Day === next.Day ? 0 : -1;
      expect(compareDay).toBeGreaterThan(-1);
    }
  }
});

test("Get sheet - $or", async () => {
  const response = await request(app.callback()).get(
    `/sheets/3584589747?$or[0]day$gte=20200101&$or[0]holiday=Christmas&$or[1]day$lt=20200101&$or[1]holiday$like=Washington`
  );
  expect(response.status).toBe(200);

  const result = JSON.parse(response.text);

  expect(result.count).toBe(5);
  expect(result.count).toBe(result.data.length);
  (result.data as any[]).forEach((item) => {
    const _item: { Day: number; Holiday: string } = item;
    if (_item.Day >= 20200101) {
      expect(item.Holiday).toBe("Christmas");
    } else {
      expect(item.Holiday).toMatch(/Washington/);
    }
  });
});
