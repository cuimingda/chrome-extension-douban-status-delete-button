# AGENTS.md

## Project

- Name: `Douban Status Delete Button`
- Type: Chrome Extension
- Goal: On specific Douban status list pages, add custom buttons. After a user clicks a button, the extension reads some information from the current page and sends an HTTP request.

## Product Contract

These rules are the current hard constraints. Future changes should preserve them unless the user explicitly changes the requirements.

### 1. Activation Scope

The extension is allowed to work only on Douban user status list pages that match one of these URL shapes:

- `https://www.douban.com/people/<userId>/statuses`
- `https://www.douban.com/people/<userId>/statuses?p=<page>`

Where:

- `<userId>` is a dynamic numeric Douban user ID, for example `9033345`
- `<page>` is a dynamic positive integer page number, starting from `1`

### 2. Strict Matching Rules

Use strict URL matching. Do not use loose substring checks.

Preferred matching target:

- protocol: `https:`
- host: `www.douban.com`
- pathname: `/people/<numeric-user-id>/statuses`
- search:
  - empty, or
  - exactly `?p=<positive-integer>`

Recommended canonical regex:

```txt
^https://www\.douban\.com/people/\d+/statuses(?:\?p=[1-9]\d*)?$
```

Examples that must match:

- `https://www.douban.com/people/9033345/statuses`
- `https://www.douban.com/people/9033345/statuses?p=1`
- `https://www.douban.com/people/9033345/statuses?p=789`

Examples that must not match:

- `http://www.douban.com/people/9033345/statuses`
- `https://douban.com/people/9033345/statuses`
- `https://www.douban.com/people/abc/statuses`
- `https://www.douban.com/people/9033345/statuses/`
- `https://www.douban.com/people/9033345/statuses?p=0`
- `https://www.douban.com/people/9033345/statuses?p=-1`
- `https://www.douban.com/people/9033345/statuses?foo=bar`
- `https://www.douban.com/people/9033345/statuses?p=2&foo=bar`
- `https://www.douban.com/people/9033345/`

### 3. Behavior on Non-matching Pages

If the current URL does not match the rules above, the extension must do nothing.

That means:

- no button injection
- no DOM reads
- no HTTP requests
- no console noise unless explicitly needed for development
- no impact on page behavior or layout

## Functional Expectations

### 1. UI Injection

On matching pages only, the extension may inject one or more buttons into the page.

Current requirement:

- buttons are an enhancement layer only
- the original page behavior must remain intact
- button placement can evolve later, but it must be scoped to the matching page only

### 2. Trigger Model

Network behavior should be user-triggered by default.

Current assumption for future work:

- read page information after the user clicks a button
- send the HTTP request only after the click
- do not auto-send requests on page load unless the user later explicitly asks for that behavior

### 3. Data Handling

When a button is clicked, the extension may:

- locate the relevant DOM area
- extract the required page data
- transform the data if needed
- send an HTTP request to the configured backend

Implementation details are still TBD and should be added incrementally:

- exact button set
- exact DOM selectors
- exact extracted fields
- request endpoint
- request method
- auth requirements
- success/failure feedback

## Engineering Rules

### 1. Safe-by-default

- Prefer Manifest V3 unless the user explicitly requests otherwise.
- Keep permissions minimal.
- Restrict host permissions to the smallest practical scope.
- If broader manifest matching is unavoidable, add a strict runtime URL guard before doing any work.

### 2. Separation of Concerns

When implementation starts, keep these responsibilities separate:

- URL matcher
- page/DOM parser
- button renderer
- request client
- user feedback / status reporting

This makes later iteration safer when Douban DOM structure or backend API details change.

### 3. Failure Handling

Failures must degrade gracefully:

- if URL is not supported, exit early
- if target DOM is missing, do not break the page
- if request fails, surface a lightweight error state and avoid repeated uncontrolled retries

### 4. Maintainability

Future changes should preserve these invariants:

- non-matching pages remain no-op
- matching logic stays explicit and testable
- button clicks are the main trigger point unless requirements change
- DOM reads and network requests stay scoped to the required page context

## Testing Guidance

At minimum, later implementation should verify:

- supported URL matches work correctly
- unsupported URL variants do nothing
- buttons appear only on supported pages
- clicking a button reads the expected DOM data
- clicking a button sends the expected request
- request failure does not break the page

URL matching should have dedicated test cases for both positive and negative examples.

## Working Assumptions For Future Iterations

Unless the user says otherwise, treat these as defaults:

- exact supported host is `www.douban.com`
- exact supported path is `/people/<id>/statuses`
- optional query parameter is only `p`
- `p` must be an integer greater than or equal to `1`
- unsupported URLs must remain completely inactive
- page parsing and request sending are initiated by explicit button clicks

## Change Policy

If a future task conflicts with this file, update this `AGENTS.md` first or as part of the same change so the project contract stays current.
