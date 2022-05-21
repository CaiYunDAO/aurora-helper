const { goto, getNonce, metamaskLogin } = require("../api/aurora");
const { getBrowserPath, sleep, question, logger } = require("../util");
const ethers = require("ethers");
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const readline = require("readline");
const replace = require("replace-in-file");

async function doVerify(privateKey, address) {
  const client = await goto("/login");
  const { nonce } = await getNonce(client, { address });
  const wallet = new ethers.Wallet(privateKey);
  const signedMessage = await wallet.signMessage(`Log in to Aurora+. 

Security code: ${nonce}.`);
  const { link } = await metamaskLogin(client, {
    address,
    signedMessage,
  });

  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    defaultViewport: null,
    timeout: 120000,
  });
  const page = await browser.newPage();
  await page.goto(link);
  const response = await page.waitForResponse((response) => {
    const request = response.request();
    return (
      request.method() == "GET" &&
      request.url().indexOf("/rest/v1/users?select=") > -1
    );
  });
  const userState = await response.json();
  await browser.close();
  return userState[0].onboarded;
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
    const arr = line.split("\t");
    const privateKey = arr[1];
    const address = arr[2];
    let status = arr.length >= 4 ? arr[3] === "true" : false;
    try {
      logger.info("开始验证，钱包地址：" + address);
      if (!status) {
        status = await doVerify(privateKey, address);
        replace.replaceInFileSync({
          files: accountsPath,
          from: new RegExp(`${address}.*$`, "m"),
          to: address + "\t" + status,
        });
      }
      logger.info("验证完成，空投状态：" + status);
    } catch (error) {
      logger.info(
        "验证失败：" + (JSON.stringify(error?.response?.data) || error?.message)
      );
    }
  }
  logger.info(`全部验证完毕，打开 ${accountsPath} 查看结果！`);
};
