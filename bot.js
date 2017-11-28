var botBuilder = require("claudia-bot-builder");
const { JSDOM } = require("jsdom");

module.exports = botBuilder(function(request) {
  const ruleNumber = Number.parseInt(request.text);
  const ruleIndex = ruleNumber - 1;

  return JSDOM.fromURL(
    "http://www.point83.com/tos/index.php?title=Basic_rules"
  ).then(dom => {
    return dom.window.document.querySelector("ol").children[ruleIndex]
      .textContent;
  });
});
