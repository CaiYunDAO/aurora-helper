const { goto, getNonce, metamaskLogin } = require("../api/aurora");
const { getBrowserPath } = require("../util");
const ethers = require("ethers");
const puppeteer = require("puppeteer-core");

module.exports = {
  async selectUserState(privateKey, address) {
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
    const response = await page.waitForResponse(
      (response) => {
        const request = response.request();
        return (
          request.method() == "GET" &&
          request.url().indexOf("/rest/v1/users?select=") > -1
        );
      },
      { timeout: 1000 * 60 * 2 }
    );
    const userState = await response.json();
    await browser.close();
    return userState[0];
  },
};
