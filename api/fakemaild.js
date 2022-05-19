const axios = require("axios").default;

const client = axios.create({
  baseURL: "http://43.132.160.220:14000",
});

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getAuroraEmail(toEmail) {
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    const resp = await client.get(`/to/${toEmail}`);
    const filterList = resp.data.filter(
      (e) => e.from == "pm_bounces@pm-bounces.aurora.plus"
    );
    if (filterList.length == 0) {
      continue;
    }
    return filterList[0].content
      .match(/href="(.*)"/)[1]
      .replace(/\&amp;/g, "&");
  }
  throw new Error("获取激活邮件超时!");
}

module.exports = {
  getAuroraEmail,
};
