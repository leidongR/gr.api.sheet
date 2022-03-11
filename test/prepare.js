const { initApp } = require("../src/app");

module.exports = async () => {
  process.app = await initApp();
};
