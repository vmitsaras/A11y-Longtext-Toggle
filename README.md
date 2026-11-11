# A11y Long Text Toggle

Progressively enhance long product descriptions and other CMS-rendered text with a native show and hide button. The full content remains readable before JavaScript runs. No runtime dependencies or framework are required.

## Installation

Install with your preferred package manager:

```sh
npm install a11y-long-text-toggle
pnpm add a11y-long-text-toggle
yarn add a11y-long-text-toggle
```

### Local development

To use a local checkout, build the package first:

```sh
npm install
npm run build:dist
```

Then, from your consuming project, install the checkout using its actual path:

```sh
npm install ../A11y-Longtext-Toggle
```

## Usage

```ts
import { A11yLongTextToggle } from "a11y-long-text-toggle";
import "a11y-long-text-toggle/styles.css";

const button = document.querySelector("[data-target='product-description']");
if (button instanceof HTMLButtonElement) {
  const toggle = new A11yLongTextToggle(button, { collapsedLines: 4 });
  // Call toggle.refresh() after replacing its content in a CMS flow.
}
```

`new A11yLongTextToggle(button, options)` and the equivalent `createA11yLongTextToggle(button, options)` export enhance existing markup. Importing the package does not initialize any buttons; create one instance per button. There is no `initAll()` export.

### Without a bundler

The vanilla JavaScript core needs no build step. Copy [the class](./src/a11y-long-text-toggle.js) and [its stylesheet](./src/a11y-long-text-toggle.css) into your project and load them with native HTML:

```html
<link rel="stylesheet" href="./a11y-long-text-toggle.css" />
<!-- Place your content and button before this script. -->
<script type="module">
  import { A11yLongTextToggle } from "./a11y-long-text-toggle.js";

  const button = document.querySelector("[data-target='product-description']");
  if (button instanceof HTMLButtonElement) {
    new A11yLongTextToggle(button);
  }
</script>
```

Use a stylesheet link in plain HTML; the JavaScript CSS import in the package example requires a CSS-aware bundler.

## HTML structure

```html
<article>
  <h2>Field Notes travel backpack</h2>
  <div id="product-description" class="a11y-long-text">
    <p>Short preview supplied by the CMS...</p>
    <div data-a11y-long-text-more>
      <p>The rest of the description, including <a href="/materials">useful links</a>, stays in this region.</p>
    </div>
  </div>
  <button
    type="button"
    data-target="product-description"
    data-mode="split"
    data-show-more-text="Show full backpack description"
    data-show-less-text="Show less backpack description"
  >
    Show full backpack description
  </button>
</article>
```

Keep the button outside the content region and use `type="button"`. Leave all content visible in authored HTML: do not add collapse state classes or `hidden` before initialization. The content needs an ID, or the class generates one. The button can also identify the target through `aria-controls`. The class writes and updates `aria-controls` and `aria-expanded`. Use specific, text-only button labels: the class updates `textContent`, replacing any nested markup.

### Targets without an authored ID

If the CMS does not provide an ID, use a data attribute to locate the content through a CSS selector in `data-target`:

```html
<div data-long-text="description">
  <p>Full product description…</p>
</div>
<button
  type="button"
  data-target="[data-long-text='description']"
>
  Show full product description
</button>
```

Pass this button to `new A11yLongTextToggle(button)`. The class generates an ID for the content and sets the button's `aria-controls` to that ID. If the content already has an ID, the class reuses it. `aria-controls` references an ID, so the data attribute provides the JavaScript lookup while the ID provides the ARIA relationship.

Use a selector that identifies exactly one intended target in the document, with a distinct value for each content region. `data-long-text` is an example hook, not a required attribute. The generated ID stays unchanged through toggling and `refresh()`. `destroy()` removes the generated ID and restores the button's authored ARIA attributes; it preserves an authored content ID. The data attributes remain available for reinitialization.

## Ordered and unordered lists

Use `mode: "items"` with `collapsedItems` to hide complete list items instead of cutting through an item. The count applies to direct `<li>` children in each `<ol>` and `<ul>` in the target; nested lists are counted separately. Content outside the lists remains visible.

