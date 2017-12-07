const url = require("url");

const botBuilder = require("claudia-bot-builder");
const execall = require("execall");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const TurndownService = require("turndown");
const randomItem = require("random-item");
const mem = require("mem");

const puns = require("semeval2017_task7").map(({ words }) =>
  words.join(" ").replace(/ ([.,!;?])/g, "$1")
);

const turndownService = new TurndownService({
  linkStyle: "referenced"
});

const fetchCheerioMemoized = mem(fetchCheerio);

module.exports = botBuilder(getReplyForText, { platforms: ["groupme"] });

function getReplyForText({ text }) {
  console.log();

  if (text.match(/@point83/i)) {
    throw new Error("Message was meant for another bot");
  }

  return getRules({ text }).then(rules =>
    Promise.all(rules.map(getReplyForRule))
  );
}

function getRules({ text }) {
  const isNyc = text.match(/nyc/i);
  const rulesUrl = isNyc
    ? "http://www.point83.com/tos/index.php?title=Basic_Rules_(NYC_Addendum)"
    : "http://www.point83.com/tos/index.php?title=Basic_rules";

  return Promise.all(
    execall(/rule (\d+)/gi, text).map(({ sub }) =>
      fetchCheerioMemoized(rulesUrl).then($ => ({
        ruleNumber: Number.parseInt(sub[0]),
        isNyc,
        rulesUrl,
        $
      }))
    )
  );
}

function fetchCheerio(rulesUrl) {
  console.time(`fetch ${rulesUrl}`);
  return fetch(rulesUrl)
    .then(res => res.text())
    .then(body => {
      console.timeEnd(`fetch ${rulesUrl}`);

      console.time(`cheerio.load ${rulesUrl}`);
      const result = cheerio.load(body);
      console.timeEnd(`cheerio.load ${rulesUrl}`);

      return result;
    });
}

function getReplyForRule({ ruleNumber, isNyc, $, rulesUrl }) {
  const replyPrefix = `${isNyc ? "NYC " : ""}Rule ${ruleNumber}: `;
  const ruleIndex = ruleNumber - 1;

  console.time(`extract text for ${replyPrefix}`);
  const rules = $("ol").children();
  const rule = rules[ruleIndex];
  if (!rule) {
    throw new Error("No such rule");
  }
  $("a", rule).attr("href", (_, href) => url.resolve(rulesUrl, href || "#"));
  $("a", rule).removeAttr("title");
  const ruleHtml = $(rule).html();
  const ruleText = turndownService.turndown(ruleHtml);
  console.timeEnd(`extract text for ${replyPrefix}`);

  console.log();

  let replyText = replyPrefix + ruleText;

  if (isNyc && ruleNumber === 20) {
    replyText += "\n\nHere's a pun: " + randomItem(puns);
  }

  return replyText;
}

if (typeof require != "undefined" && require.main == module) {
  const cliText = process.argv.slice(2).join(" ");
  if (cliText) {
    getReplyForText({ text: cliText }).then(console.log);
    return;
  }

  getReplyForText({ text: "nyc rule 3" })
    .then(console.log)
    .then(() => getReplyForText({ text: "rule 34" }))
    .then(console.log)
    .then(() => getReplyForText({ text: "rule 19" }))
    .then(console.log)
    .then(() => getReplyForText({ text: "nyc rule 20" }))
    .then(console.log)
    .then(() => getReplyForText({ text: "rule 17 and rule 71" }))
    .then(console.log);
}
