# Roadmap

## Phase 1 — Foundation

### Todos

- [x] Create basic project structure
- [x] Add `src/a11y-long-text-toggle.js`
- [x] Add `src/a11y-long-text-toggle.css`
- [x] Add simple demo page
- [x] Add README usage example

### Acceptance Criteria

- Class can be imported
- Class can initialize from a button
- No dependencies are required
- Content stays visible without JavaScript

---

## Phase 2 — MVP Behavior

### Todos

- [x] Find target content from `data-target`
- [x] Generate target ID if missing
- [x] Set `aria-controls`
- [x] Set `aria-expanded`
- [x] Support `expand()`
- [x] Support `collapse()`
- [x] Support `toggle()`
- [x] Support `isExpanded()`
- [x] Update button text on state change
- [x] Dispatch expand/collapse/toggle events

### Acceptance Criteria

- Button expands and collapses content
- Screen readers receive correct button state
- Keyboard behavior works through native button behavior
- Focus remains stable

---

## Phase 3 — Collapse Modes

### Todos

- [x] Add `mode: "lines"`
- [x] Add `mode: "height"`
- [x] Support `collapsedLines`
- [x] Support `collapsedHeight`
- [x] Add CSS for line clamp
- [x] Add CSS for max-height clamp

### Acceptance Criteria

- Plain text can be line-clamped
- Rich content can be height-clamped
- CSS custom properties control the visual behavior

---

## Phase 4 — Auto-Hide + Refresh

### Todos

- [x] Add `autoHide` option
- [x] Measure overflow with `scrollHeight` and `clientHeight`
- [x] Hide button when content does not overflow
- [x] Add `refresh()`
- [x] Add `ResizeObserver`
- [x] Dispatch overflow-change event

### Acceptance Criteria

- Short content does not show a useless toggle
- Layout changes recalculate overflow
- Dynamic content can call `refresh()`

---

## Phase 5 — Polish

### Todos

- [x] Add optional fade class
- [x] Add reduced-motion CSS
- [x] Add print styles that show full content
- [x] Add a multi-instance product-description demo
- [x] Add a CMS-rich-text demo
- [x] Add a short-content demo
- [x] Document interactive-content limitation

### Acceptance Criteria

- Demo covers realistic use cases
- Component remains small
- Accessibility behavior is documented clearly

---

## Optional Enhancements

- [x] Add semantic split mode with an authored `[data-a11y-long-text-more]` region and native `hidden` behavior
- [ ] Add localStorage state
- [x] Add custom event detail object
- [ ] Add MutationObserver support
- [ ] Add helper initializer for multiple toggles
- [x] Add TypeScript types for the public API

---

## Responsive activation

Status: implemented; verified by automated tests and selected Chrome browser checks on 2026-11-11.

### Acceptance behavior

- A viewport media query or an ancestor container's maximum width controls whether collapsing is available; the two forms are mutually exclusive.
- Outside the condition, full content is visible and the button is hidden. Inside, existing modes, overflow detection, and `autoHide` apply.
- The instance and reader's expanded/collapsed choice survive repeated condition changes. Responsive changes do not emit user/API expansion events.
- Responsive changes preserve focus: defer hiding a focused toggle or collapsing a target containing focus, then recheck the current condition when focus leaves.
- JavaScript responsive options override responsive data attributes; `null` disables authored responsive configuration.
- Hidden containers and unavailable browser APIs leave content readable; `refresh()` supports manual container remeasurement.
- `destroy()` removes the enhancement and all responsive listeners, observers, and pending work.

### Verification

- **Pass:** `npm test` — 65 tests, including 50 responsive cases. Layout dimensions and observer delivery are mocked in these tests.
- **Pass:** `npm run typecheck`, `npm run pages:build`, and `npm run pack:check` (package dry-run only). Generated Pages assets match the package output; built exports load without DOM initialization.
- **Pass:** scripted headless Chrome checks against both `/demo/` (source class) and `/docs/basic/` (generated Pages/package runtime). Covered viewport widths of 375, 640, 767, 768, and 1280 CSS pixels; automatic container resizing; native Enter/Space and slider Home/End; both saved expansion choices; focused-toggle and split-link deferral; mobile horizontal overflow; and readable content with JavaScript disabled.
- **Pass:** visible classic scrollbars in border-box and content-box containers. Activation agrees with `ResizeObserver` content-box measurements after excluding padding, borders, and scrollbar space. Browser checks caught and fixed scrollbar overcounting; independent review also caught two split-focus regressions now covered by tests.
- **Not run:** screen-reader and other-browser qualification. These remain separate from source, automated, and Chrome browser evidence.

The [example instructions](examples/README.md#responsive-checks) provide repeatable viewport/container, state, focus, and no-JavaScript checks. The earlier `/demo/` and `/docs/basic/` URLs in this verification record describe the pre-consolidation pages. No package publication or deployment was performed.

## Consolidated demo and integration guide

Status: implemented; verified with the package checks and selected Chromium browser checks on 2026-11-11.

- One authored page at `examples/index.html` now combines the former index, basic, and source-demo content. `docs/index.html` is its generated Pages copy; separate basic and source-demo HTML pages were removed.
- The page provides line, item, split, short-content, container, and viewport/height examples, plus local and package-manager installation, native-module setup, all six instance methods, options, events, CSS hooks, keyboard guidance, and clipping limitations.
- The build now copies the complete core stylesheet, including split visibility and split print rules. No core class behavior, public API, framework, or dependency changed.
- **Pass:** `npm run pages:build`, `npm run typecheck`, and `npm test` (68 tests).
- **Pass:** 53 scripted Chromium browser assertions covering keyboard activation and focus, item/split visibility, both responsive saved choices, focused-toggle and focused-link deferral, opening the height-example disclosure, clipboard success and rejection, widths 320/375/390/640/768/1024/1440px without horizontal page overflow, print visibility, forced-colors focus, no-JavaScript fallback, and source-page initialization. No browser JavaScript errors were observed.
- **Pass:** generated-page/source parity, complete stylesheet copy, one H1, unique IDs, and valid internal anchors. Browser review caught and corrected an intrinsic CSS-grid sizing issue in the adjustable container on narrow screens.
- **Not run:** screen-reader, other-browser, and physical-device qualification. No publication, deployment, commit, or push was performed.

The [demo guide](examples/README.md) records the design direction, source files, repeatable manual checks, and verification artifacts.