```html
<div id="packing-checklist">
  <ol>
    <li>Check the route and estimated travel time.</li>
    <li>Pack a refillable bottle and a lightweight rain shell for the day.</li>
    <li>Confirm the charger and travel documents are in the front pocket.</li>
  </ol>
  <ul>
    <li>Keys, headphones, and a notebook.</li>
    <li>A compact umbrella for wet weather.</li>
    <li>A small snack for the journey.</li>
  </ul>
</div>
<button type="button" data-target="packing-checklist" data-mode="items" data-collapsed-items="2">
  Show full packing checklist
</button>
```

The default count is three. `collapsedItems` can also be passed in JavaScript options. The control and list content remain fully visible before JavaScript runs.

## Responsive activation

Use `responsive` when collapsing should be available only at particular viewport or container widths. Create the instance once; it keeps the reader's expanded/collapsed choice while the layout changes.

```js
// Collapse is available below a 48rem viewport width.
new A11yLongTextToggle(button, {
  mode: "height",
  collapsedHeight: "400px",
  responsive: { mediaQuery: "(width < 48rem)" },
});

// Alternative: use the content box of an existing ancestor.
new A11yLongTextToggle(otherButton, {
  mode: "height",
  collapsedHeight: "400px",
  responsive: { container: "#description-column", maxWidth: 640 },
});
```

Choose one form per instance. `mediaQuery` is a nonempty media-query string evaluated with `matchMedia`. `container` accepts an `HTMLElement` or selector for an existing ancestor of the target, distinct from the target itself. Its content-box width is compared with an inclusive `maxWidth` in CSS pixels. `maxWidth` accepts a finite positive number or numeric string, such as `640` or `"640"`, rather than a CSS length such as `"40rem"`. Use a container whose width is controlled by the surrounding layout and does not change when its button or content expands.

| Condition | Content | Button |
| --- | --- | --- |
| Responsive condition does not match | Fully visible | Hidden, including with `autoHide: false` |
| Condition matches and content fits the preview | Fully visible | Hidden with the default `autoHide: true` |
| Condition matches and content overflows | Uses the selected collapse mode and saved choice | Visible |

With no responsive configuration, the existing behavior applies at every width. If only content height matters, `mode: "height"`, `collapsedHeight: "400px"`, and `autoHide: true` already show a toggle when narrower text wrapping exceeds 400px; no width condition is required.

The same configuration can be authored on the button:

```html
<button type="button" data-target="description" data-media-query="(width < 48rem)">
  Show full description
</button>

<!-- Alternative: target content must be inside #description-column. -->
<button type="button" data-target="other-description"
  data-container="#description-column" data-container-max-width="640">
  Show full other description
</button>
```

Do not combine viewport and container settings. Invalid or mixed configurations throw before authored markup is changed. A supplied JavaScript `responsive` option replaces all responsive data attributes; `responsive: null` disables responsive activation inherited from HTML. Other JavaScript options continue to override their matching data attributes.

Responsive layout changes do not emit `expand`, `collapse`, or `toggle` events or overwrite the saved choice. `isExpanded()` reports that saved choice; `aria-expanded` describes the current presentation, so it is `true` while responsive activation is inactive and the whole content is visible. Explicit `expand()`, `collapse()`, and `toggle()` calls still update the saved choice and emit the usual state-change events, including while inactive.

If a layout change would hide the focused toggle, deactivation waits until focus leaves the button. If activation would collapse content containing focus, the content stays visible until focus leaves the target. Each deferred change rechecks the latest condition, so a quick resize back does not apply an outdated state. These automatic changes never move focus. The same behavior applies to split and item modes; the existing safeguards for interactive content remain in place.

Viewport changes are watched through `MediaQueryList` and container changes through `ResizeObserver`. A hidden or zero-width container remains inactive until measurable. If `ResizeObserver` is unavailable, call `refresh()` after container-width changes. If `matchMedia` is unavailable, viewport activation remains inactive and the content stays readable. `destroy()` removes responsive listeners, observers, and pending focus/refresh work along with the existing enhancement. Full content remains readable before JavaScript runs.

