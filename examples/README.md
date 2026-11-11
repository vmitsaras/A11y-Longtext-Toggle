# Demo and integration guide

One authored page, [index.html](./index.html), combines the live examples, installation, setup, methods, options, events, styling hooks, and accessibility guidance. `page.css` and `page.js` are demo-only assets. The package has a vanilla JavaScript core with a typed package entry point and no runtime dependencies.

## Run locally

From the repository root:

```sh
npm install
npm run pages:build
python3 -m http.server 4187 --bind 127.0.0.1
```

Open `http://127.0.0.1:4187/examples/` for the source page or `http://127.0.0.1:4187/docs/` for the generated Pages version. Both use the built package. The Pages generator rewrites runtime paths and copies the page assets; `docs/` is generated output. The earlier `examples/basic/`, `docs/basic/`, and `demo/` pages were removed when the demos were consolidated.

The page explains installation with npm, pnpm, or Yarn and a local checkout setup for development. The core class can also be used directly from its source files, without a build step.

## Try it

- **Line preview:** the backpack description in the hero shows four lines with an optional fade. Tab to its button and press Enter or Space. Focus stays on the button; its label, `aria-expanded`, and the visible state readout change.
- **Item mode:** the packing checklist keeps the first two direct items in each ordered or unordered list. Nested lists are counted separately; surrounding text stays visible.
- **Split mode:** the materials example uses one authored `data-a11y-long-text-more` remainder containing a real in-page link. The remainder is hidden with native `hidden` behavior while collapsed, including removal from keyboard navigation.
- **Short content:** the care instructions remain readable, and their unnecessary button disappears after initialization.
- **Container activation:** the repairs example uses split mode at content widths of at most 640 CSS pixels. A labeled slider changes the requested content width; available space caps the actual width. Use a wide viewport to try both states.
- **Viewport activation:** open the height-preview disclosure. Below 48rem, overflowing delivery copy gets a 6rem preview. At larger viewport widths, it is fully visible without a toggle.

All descriptions and list items are present before JavaScript runs. The native height-example disclosure can be opened without JavaScript. The width slider remains disabled until its handler is installed. Code-copy buttons appear only when the Clipboard API is available; code can always be selected directly. Initialization refreshes the height example when its surrounding disclosure opens so measurements are taken while visible.

## Copy the pattern

Keep one content region and its native button in the authored HTML. Point `data-target` at an ID or selector. If the target lacks an ID, the class generates one for `aria-controls`. Use specific “Show full…” and “Show less…” labels, import the package CSS, and provide a visible button focus style.

Do not put links, buttons, or other focusable controls inside text collapsed with line or height clipping. Clipping changes visual presentation only; the class detects common focusable descendants and leaves that region expanded by default. Use split mode for interactive rich text. Item mode applies the same safeguard unless `allowInteractiveContent` is enabled.

Call `refresh()` after changing content, and `destroy()` when removing an enhanced component. The [package README](../README.md) contains the complete API contract.

`refresh()` does not re-read initialization options or find replacement targets/split remainders. Destroy and reinitialize after replacing those elements or changing configuration. Reinitializing a live button returns its existing instance. The `.js-long-text-toggle` class is only this page's initialization hook; importing the package does not automatically enhance matching buttons.

Use text-only labels because the class replaces button `textContent`. Set line/height preview values through options or data attributes, which write CSS properties inline. Fade height and both fade colors can be set in CSS. The guide also documents metadata/type imports and method options: `silent` suppresses that call's events, while `keepFocus: false` does not disable focus recovery before hiding a focused split remainder or list item.

## Responsive checks

These are repeatable manual instructions, not evidence of screen-reader or other-browser qualification.

1. At a viewport above 48rem, open the height-example disclosure. Confirm its full delivery text is readable and its toggle hidden. Narrow below 48rem, expand the description with Enter or Space, then widen and narrow again. The expanded choice should be retained. Collapse it and repeat.
2. Focus the delivery toggle in the narrow viewport, then widen the browser. It should remain available until focus leaves. Tab away; it should disappear without moving focus back. Reverse the width before leaving focus to check that stale changes are not applied.
3. In a wide viewport, set the container slider above 640px and below it. Only its repair description should change. Expand its remainder, widen and narrow, and confirm the saved choice. Repeat while collapsed. Slider Home/End should reach both limits.
4. With the repair choice collapsed but the container wide, focus its link and narrow the browser so the container becomes at most 640px. The link should stay visible until focus leaves the target. Widen again before moving focus to check cancellation of the deferred collapse.
5. At 320–390px and at browser zoom, confirm there is no horizontal page scrolling. Long code and reference tables can scroll within their own labeled, keyboard-focusable regions. Confirm all buttons retain visible focus.
6. Disable JavaScript and reload. Open the native height disclosure. All text, list items, split remainders, and their links must remain readable. The slider stays disabled, and copy controls and the live state readout stay hidden.
7. Print with JavaScript enabled. All plugin content, including collapsed lists and split remainders in an open disclosure, should be revealed by the package stylesheet.
8. Use each copy button. Confirm it copies the associated code. If clipboard permission is refused, the status message offers direct selection instead.

