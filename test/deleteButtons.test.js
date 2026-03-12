const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const {
  DELETE_LINK_SELECTOR,
  HARD_DELETE_LINK_CLASS,
  enhanceDeleteLinks,
  extractStatusIdFromDeleteLinkHref,
} = require("../src/deleteButtons");

const sampleHtml = fs.readFileSync(
  path.join(__dirname, "..", "data", "sample.html"),
  "utf8",
);

test("extracts the status id from a Douban delete link", function extractsStatusId() {
  assert.equal(
    extractStatusIdFromDeleteLinkHref(
      "https://www.douban.com/people/3483848/status/2975853409/?_spm_id=MzQ4Mzg0OA",
    ),
    "2975853409",
  );
  assert.equal(
    extractStatusIdFromDeleteLinkHref("https://www.douban.com/people/3483848/statuses"),
    null,
  );
});

test("adds one hard delete button after each delete link and alerts the status id", function injectsButtons() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses",
  });
  const alertCalls = [];

  const insertedCount = enhanceDeleteLinks(dom.window.document, {
    alertFn: function recordAlert(statusId) {
      alertCalls.push(statusId);
    },
  });

  const deleteLinks = Array.from(
    dom.window.document.querySelectorAll(DELETE_LINK_SELECTOR),
  );
  const hardDeleteLinks = Array.from(
    dom.window.document.querySelectorAll("a." + HARD_DELETE_LINK_CLASS),
  );

  assert.equal(insertedCount, 4);
  assert.equal(hardDeleteLinks.length, deleteLinks.length);

  deleteLinks.forEach(function assertPlacement(deleteLink, index) {
    assert.equal(deleteLink.nextElementSibling, hardDeleteLinks[index]);
  });

  assert.equal(hardDeleteLinks[0].textContent, "彻底删除");
  assert.equal(hardDeleteLinks[0].dataset.statusId, "2975853409");

  hardDeleteLinks[0].dispatchEvent(
    new dom.window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    }),
  );

  assert.deepEqual(alertCalls, ["2975853409"]);
});

test("does not add duplicate hard delete buttons when run twice", function avoidsDuplicates() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses?p=2",
  });

  assert.equal(enhanceDeleteLinks(dom.window.document), 4);
  assert.equal(enhanceDeleteLinks(dom.window.document), 0);
  assert.equal(
    dom.window.document.querySelectorAll("a." + HARD_DELETE_LINK_CLASS).length,
    4,
  );
});