## CSS

Import `a11y-long-text-toggle/styles.css` for the default line/height clamp, item-mode list hiding, split-region visibility, fade, forced-colors, reduced-motion, and print styles. The build copies the canonical `src/a11y-long-text-toggle.css` to `dist/styles.css`.

| Public custom property | Default | Purpose |
| --- | --- | --- |
| `--a11y-long-text-collapsed-lines` | `3` | Line-mode preview count |
| `--a11y-long-text-collapsed-height` | `8rem` | Height-mode preview limit |
| `--a11y-long-text-fade-height` | `2.5rem` | Optional fade height |
| `--a11y-long-text-fade-from` | `rgb(255 255 255 / 0)` | Transparent start of the fade |
| `--a11y-long-text-fade-to` | `Canvas` | Fade background color; match it to the host surface |

Set line and height values through options or data attributes: initialization writes those two properties inline, overriding ordinary stylesheet values. Customize fade height and colors directly in CSS.

| Stable class | Purpose |
| --- | --- |
| `.a11y-long-text` | Content block; added during initialization |
| `.a11y-long-text--collapsed` | Collapsed presentation |
| `.a11y-long-text--expanded` | Expanded presentation |
| `.a11y-long-text--overflow` | Content exceeds its configured preview while activation is active |
| `.a11y-long-text__fade` | Optional fade on the content block, using `::after` |
| `.a11y-long-text__item--collapsed` | Hidden list item in item mode |

The class writes `data-a11y-long-text-mode` on the content for mode-specific styling. Do not author state classes to pre-collapse content. There are no bundled theme variants. The stylesheet adds no animation; its reduced-motion rule disables content transitions. Forced-colors mode removes the fade, and print styles reveal clipped text, hidden list items, and split remainders. Ancestors hidden by the host page, such as closed disclosures, must still be opened for printing.

Provide a visible `:focus-visible` style for your button. The stylesheet leaves button styling to the host page; for example:

```css
button:focus-visible {
  outline: 3px solid Highlight;
  outline-offset: 3px;
}
```

## API

### Options and data attributes

Pass `A11yLongTextToggleOptions` to the constructor or factory. JavaScript options override matching button attributes; an `undefined` option falls back to its attribute/default.

The initial saved choice is collapsed. Responsive activation, fitting content, or the interactive-content safeguard may still leave the full content visible; `aria-expanded` reflects that presentation.

