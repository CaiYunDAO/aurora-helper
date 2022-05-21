const readline = require("readline");
const { createLogger, format, transports } = require("winston");
const edgePaths = require("edge-paths");
const findChrome = require("chrome-finder");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function rlPromisify(fn) {
  return async (...args) => {
    return new Promise((resolve) => fn(...args, resolve));
  };
}

const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: () => new Date().toLocaleString() }),
    format.printf(({ level, message, label, timestamp }) => {
      return `${timestamp} ${level}: ${message}`;
    })
  ),
  transports: [new transports.Console()],
});

function randomString(length) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

module.exports = {
  async sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  },
  question: rlPromisify(rl.question.bind(rl)),
  logger,
  getBrowserPath() {
    let browserPath;
    try {
      browserPath = findChrome();
    } catch (e) {
      try {
        browserPath = edgePaths.getEdgePath();
      } catch (e) {}
    }
    if (!browserPath) {
      throw new Error("未找到Chrome或Edge浏览器!");
    }
    return browserPath;
  },
  randomString,
  randomEmail(mailDomain) {
    const email = `${randomString(8)}@${mailDomain}`;
    return email;
  },
};
