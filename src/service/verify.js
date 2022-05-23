const { selectUserState } = require("./common");
const { question, logger } = require("../util");
const fs = require("fs");
const readline = require("readline");
const replace = require("replace-in-file");

async function doVerify(privateKey, address) {
  const userState = await selectUserState(privateKey, address);
  return userState.onboarded;
}

module.exports = async function () {
  const accountsPath = await question("Accounts Path: ");
  if (!fs.existsSync(accountsPath)) {
    throw new Error("Accounts Path not exists!");
  }
  const fileStream = fs.createReadStream(accountsPath);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    const privateKey = line.match(/0x[^\s]{64}/)[0];
    const address = line.match(/0x[^\s]{40}/)[0];
    try {
      logger.info("开始验证，钱包地址：" + address);
      const status = await doVerify(privateKey, address);
      replace.replaceInFileSync({
        files: accountsPath,
        from: new RegExp(`${address}.*$`, "m"),
        to: address + "\t" + status,
      });
      logger.info("验证完成，空投状态：" + status);
    } catch (error) {
      logger.info(
        "验证失败：" + (JSON.stringify(error?.response?.data) || error?.message)
      );
    }
  }
  logger.info(`全部验证完毕，打开 ${accountsPath} 查看结果！`);
};
