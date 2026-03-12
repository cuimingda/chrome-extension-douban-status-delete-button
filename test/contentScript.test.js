const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const { HARD_DELETE_LINK_CLASS } = require("../src/deleteButtons");
const { runContentScript } = require("../src/contentScript");

const sampleHtml = fs.readFileSync(
  path.join(__dirname, "..", "data", "sample.html"),
  "utf8",
);

test("runs on supported Douban status list pages", function runsOnSupportedPages() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses?p=1",
  });
  const alertCalls = [];
  dom.window.alert = function recordAlert(statusId) {
    alertCalls.push(statusId);
  };

  const insertedCount = runContentScript(dom.window);
  const hardDeleteLinks = dom.window.document.querySelectorAll(
    "a." + HARD_DELETE_LINK_CLASS,
  );

  assert.equal(insertedCount, 4);
  assert.equal(hardDeleteLinks.length, 4);

  hardDeleteLinks[1].dispatchEvent(
    new dom.window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    }),
  );

  assert.deepEqual(alertCalls, ["2975852296"]);
});

test("does nothing on unsupported pages", function skipsUnsupportedPages() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses?foo=bar",
  });

  const insertedCount = runContentScript(dom.window);

  assert.equal(insertedCount, 0);
  assert.equal(
    dom.window.document.querySelectorAll("a." + HARD_DELETE_LINK_CLASS).length,
    0,
  );
});
