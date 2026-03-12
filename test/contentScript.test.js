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

function flushAsyncWork() {
  return new Promise(function resolveOnNextTick(resolve) {
    setTimeout(resolve, 0);
  });
}

test("runs on supported Douban status list pages and removes the matching status after a successful request", async function runsOnSupportedPages() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses?p=1",
  });
  dom.window.document.cookie = "ck=K9o1";
  const fetchCalls = [];
  dom.window.fetch = async function recordFetch(url, options) {
    fetchCalls.push({ url: url, options: options });
    return {
      ok: true,
      headers: {
        get: function getHeader() {
          return "application/json";
        },
      },
      json: async function getPayload() {
        return { r: 0 };
      },
    };
  };

  const insertedCount = runContentScript(dom.window);
  const hardDeleteLinks = Array.from(dom.window.document.querySelectorAll(
    "a." + HARD_DELETE_LINK_CLASS,
  ));

  assert.equal(insertedCount, 4);
  assert.equal(hardDeleteLinks.length, 4);
  assert.ok(dom.window.document.querySelector('.new-status[data-sid="2975852296"]'));

  hardDeleteLinks[1].dispatchEvent(
    new dom.window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    }),
  );

  await flushAsyncWork();

  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "https://www.douban.com/j/status/delete");
  assert.equal(fetchCalls[0].options.method, "POST");
  assert.equal(fetchCalls[0].options.credentials, "same-origin");
  assert.equal(fetchCalls[0].options.headers["x-csrf-token"], "K9o1");
  assert.equal(fetchCalls[0].options.body, "sid=2975852296");
  assert.equal(
    dom.window.document.querySelector('.new-status[data-sid="2975852296"]'),
    null,
  );
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

test("keeps the status and shows an error state when the delete request fails", async function handlesDeleteFailures() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses?p=2",
  });
  dom.window.document.cookie = "ck=K9o1";
  dom.window.fetch = async function failRequest() {
    return {
      ok: false,
      headers: {
        get: function getHeader() {
          return "application/json";
        },
      },
      json: async function getPayload() {
        return { r: 1 };
      },
    };
  };

  runContentScript(dom.window);

  const hardDeleteLink = dom.window.document.querySelector("a." + HARD_DELETE_LINK_CLASS);
  hardDeleteLink.dispatchEvent(
    new dom.window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    }),
  );

  await flushAsyncWork();

  assert.equal(hardDeleteLink.textContent, "删除失败");
  assert.equal(hardDeleteLink.dataset.requestState, "error");
  assert.ok(dom.window.document.querySelector('.new-status[data-sid="2975853409"]'));
});
