import config = require("config");
import { App, initApp } from "./app";

const port = process.env.PORT || config.get("port");

console.log(`[Info] begin to init app`);
initApp()
  .then((_) => {
    console.log(`[Info] init app successfully`);

    const server = App.listen(port);

    process.on("unhandledRejection", (reason, p) =>
      console.log(
        `[Error] Unhandled Rejection at: Promise ${p}, details: ${reason}`
      )
    );

    server.on("listening", () => console.log(`[Info] app started on ${port}`));
  })
  .catch((e) => {
    console.log(`[Error] init app failed with error: ${e}`);
  });
