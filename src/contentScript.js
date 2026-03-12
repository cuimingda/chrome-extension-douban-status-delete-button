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
    helpers = Object.assign(
      {},
      helpers,
      require("./urlMatcher"),
      require("./deleteButtons"),
      require("./requestClient"),
    );
  }

  function setHardDeleteLinkState(hardDeleteLink, label, options) {
    hardDeleteLink.textContent = label;
    hardDeleteLink.style.pointerEvents = options.disabled ? "none" : "";
    hardDeleteLink.style.opacity = options.disabled ? "0.6" : "";
    hardDeleteLink.dataset.requestState = options.state;
    hardDeleteLink.title = options.title || "";
  }

  async function handleHardDeleteClick(currentWindow, context) {
    const { hardDeleteLink, statusId } = context;

    if (hardDeleteLink.dataset.requestState === "pending") {
      return;
    }

    setHardDeleteLinkState(hardDeleteLink, "删除中...", {
      disabled: true,
      state: "pending",
    });

    try {
      await helpers.deleteStatusRequest(currentWindow, statusId);
      const removed = helpers.removeStatusWrapperByStatusId(
        currentWindow.document,
        statusId,
      );

      if (!removed) {
        setHardDeleteLinkState(hardDeleteLink, "已删除", {
          disabled: true,
          state: "done",
        });
      }
    } catch (error) {
      setHardDeleteLinkState(hardDeleteLink, "删除失败", {
        disabled: false,
        state: "error",
        title: "删除失败，请重试",
      });
    }
  }

  function runContentScript(win) {
    const currentWindow = win || root;

    if (
      !currentWindow ||
      !currentWindow.location ||
      !currentWindow.document ||
      typeof helpers.isSupportedStatusPageUrl !== "function" ||
      typeof helpers.enhanceDeleteLinks !== "function" ||
      typeof helpers.deleteStatusRequest !== "function" ||
      typeof helpers.removeStatusWrapperByStatusId !== "function"
    ) {
      return 0;
    }

    if (!helpers.isSupportedStatusPageUrl(String(currentWindow.location.href))) {
      return 0;
    }

    return helpers.enhanceDeleteLinks(currentWindow.document, {
      onHardDeleteClick: function onHardDeleteClick(context) {
        void handleHardDeleteClick(currentWindow, context);
      },
    });
  }

  return {
    runContentScript,
  };
});
