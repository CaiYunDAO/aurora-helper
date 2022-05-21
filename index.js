const { question } = require("./src/util");
const path = require("path");
const fs = require("fs");

const serviceMap = {
  1: require("./src/service/signup"),
  2: require("./src/service/verify"),
};
(async () => {
  console.log(fs.readFileSync(path.resolve(__dirname, "banner.txt"), "utf8"));
  const serviceType = await question("服务类型(1.注册 2.验证)：");
  await serviceMap[serviceType]();
})();
