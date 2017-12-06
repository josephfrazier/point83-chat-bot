const url = require("url");

const botBuilder = require("claudia-bot-builder");
const execall = require("execall");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const TurndownService = require("turndown");
const randomItem = require("random-item");

const puns = require("semeval2017_task7").map(({ words }) =>
  words.join(" ").replace(/ ([.,!;?])/g, "$1")
);

const turndownService = new TurndownService({
  linkStyle: "referenced"
});

module.exports = botBuilder(getReplyForText, { platforms: ["groupme"] });

function getReplyForText({ text }) {
  console.log();

  if (text.match(/@point83/i)) {
    throw new Error("Message was meant for another bot");
  }

  const ruleNumbers = execall(/rule (\d+)/gi, text).map(({ sub }) =>
    Number.parseInt(sub[0])
  );

  const isNyc = text.match(/nyc/i);
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
      return ruleNumbers.map(ruleNumber => {
        const replyPrefix = `${isNyc ? "NYC " : ""}Rule ${ruleNumber}: `;
        const ruleIndex = ruleNumber - 1;

        console.time("rule text");
        const rules = $("ol").children();
        const rule = rules[ruleIndex];
        if (!rule) {
          throw new Error("No such rule");
        }
        $("a", rule).attr("href", (_, href) =>
          url.resolve(rulesUrl, href || "#")
        );
        $("a", rule).removeAttr("title");
        const ruleHtml = $(rule).html();
        const ruleText = turndownService.turndown(ruleHtml);
        console.timeEnd("rule text");

        console.log();

        let replyText = replyPrefix + ruleText;

        if (isNyc && ruleNumber === 20) {
          replyText += "\n\nHere's a pun: " + randomItem(puns);
        }

        return replyText;
      });
    });
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
