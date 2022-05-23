const { goto, signup } = require("../api/aurora");
const { resolve } = require("../api/yescaptcha");
const { getAuroraEmail } = require("../api/fakemaild");
const { selectUserState } = require("./common");
const {
  logger,
  sleep,
  question,
  getBrowserPath,
  randomString,
  randomEmail,
  randomIntBetween,
} = require("../util");
const ethers = require("ethers");
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

async function doSignup(uri, mailDomain, clientKey) {
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
  const client = await goto(uri);
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
    timeout: 1000 * 60 * 2,
  });
  logger.info("激活链接开始。。。");
  const page = await browser.newPage();
  await page.goto(link);
  await page.waitForNavigation({ timeout: 1000 * 60 * 2 });
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
  logger.info(`生成${count}个主号乘于随机3至5个小号`);
  for (let i = 0; i < count; i++) {
    try {
      logger.info(`开始注册第${i + 1}个邮箱（主号）。。。`);
      const result = await doSignup("/signup", mailDomain, clientKey);
      fs.appendFileSync(
        savaPath,
        `主号\t${result.email}\t${result.privateKey}\t${result.publicKey}\n`
      );
      logger.info(`第${i + 1}个邮箱（主号）注册完成！`);
      logger.info(`第${i + 1}个邮箱（主号）获取邀请链接开始。。。`);
      const userState = await selectUserState(
        result.privateKey,
        result.publicKey
      );
      const inviteLink = `/r/${userState.referral_id}`;
      logger.info(`第${i + 1}个邮箱（主号）获取邀请链接完成：${inviteLink}`);
      const subCount = randomIntBetween(3, 5);
      logger.info(`第${i + 1}个邮箱（主号）随机生成${subCount}个小号！`);
      for (let j = 0; j < subCount; j++) {
        try {
          logger.info(`开始注册第${j + 1}个邮箱（小号）。。。`);
          const subResult = await doSignup(inviteLink, mailDomain, clientKey);
          fs.appendFileSync(
            savaPath,
            `小号\t${subResult.email}\t${subResult.privateKey}\t${subResult.publicKey}\n`
          );
          logger.info(`第${j + 1}个邮箱（小号）注册完成！`);
        } catch (error) {
          logger.error(
            `第${j + 1}个邮箱（小号）注册异常：${
              JSON.stringify(error?.response?.data) || error?.message
            }`
          );
        }
      }
    } catch (error) {
      logger.error(
        `第${i + 1}个邮箱（主号）注册异常：${
          JSON.stringify(error?.response?.data) || error?.message
        }`
      );
    }
  }
  logger.info("注册完成！");
};
