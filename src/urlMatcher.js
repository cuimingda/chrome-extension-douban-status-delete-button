(function attachUrlMatcher(root, factory) {
  const api = factory();
  root.DoubanStatusDeleteButton = root.DoubanStatusDeleteButton || {};
  Object.assign(root.DoubanStatusDeleteButton, api);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildUrlMatcher() {
  const SUPPORTED_STATUS_PAGE_URL_RE =
    /^https:\/\/www\.douban\.com\/people\/\d+\/statuses(?:\?p=[1-9]\d*)?$/;

  function isSupportedStatusPageUrl(url) {
    return typeof url === "string" && SUPPORTED_STATUS_PAGE_URL_RE.test(url);
  }

  return {
    SUPPORTED_STATUS_PAGE_URL_RE,
    isSupportedStatusPageUrl,
  };
});
