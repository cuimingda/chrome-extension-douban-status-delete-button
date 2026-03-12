(function attachContentScript(root, factory) {
  const api = factory(root);
  root.DoubanStatusDeleteButton = root.DoubanStatusDeleteButton || {};
  Object.assign(root.DoubanStatusDeleteButton, api);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (root.window === root && root.document) {
    api.runContentScript(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildContentScript(root) {
  let helpers = root.DoubanStatusDeleteButton || {};

  if (typeof module !== "undefined" && module.exports && typeof require === "function") {
    helpers = Object.assign({}, helpers, require("./urlMatcher"), require("./deleteButtons"));
  }

  function runContentScript(win) {
    const currentWindow = win || root;

    if (
      !currentWindow ||
      !currentWindow.location ||
      !currentWindow.document ||
      typeof helpers.isSupportedStatusPageUrl !== "function" ||
      typeof helpers.enhanceDeleteLinks !== "function"
    ) {
      return 0;
    }

    if (!helpers.isSupportedStatusPageUrl(String(currentWindow.location.href))) {
      return 0;
    }

    return helpers.enhanceDeleteLinks(currentWindow.document, {
      alertFn: function alertStatusId(statusId) {
        if (typeof currentWindow.alert === "function") {
          currentWindow.alert(statusId);
        }
      },
    });
  }

  return {
    runContentScript,
  };
});
