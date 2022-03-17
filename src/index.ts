import config = require("config");
import { initApp } from "./app";

const port = process.env.PORT || config.get("port");


initApp()
  .then((app) => {
    const server = app.listen(port);

    process.on("unhandledRejection", (reason, p) =>
      console.error(
        `[Error] Unhandled Rejection at: Promise ${p}, details: ${reason}`
      )
    );

    server.on("listening", () => console.info(`[Info] app started on ${port}`));
  })
  .catch((e) => {
    console.error(`[Error] init app failed with error: ${e}`);
  });
