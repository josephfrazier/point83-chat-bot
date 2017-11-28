var botBuilder = require("claudia-bot-builder");
const { JSDOM } = require("jsdom");

module.exports = botBuilder(function(request) {
  const { text } = request;

  const ruleNumber = Number.parseInt(text.match(/rule (\d+)/i)[1]);
  const ruleIndex = ruleNumber - 1;

  const isNyc = text.match(/nyc/i);
  const replyPrefix = `${isNyc ? "NYC " : ""}Rule ${ruleNumber}: `;
  const rulesUrl = isNyc
    ? "http://www.point83.com/tos/index.php?title=Basic_Rules_(NYC_Addendum)"
    : "http://www.point83.com/tos/index.php?title=Basic_rules";

  return JSDOM.fromURL(rulesUrl).then(dom => {
    return (
      replyPrefix +
      dom.window.document.querySelector("ol").children[ruleIndex].textContent
    );
  });
});
