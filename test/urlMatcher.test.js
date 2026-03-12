const test = require("node:test");
const assert = require("node:assert/strict");

const { isSupportedStatusPageUrl } = require("../src/urlMatcher");

test("matches supported Douban status list URLs exactly", function matchesSupportedUrls() {
  const supportedUrls = [
    "https://www.douban.com/people/9033345/statuses",
    "https://www.douban.com/people/9033345/statuses?p=1",
    "https://www.douban.com/people/9033345/statuses?p=789",
  ];

  supportedUrls.forEach(function assertSupported(url) {
    assert.equal(isSupportedStatusPageUrl(url), true);
  });
});

test("rejects unsupported Douban URLs", function rejectsUnsupportedUrls() {
  const unsupportedUrls = [
    "http://www.douban.com/people/9033345/statuses",
    "https://douban.com/people/9033345/statuses",
    "https://www.douban.com/people/abc/statuses",
    "https://www.douban.com/people/9033345/statuses/",
    "https://www.douban.com/people/9033345/statuses?p=0",
    "https://www.douban.com/people/9033345/statuses?p=-1",
    "https://www.douban.com/people/9033345/statuses?foo=bar",
    "https://www.douban.com/people/9033345/statuses?p=2&foo=bar",
    "https://www.douban.com/people/9033345/",
  ];

  unsupportedUrls.forEach(function assertUnsupported(url) {
    assert.equal(isSupportedStatusPageUrl(url), false);
  });
});
