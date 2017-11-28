var botBuilder = require("claudia-bot-builder");
const { JSDOM } = require("jsdom");

module.exports = botBuilder(function(request) {
  const ruleNumber = Number.parseInt(request.text);
  const ruleIndex = ruleNumber - 1;
  const rulesUrl = "http://www.point83.com/tos/index.php?title=Basic_rules";

  return JSDOM.fromURL(rulesUrl).then(dom => {
    return dom.window.document.querySelector("ol").children[ruleIndex]
      .textContent;
  });
});
