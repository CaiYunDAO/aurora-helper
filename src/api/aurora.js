const axios = require("axios").default;
const setCookie = require("set-cookie-parser");
const { JSDOM } = require("jsdom");

const _client = axios.create({
  baseURL: "https://aurora.plus",
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36 Edg/101.0.1210.39",
  },
  timeout: 30000,
});

async function getParam(uri) {
  const resp = await _client.get(uri, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "accept-language": "zh-CN,zh;q=0.9",
      "cache-control": " max-age=0",
    },
  });
  const cookie = setCookie.parse(
    setCookie.splitCookiesString(resp.headers["set-cookie"])
  );
  const dom = new JSDOM(resp.data);
  const nextData = JSON.parse(
    dom.window.document.getElementById("__NEXT_DATA__").innerHTML
  );
  return {
    cookie: `aurora-plus-country=HK; _csrf=${
      cookie.find((e) => e.name === "_csrf").value
    }`,
    csrfToken: nextData.props.pageProps.csrfToken,
  };
}

module.exports = {
  async goto(uri) {
    const { cookie, csrfToken } = await getParam(uri);
    return axios.create({
      baseURL: "https://aurora.plus",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36 Edg/101.0.1210.39",
        Cookie: cookie,
        "XSRF-TOKEN": csrfToken,
        Origin: "https://aurora.plus",
        Referer: "https://aurora.plus" + uri,
      },
      timeout: 30000,
    });
  },
  async signup(client, data) {
    const resp = await client.post("/api/user/sign-up", data);
    return resp.data;
  },
  async getNonce(client, data) {
    const resp = await client.post("/api/user/get-nonce", data);
    return resp.data;
  },
  async metamaskLogin(client, data) {
    const resp = await client.post("/api/user/metamask-login", data);
    return resp.data;
  },
};

/* (async function () {
  try {
    console.log(
      await sigup({
        email: "yiyebaofu0518@outlook.com",
        account: "0xd3CaE31CE18B73b40ae56AA916E1C309c15a76ac",
        captchaValue:
          "03AGdBq251eqNZlpjB7xlW33hMNKoXHouZ5bYu-6_Gapy9t0VTwpTWCiWfo2wu1lhPT7St0e_eIS-gpi1gS-hq8bOJzlZlsifuI2vumA2QEIabWRgypN5l1bQjJOQm8XmoOWKVHRykp2Ad9rs3PTi0htllyc0QB2I7wJVKmlR8PQPrXiszdbI9e1cLBNBL_aa_oUmrzqr1TojwqhIHr9kkfjiA9Lc8MJVFqmNQ2DoEE9rAVU5TllFET_o6MtvrDSNlfAWnqz7bAq_hHm9t0KI6ejdnCgaJMTnHc5CjGKD8fbwMX7lCSxBjqS0xMOZ7orYvMeJ1Rv-Us3lpga_d-_gR3y6Rz6-pWVE_Mm2b1gO44DYnf95q1cwNimBG1DWr31biHzM2Ev8_C8CPjoBHkviEUmd7rs_SG68u-PL1IlLP7k6OoIOeSr17Jy7In-vk0HQZ0Lob2OMxyTtMQGYqZhft3Qk4AqSdrAcOj-qC7BfuoZ6cLTju596NJJ_Dj6dFCt0qNLXClbTZNMIu",
        timeString: "Thu May 19 2022 11:15:17 GMT+0800 (中国标准时间)",
        signedMessage:
          "0x5afb4ed44462f2df0889d556f50e102733a65d8ac5b601417a978bd121f6e7a77d4168cf0babf6ebd12054b55c47bba2bc99c5f026ee761223c225ec7c2c96861b",
      })
    );
  } catch (error) {
    console.log(error);
  }
})();
 */