## Design direction

The page serves developers evaluating a small text-disclosure utility. Its sequence is live behavior → additional content modes → installation → API → accessibility responsibilities. A split hero pairs the practical message with the actual interaction. Related examples share a two-column grid; setup pairs brief instructions with code, and API data uses tables. Narrow layouts follow the same document order in one column.

Warm paper, deep green, restrained lime accents, serif sample typography, and monospace annotations give the page the feel of a compact field guide. The example is the dominant visual; there are no remote assets or added motion. This favors readable documentation and visible behavior over decorative imagery.

The creative-direction workflow used repository facts, Mobbin references, a bounded structural grid pass, demo storytelling, and evidence-based copywriting. No specialist council was needed. Structural references inspected: [Anchor developer hub](https://mobbin.com/sites/sections/c9310efe-b671-4cb9-8c59-0807ff33ab22) for its split introduction, and [Canva developer hero](https://mobbin.com/sites/sections/69ba4b70-608e-44f8-bbcb-c75d1465e6dd) for its direct typographic hierarchy. Neither reference is embedded in the page. Feasibility: implemented with static HTML, local CSS, and a small module using the existing class.

## Verification on 2026-11-11

- **Pass:** `npm run pages:build`, `npm run typecheck`, and `npm test` (68 tests).
- **Pass:** 53 browser assertions in local Chromium, covering native keyboard activation and visible focus, list/split state, responsive state retention and focus deferral, hidden-disclosure measurements, clipboard success and denied access, print visibility, forced-colors focus, no-JavaScript fallback, and source-page initialization.
- **Pass:** no horizontal page overflow at 320, 375, 390, 640, 768, 1024, or 1440 CSS pixels. Desktop and mobile screenshots were reviewed.
- **Pass:** generated/source HTML parity, stylesheet parity with the core CSS, unique IDs, valid internal anchors, one H1, and no observed browser JavaScript errors.
- **Not run:** screen-reader, other-browser, physical-device, and browser-zoom qualification. Width-based reflow checks are separate from browser-zoom testing.

Browser checks and captured evidence are under `output/playwright/`: [verification script](../output/playwright/verify.cjs), [results](../output/playwright/browser-verification.txt), [desktop viewport](../output/playwright/desktop.png), [desktop page](../output/playwright/desktop-full.png), and [mobile viewport](../output/playwright/mobile-viewport.png).

No dependencies were added. No publication, deployment, commit, or push was performed.

## Files changed for consolidation

- Added/replaced: `examples/index.html`, `examples/page.css`, `examples/page.js`, and this `examples/README.md` (moved and rewritten from the basic guide).
- Removed: `examples/basic/index.html`, `examples/basic/README.md`, and `demo/index.html`.
- Updated: `scripts/build-pages.mjs`, `scripts/copy-styles.mjs`, `src/docs.ts`, root `README.md`, and `ROADMAP.md`.
- Regenerated: `docs/index.html`, `docs/page.css`, `docs/page.js`, `docs/dist/index.js`, and `docs/dist/styles.css`; removed `docs/basic/index.html`. The generated `.nojekyll` marker is retained.
- Local verification artifacts: `output/playwright/` (script, results, and screenshots).

The canonical package stylesheet is `src/a11y-long-text-toggle.css`. The package builder copies it to `dist/styles.css`, and the Pages builder copies that runtime stylesheet into `docs/dist/styles.css`.

## Documentation sync on 2026-11-11

The root README, `src/docs.ts`, and the reference sections of this guide were synchronized with the current source and declaration file. The existing consolidated page is retained; no separate `examples/basic/` page was added. All 11 options, six methods, six events, exported types, initialization hooks, five CSS properties, keyboard/focus behavior, and clipping limitations are covered. Runtime code, package exports, dependencies, and demo interactions were unchanged.

- **Pass:** `npm run typecheck`, `npm test` (68 tests), `npm run pages:build`, and `npm run pack:check` (dry run only).
- **Pass:** local Node/jsdom checks for built package and metadata imports, documented options/methods/events/properties, valid example assets and internal anchors, unique IDs, and generated-page/runtime/stylesheet parity.
- **Not run for this documentation pass:** browser interaction, visual, screen-reader, other-browser, physical-device, and browser-zoom checks. The browser evidence recorded above belongs to the earlier consolidation pass.
- **Remaining source drift:** `src/styles.css` is an older duplicate missing the canonical stylesheet's split visibility/print rules. It is not used by the package or Pages builder; use the documented CSS export or canonical source file. Consolidating that duplicate is outside this documentation pass.

No publication, deployment, commit, or push was performed.
