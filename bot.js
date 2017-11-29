const botBuilder = require("claudia-bot-builder");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = botBuilder(getReplyForText, { platforms: ["groupme"] });

function getReplyForText({ text }) {
  if (text.match(/@point83/i)) {
    throw new Error("Message was meant for another bot");
  }

  const ruleNumber = Number.parseInt(text.match(/rule (\d+)/i)[1]);
  const ruleIndex = ruleNumber - 1;

  const isNyc = text.match(/nyc/i);
  const replyPrefix = `${isNyc ? "NYC " : ""}Rule ${ruleNumber}: `;
  const rulesUrl = isNyc
    ? "http://www.point83.com/tos/index.php?title=Basic_Rules_(NYC_Addendum)"
    : "http://www.point83.com/tos/index.php?title=Basic_rules";

  console.time("fetch");
  return fetch(rulesUrl)
    .then(res => res.text())
    .then(body => {
      console.timeEnd("fetch");

      console.time("cheerio.load");
      const result = cheerio.load(body);
      console.timeEnd("cheerio.load");

      return result;
    })
    .then($ => {
      console.time("rule text");
      const rules = $("ol").children();
      const rule = rules[ruleIndex];
      if (!rule) {
        throw new Error("No such rule");
      }
      const ruleText = $(rule).text();
      console.timeEnd("rule text");

      return replyPrefix + ruleText;
    });
}

if (typeof require != "undefined" && require.main == module) {
  getReplyForText({ text: "nyc rule 3" })
    .then(console.log)
    .then(() => getReplyForText({ text: "rule 34" }))
    .then(console.log);
}
