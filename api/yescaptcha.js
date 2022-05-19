const axios = require("axios").default;

const client = axios.create({
  baseURL: "https://api.yescaptcha.com",
  headers: {
    "Content-Type": "application/json",
  },
});

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

module.exports = {
  async resolve(clientKey) {
    const resp1 = await client.post("/createTask", {
      clientKey: clientKey,
      task: {
        websiteURL: "https://aurora.plus/signup",
        websiteKey: "6Lf1e44fAAAAALPZVno_aSxY3YBLVemeK9bVrdpW",
        type: "NoCaptchaTaskProxyless",
      },
    });
    const taskId = resp1.data.taskId;
    for (let i = 0; i < 80; i++) {
      await sleep(1000);
      const resp2 = await client.post("/getTaskResult", {
        clientKey: clientKey,
        taskId: taskId,
      });
      if (resp2.data.status === "ready") {
        return resp2.data.solution.gRecaptchaResponse;
      }
    }
    throw new Error("解析验证码超时!");
  },
};
