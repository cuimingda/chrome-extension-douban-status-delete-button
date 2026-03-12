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
  findStatusWrapperByStatusId,
  removeStatusWrapperByStatusId,
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

test("adds one hard delete button after each delete link and forwards the status id on click", function injectsButtons() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses",
  });
  const clickContexts = [];

  const insertedCount = enhanceDeleteLinks(dom.window.document, {
    onHardDeleteClick: function recordClick(context) {
      clickContexts.push(context);
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

  assert.equal(clickContexts.length, 1);
  assert.equal(clickContexts[0].statusId, "2975853409");
  assert.equal(clickContexts[0].deleteLink, deleteLinks[0]);
  assert.equal(clickContexts[0].hardDeleteLink, hardDeleteLinks[0]);
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

test("finds and removes a status wrapper by status id", function removesStatusWrapper() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses",
  });

  const statusWrapper = findStatusWrapperByStatusId(dom.window.document, "2975853409");
  assert.ok(statusWrapper);
  assert.equal(removeStatusWrapperByStatusId(dom.window.document, "2975853409"), true);
  assert.equal(
    findStatusWrapperByStatusId(dom.window.document, "2975853409"),
    null,
  );
});
