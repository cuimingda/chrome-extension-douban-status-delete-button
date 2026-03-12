(function attachRequestClient(root, factory) {
  const api = factory();
  root.DoubanStatusDeleteButton = root.DoubanStatusDeleteButton || {};
  Object.assign(root.DoubanStatusDeleteButton, api);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function buildRequestClient() {
  const DELETE_STATUS_PATH = "/j/status/delete";

  function readCookieValue(cookieString, cookieName) {
    if (typeof cookieString !== "string" || typeof cookieName !== "string") {
      return null;
    }

    const cookieParts = cookieString.split(";");

    for (const cookiePart of cookieParts) {
      const trimmedPart = cookiePart.trim();
      if (!trimmedPart) {
        continue;
      }

      const separatorIndex = trimmedPart.indexOf("=");
      const name = separatorIndex >= 0 ? trimmedPart.slice(0, separatorIndex) : trimmedPart;
      if (name !== cookieName) {
        continue;
      }

      const value = separatorIndex >= 0 ? trimmedPart.slice(separatorIndex + 1) : "";
      return decodeURIComponent(value);
    }

    return null;
  }

  function readCsrfToken(document) {
    if (!document) {
      return null;
    }

    const cookieToken = readCookieValue(document.cookie, "ck");
    if (cookieToken) {
      return cookieToken;
    }

    const logoutLink = document.querySelector('a[href*="/accounts/logout"]');
    if (!logoutLink || typeof logoutLink.href !== "string") {
      return null;
    }

    try {
      return new URL(logoutLink.href).searchParams.get("ck");
    } catch (error) {
      return null;
    }
  }

  function isExplicitDeleteFailure(payload) {
    if (!payload || typeof payload !== "object") {
      return false;
    }

    return (
      payload.r === 1 ||
      payload.result === false ||
      payload.status === "error" ||
      payload.status === "failed"
    );
  }

  async function deleteStatusRequest(win, statusId, options) {
    if (!win || !win.document || !win.location || typeof statusId !== "string") {
      throw new Error("Missing delete request context");
    }

    const csrfToken = readCsrfToken(win.document);
    if (!csrfToken) {
      throw new Error("Missing CSRF token");
    }

    const fetchImpl =
      options && typeof options.fetchImpl === "function"
        ? options.fetchImpl
        : typeof win.fetch === "function"
          ? win.fetch.bind(win)
          : null;

    if (!fetchImpl) {
      throw new Error("Fetch is unavailable");
    }

    const endpoint = new URL(DELETE_STATUS_PATH, win.location.origin).toString();
    const response = await fetchImpl(endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/x-www-form-urlencoded",
        "x-csrf-token": csrfToken,
      },
      body: new URLSearchParams({ sid: statusId }).toString(),
    });

    let payload = null;
    const contentType =
      response && response.headers && typeof response.headers.get === "function"
        ? response.headers.get("content-type") || ""
        : "";

    if (contentType.includes("application/json") && typeof response.json === "function") {
      payload = await response.json();
    }

    if (!response.ok || isExplicitDeleteFailure(payload)) {
      const error = new Error("Delete request failed");
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  return {
    DELETE_STATUS_PATH,
    readCookieValue,
    readCsrfToken,
    deleteStatusRequest,
  };
});
