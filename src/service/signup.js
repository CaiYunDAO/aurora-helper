const { goto, signup } = require("../api/aurora");
const { resolve } = require("../api/yescaptcha");
const { getAuroraEmail } = require("../api/fakemaild");
const {
  logger,
  sleep,
  question,
  getBrowserPath,
  randomString,
  randomEmail,
} = require("../util");
const ethers = require("ethers");
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

async function doSignup(mailDomain, clientKey) {
  const email = randomEmail(mailDomain);
  logger.info("邮箱生成完成！");

  // 处理验证码
  logger.info("验证码解析开始。。。");
  const captchaValue = await resolve(clientKey);
  logger.info("验证码解析完成！");
  // 创建钱包和签名
  const wallet = ethers.Wallet.createRandom();
  logger.info("钱包创建完成！");
  const timeString = new Date().toString();
  const signedMessage = await wallet.signMessage(`Sign up for Aurora+. 

Time: ${timeString}. 

Email: ${email}`);
  // 注册
  logger.info("aurora注册开始。。。");
  const client = await goto("/signup");
  const data = await signup(client, {
    email,
    account: wallet.address,
    captchaValue,
    timeString,
    signedMessage,
    visitorId: randomString(20),
  });
  logger.info("aurora注册完成：" + JSON.stringify(data));
  // 获取邮箱激活链接
  logger.info("获取邮箱激活链接开始。。。");
  const link = await getAuroraEmail(email);
  logger.info("获取邮箱激活链接完成！");
  const browser = await puppeteer.launch({
    executablePath: getBrowserPath(),
    headless: true,
    defaultViewport: null,
    timeout: 120000,
  });
  logger.info("激活链接开始。。。");
  const page = await browser.newPage();
  await page.goto(link);
  await page.waitForNavigation();
  await sleep(5000);
  await browser.close();
  logger.info("激活链接完成！");

  return {
    email,
    privateKey: wallet.privateKey,
    publicKey: wallet.address,
  };
}

module.exports = async function () {
  let mailDomain = await question("Email Domain: ");
  let clientKey = await question("Yescaptcha ClientKey: ");
  let count = await question("Register Count: ");
  let dirPath = await question("Save Path: ");
  if (!dirPath) {
    dirPath = __dirname;
  }
  savaPath = path.join(dirPath, "accounts.txt");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  if (fs.existsSync(savaPath)) {
    fs.unlinkSync(savaPath);
  }
  logger.info("文件保存路径：" + savaPath);
  for (let i = 0; i < count; i++) {
    try {
      logger.info("开始注册第" + (i + 1) + "个邮箱。。。");
      const result = await doSignup(mailDomain, clientKey);
      fs.appendFileSync(
        savaPath,
        `${result.email}\t${result.privateKey}\t${result.publicKey}\n`
      );
      logger.info("第" + (i + 1) + "个邮箱注册完成！");
    } catch (error) {
      logger.error(
        "第" +
          (i + 1) +
          "个邮箱注册异常：" +
          (JSON.stringify(error?.response?.data) || error?.message)
      );
    }
  }
};
