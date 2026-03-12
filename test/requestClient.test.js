const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const {
  DELETE_STATUS_PATH,
  deleteStatusRequest,
  readCookieValue,
  readCsrfToken,
} = require("../src/requestClient");

const sampleHtml = fs.readFileSync(
  path.join(__dirname, "..", "data", "sample.html"),
  "utf8",
);

test("reads a cookie value from document.cookie", function readsCookieValue() {
  assert.equal(readCookieValue("foo=bar; ck=K9o1; ll=108258", "ck"), "K9o1");
  assert.equal(readCookieValue("foo=bar", "ck"), null);
});

test("reads the csrf token from the cookie first", function readsCsrfTokenFromCookie() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses",
  });

  dom.window.document.cookie = "ck=from-cookie";

  assert.equal(readCsrfToken(dom.window.document), "from-cookie");
});

test("falls back to the logout link when the csrf cookie is missing", function fallsBackToLogoutLink() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses",
  });

  assert.equal(readCsrfToken(dom.window.document), "K9o1");
});

test("posts the sid to the delete endpoint with the csrf header", async function postsDeleteRequest() {
  const dom = new JSDOM(sampleHtml, {
    url: "https://www.douban.com/people/3483848/statuses?p=2",
  });
  dom.window.document.cookie = "ck=K9o1";

  let capturedRequest = null;

  await deleteStatusRequest(dom.window, "2975851228", {
    fetchImpl: async function captureRequest(url, options) {
      capturedRequest = {
        url: url,
        options: options,
      };
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
    },
  });

  assert.equal(DELETE_STATUS_PATH, "/j/status/delete");
  assert.equal(capturedRequest.url, "https://www.douban.com/j/status/delete");
  assert.equal(capturedRequest.options.method, "POST");
  assert.equal(capturedRequest.options.credentials, "same-origin");
  assert.equal(capturedRequest.options.headers["x-csrf-token"], "K9o1");
  assert.equal(capturedRequest.options.body, "sid=2975851228");
});
