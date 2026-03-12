(function attachDeleteButtons(root, factory) {
  const api = factory(root);
  root.DoubanStatusDeleteButton = root.DoubanStatusDeleteButton || {};
  Object.assign(root.DoubanStatusDeleteButton, api);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildDeleteButtons(root) {
  const DELETE_LINK_SELECTOR =
    'a.btn-action-reply-delete[data-action-type="deleteStatus"]';
  const HARD_DELETE_LINK_CLASS = "douban-status-hard-delete-button";
  const STATUS_DETAIL_URL_RE =
    /^https:\/\/www\.douban\.com\/people\/\d+\/status\/(\d+)\/(?:\?[^#]*)?$/;

  function extractStatusIdFromDeleteLinkHref(href) {
    if (typeof href !== "string") {
      return null;
    }

    const match = STATUS_DETAIL_URL_RE.exec(href.trim());
    return match ? match[1] : null;
  }

  function defaultAlert(statusId) {
    if (typeof root.alert === "function") {
      root.alert(statusId);
    }
  }

  function createHardDeleteLink(document, statusId, alertFn) {
    const hardDeleteLink = document.createElement("a");
    hardDeleteLink.href = "#";
    hardDeleteLink.textContent = "彻底删除";
    hardDeleteLink.className = HARD_DELETE_LINK_CLASS;
    hardDeleteLink.dataset.statusId = statusId;
    hardDeleteLink.style.marginLeft = "8px";
    hardDeleteLink.addEventListener("click", function handleClick(event) {
      event.preventDefault();
      alertFn(statusId);
    });
    return hardDeleteLink;
  }

  function enhanceDeleteLinks(document, options) {
    if (!document || typeof document.querySelectorAll !== "function") {
      return 0;
    }

    const alertFn =
      options && typeof options.alertFn === "function" ? options.alertFn : defaultAlert;
    const deleteLinks = document.querySelectorAll(DELETE_LINK_SELECTOR);
    let insertedCount = 0;

    deleteLinks.forEach(function enhanceDeleteLink(deleteLink) {
      if (deleteLink.dataset.doubanHardDeleteEnhanced === "true") {
        return;
      }

      const statusId = extractStatusIdFromDeleteLinkHref(deleteLink.href);
      if (!statusId) {
        return;
      }

      const hardDeleteLink = createHardDeleteLink(document, statusId, alertFn);
      deleteLink.insertAdjacentElement("afterend", hardDeleteLink);
      deleteLink.dataset.doubanHardDeleteEnhanced = "true";
      insertedCount += 1;
    });

    return insertedCount;
  }

  return {
    DELETE_LINK_SELECTOR,
    HARD_DELETE_LINK_CLASS,
    STATUS_DETAIL_URL_RE,
    extractStatusIdFromDeleteLinkHref,
    enhanceDeleteLinks,
  };
});