| Option | Button attribute | Default | Behavior |
| --- | --- | --- | --- |
| `target` | `data-target` | `data-target`, then `aria-controls` | `HTMLElement`, ID, or CSS selector. String lookup tries an ID before a document selector; the first match is used. |
| `mode` | `data-mode` | `"lines"` | `"lines"`, `"height"`, `"items"`, or `"split"` |
| `collapsedLines` | `data-collapsed-lines` | `3` | Positive integer or numeric string; line mode only |
| `collapsedHeight` | `data-collapsed-height` | `"8rem"` | Valid CSS height string; height mode only |
| `collapsedItems` | `data-collapsed-items` | `3` | Positive integer or numeric string; count per list in item mode |
| `autoHide` | `data-auto-hide` | `true` | Hide an unnecessary toggle; full content stays visible when it fits |
| `showMoreText` | `data-show-more-text` | Trimmed authored button text, or `"Show full content"` | Nonempty reveal label |
| `showLessText` | `data-show-less-text` | `"Show less"` | Nonempty collapse label; include the content name for clarity |
| `fade` | `data-fade` | `false` | Optional visual fade in line/height mode |
| `allowInteractiveContent` | `data-allow-interactive-content` | `false` | Bypass the common focusable-descendant safeguard; see the clipping limitation |
| `responsive` | `data-media-query`, or `data-container` with `data-container-max-width` | `null` (all widths) | One viewport or ancestor-container condition; see [responsive activation](#responsive-activation) |

Invalid modes fall back to line mode. Invalid counts (including fractions or zero) fall back to `3`. Boolean options accept booleans or the case-insensitive strings `true`/`false`, `1`/`0`, `yes`/`no`, and `on`/`off`; other values use the default. Invalid or blank label strings use their fallback. `collapsedHeight` is passed to CSS without validation, so supply a valid length.

`data-target` and `aria-controls` identify content; they do not trigger initialization. The example's `.js-long-text-toggle` class is only a page-script hook. No particular button class is required by the core.

`mode: "items"` uses `collapsedItems` (default `3`) and applies only to `<ol>` or `<ul>` lists in the target. Each list shows its first N direct items while collapsed. Content outside lists stays visible. Expand reveals all items. Line, height, and fade options do not also apply in item mode.

Use `mode: "split"` when rich text contains links or controls that should not be clipped:

```html
<div id="product-description">
  <p>This preview is always visible.</p>
  <div data-a11y-long-text-more>
    <p>The rest can contain <a href="/materials">links</a> or other controls.</p>
  </div>
</div>
<button type="button" data-target="product-description" data-mode="split">
  Show full description
</button>
```

The content target must contain exactly one marked region, which must be a stable descendant and must not have a `hidden` attribute in the authored HTML. Keep the toggle button outside the marked region. It remains visible before JavaScript runs; split mode then uses the native `hidden` property to hide or reveal the entire region. The button's `aria-controls` continues to reference the whole content target. Call `refresh()` after changing the marked region's contents. `fade`, `collapsedLines`, `collapsedItems`, and `collapsedHeight` do not affect split mode.

### Instance methods and types

The instance exposes `button` and `content` element references and these methods:

| Method | Behavior |
| --- | --- |
| `expand({ silent = false, keepFocus = true } = {})` | Save the expanded choice, reveal content, and emit `expand` if the choice changed. |
| `collapse({ silent = false, keepFocus = true } = {})` | Save the collapsed choice and apply the preview when allowed; emit `collapse` if the choice changed. The focusable-content safeguard can prevent collapsing. |
| `toggle({ silent = false } = {})` | Switch the saved choice; emit the corresponding `expand`/`collapse`, then `toggle`, unless the safeguard prevents it. |
| `refresh({ silent = false } = {})` | Recheck content, overflow, interactive descendants, and responsive conditions; emit `overflow-change` if measured overflow changed. |
| `isExpanded()` | Return the saved choice as a boolean. The content can still be fully visible when responsive activation is inactive, content fits, or the safeguard prevents collapsing. |
| `destroy()` | Restore the authored text, attributes, managed classes/styles, and split visibility; remove generated IDs, listeners, observers, and pending work. Repeated calls do nothing. |

All methods other than `isExpanded()` return `void`. `{ silent: true }` suppresses that call's events. `keepFocus` only re-focuses an already-focused button with `preventScroll`; it does not move focus into content. Setting it to `false` does not disable recovery from a focused split remainder or list item about to be hidden. Item-mode `refresh()` also moves focus to the button if a changed list would hide its focused item.

`ResizeObserver` schedules refreshes when available; call `refresh()` after application-driven text changes and after making a previously hidden target measurable. The split remainder must stay the same element; destroy and reinitialize when replacing the target or that remainder. Options and labels are read at initialization, not re-read from attributes by `refresh()`. Reinitializing the same button returns its existing instance and ignores new options until `destroy()`.

Type exports are `A11yLongTextToggleOptions`, `A11yLongTextToggleResponsiveOptions`, `A11yLongTextToggleInstance`, `A11yLongTextToggleEventDetail`, `A11yLongTextToggleOverflowChangeEventDetail`, and `A11yLongTextToggleEventMap`. Use `import type` from the package root. `A11yLongTextToggleEventMap` describes the custom events; it does not augment DOM listener types globally.

### Lifecycle events

The content region emits bubbling lifecycle events. Import the frozen `EVENTS` object to avoid repeating event-name strings:

```ts
import { EVENTS } from "a11y-long-text-toggle";

content.addEventListener(EVENTS.expand, (event) => {
  const { instance } = (event as CustomEvent).detail;
  console.log(instance.isExpanded());
});
```

All events are dispatched from the content element with `bubbles: true`, `composed: false`, and `cancelable: false`. Their detail includes `instance`; `overflow-change` also includes the boolean `overflowing`. Attach the `init` listener before construction to observe it.

| Event | Name | Trigger / ordering |
| --- | --- | --- |
| `EVENTS.init` | `a11y-long-text:init` | Successful initialization, after initial state and listeners are set up |
| `EVENTS.expand` | `a11y-long-text:expand` | `expand()` changes the saved choice; before `toggle` when called through it |
| `EVENTS.collapse` | `a11y-long-text:collapse` | `collapse()` changes the saved choice; before `toggle` when called through it |
| `EVENTS.toggle` | `a11y-long-text:toggle` | `toggle()` switches the choice; after the corresponding `expand` or `collapse` event |
| `EVENTS.overflowChange` | `a11y-long-text:overflow-change` | `refresh()` changes measured overflow; after applying the overflow class and button visibility |
| `EVENTS.destroy` | `a11y-long-text:destroy` | Cleanup completes, after restoring managed markup and removing generated IDs |

Repeated `expand()` or `collapse()` calls that leave state unchanged emit no state-change event. Initial setup and calls with `{ silent: true }` suppress state-change events. No lifecycle event crosses a Shadow DOM boundary.

## Accessibility notes

- The control is a native button, so Tab, Enter, and Space behavior comes from the browser.
- Focus stays on the button after user-triggered expansion or collapse. Programmatic calls leave focus where it is, except when collapsing would hide the focused split region or list item; focus then moves to the button before that content is hidden.
- In line and height modes, the full content remains in the document and collapsing changes its visual presentation only. In item mode, list items after the configured count remain in the DOM but use `display: none` while collapsed, removing their content from rendering, keyboard navigation, and the accessibility tree. In split mode, the marked region remains in the DOM and native `hidden` removes it from rendering and keyboard navigation while collapsed.
- Content stays fully visible before JavaScript runs or if initialization fails.
- **Clipping limitation:** do not put links, buttons, or other focusable controls in content collapsed with line or height clipping. By default, common focusable descendants cause the class to leave content expanded and hide its toggle. `allowInteractiveContent` disables that safeguard and should be used only when the host handles focusable descendants safely. Use split mode when interactive rich text needs a collapsible remainder.
- The same focusable-content safeguard applies in item mode by default. If `allowInteractiveContent` is enabled, list items after the count are hidden with `display: none`; collapsing moves focus to the button if focus is inside an item that will be hidden.
- Short content hides its toggle by default. Printing displays the full content.
- The class adds no live region or custom keyboard shortcuts and does not manage a disabled state. A button authored with `disabled` keeps native disabled behavior. The example's copy-status live region belongs to the demo, not the plugin.
- Still test the final integration with your target browsers and assistive technologies. Automated tests and local browser checks do not establish screen-reader qualification or complete WCAG conformance.

## Example

See the [single demo and integration guide](./examples/index.html) for product descriptions, list and split modes, short content, viewport/container responsive examples, installation, methods, options, events, and accessibility notes. The [example instructions](./examples/README.md) explain how to run it and repeat the manual checks.

## Docs metadata

```ts
import { docs } from "a11y-long-text-toggle/docs";
```

## GitHub Pages

`npm run pages:build` builds the package and regenerates the committed `docs/` folder. Treat `docs/` as generated output and do not edit it by hand. In the GitHub repository, choose **Settings → Pages → Build and deployment → Deploy from a branch → `main` → `/docs`**. The expected project site is [https://vmitsaras.github.io/A11y-Longtext-Toggle/](https://vmitsaras.github.io/A11y-Longtext-Toggle/).

The source page is `examples/index.html`, with demo-only styles and behavior in `examples/page.css` and `examples/page.js`. The build copies that one page to `docs/index.html` and adjusts its runtime paths. There is no separate basic-demo page.
