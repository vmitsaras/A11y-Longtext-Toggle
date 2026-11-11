export interface PluginDocs {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  repo?: string;
  npm?: string;
  install: { npm: string; pnpm: string; yarn: string };
  usage: string;
  selectors?: string[];
  keyboard?: Array<{ key: string; description: string }>;
  api: Array<{ name: string; type: string; description: string }>;
  examples?: Array<{ name: string; description: string; path: string }>;
}

export const docs = {
  slug: "a11y-long-text-toggle",
  name: "A11y Long Text Toggle",
  packageName: "a11y-long-text-toggle",
  description:
    "Progressively enhance long text with an accessible show and hide button.",
  repo: "https://github.com/vmitsaras/A11y-Longtext-Toggle",
  install: {
    npm: "npm install a11y-long-text-toggle",
    pnpm: "pnpm add a11y-long-text-toggle",
    yarn: "yarn add a11y-long-text-toggle",
  },
  usage: `import { A11yLongTextToggle } from "a11y-long-text-toggle";
import "a11y-long-text-toggle/styles.css";

const button = document.querySelector("[data-target='product-description']");
if (button instanceof HTMLButtonElement) {
  new A11yLongTextToggle(button, {
    collapsedLines: 4,
    showMoreText: "Show full product description",
    showLessText: "Show less product description",
  });
}`,
  selectors: [
    "button[data-target]",
    "button[aria-controls]",
    "[data-a11y-long-text-more]",
    "button[data-media-query]",
    "button[data-container][data-container-max-width]",
    ".a11y-long-text",
    ".a11y-long-text--collapsed",
    ".a11y-long-text--expanded",
    ".a11y-long-text--overflow",
    ".a11y-long-text__fade",
    ".a11y-long-text__item--collapsed",
  ],
  keyboard: [
    { key: "Tab / Shift+Tab", description: "Follow native focus order to and from a visible, enabled toggle. Provide a visible button focus style." },
    { key: "Enter / Space", description: "Activate the native button to expand or collapse. Focus stays on the button; no focus jump into content." },
  ],
  api: [
    {
      name: "new A11yLongTextToggle(button, options)",
      type: "(button: HTMLButtonElement, options?: A11yLongTextToggleOptions) => A11yLongTextToggleInstance",
      description: "Enhances a native button and an existing content region that is fully visible before JavaScript. Call explicitly; imports do not initialize buttons and there is no initAll export. Reusing a button returns its existing instance and ignores new options. Keep the button outside its target, use text-only labels, and test with target browsers and assistive technologies.",
    },
    {
      name: "createA11yLongTextToggle(button, options)",
      type: "(button: HTMLButtonElement, options?: A11yLongTextToggleOptions) => A11yLongTextToggleInstance",
      description: "Creation-function equivalent of the class constructor, with the same initialization and cleanup behavior.",
    },
    {
      name: "target",
      type: "HTMLElement | string",
      description: "Content element, ID, or selector. Falls back to data-target, then aria-controls. String lookup tries an ID before a document selector and uses the first match. Missing content IDs are generated. No specific button class is required; these hooks do not trigger initialization.",
    },
    {
      name: "mode",
      type: '"lines" | "height" | "items" | "split"',
      description: "Default lines; data-mode. Lines and height clip visually, leaving text in the document. Items hides complete list items with display: none. Split uses native hidden on exactly one stable descendant [data-a11y-long-text-more] region; leave it visible in authored HTML and keep its button outside the remainder. Invalid modes use lines.",
    },
    {
      name: "collapsedLines",
      type: "number | string",
      description: "Default 3; data-collapsed-lines. Positive integer line count in lines mode. Invalid values use 3. JavaScript options override attributes; initialization writes --a11y-long-text-collapsed-lines inline.",
    },
    {
      name: "collapsedHeight",
      type: "string",
      description: "Default 8rem; data-collapsed-height. Valid CSS height in height mode, passed to CSS without validation. Initialization writes --a11y-long-text-collapsed-height inline.",
    },
    {
      name: "collapsedItems",
      type: "number | string",
      description: "Default 3; data-collapsed-items. Positive integer count of visible direct li children in each ol or ul, including a list used as the target. Nested lists count separately; surrounding text stays visible. Invalid values use 3. Line, height, and fade settings do not apply in items mode.",
    },
    {
      name: "autoHide",
      type: "boolean | string",
      description: "Default true; data-auto-hide. Hide the button when content fits its preview. Boolean options accept booleans or case-insensitive true/false, 1/0, yes/no, on/off strings; invalid values use their default.",
    },
    {
      name: "showMoreText",
      type: "string",
      description: "data-show-more-text. Defaults to trimmed authored button text or Show full content. Nonempty strings are trimmed; invalid or blank values use the fallback. Use a label naming the content being revealed.",
    },
    {
      name: "showLessText",
      type: "string",
      description: "Default Show less; data-show-less-text. Nonempty collapse label; use a specific content name when multiple toggles share a page. Labels replace button textContent, including nested markup.",
    },
    {
      name: "fade",
      type: "boolean | string",
      description: "Default false; data-fade. Optional visual fade for lines/height only. The stylesheet exposes --a11y-long-text-fade-height (2.5rem), --a11y-long-text-fade-from (rgb(255 255 255 / 0)), and --a11y-long-text-fade-to (Canvas). Match the fade to the host background. Forced colors remove it; it does not replace the button.",
    },
    {
      name: "allowInteractiveContent",
      type: "boolean | string",
      description: "Default false; data-allow-interactive-content. Common focusable descendants in lines, height, or items mode otherwise leave all content visible and hide the toggle. Do not place controls in visually clipped content: they may remain keyboard reachable. Use split mode for interactive rich text. Opting in for items mode hides whole items and recovers focus before hiding a focused item.",
    },
    {
      name: "responsive",
      type: '{ mediaQuery: string } | { container: HTMLElement | string; maxWidth: number | string } | null',
      description: "Default null (all widths). Choose data-media-query or data-container with data-container-max-width. Activate when a viewport query matches or a distinct ancestor container has positive content-box width at most maxWidth CSS pixels (a finite positive number or numeric string). Outside the condition, content is visible and the toggle hidden even with autoHide false. JavaScript replaces all responsive attributes; null disables them. Mixed/invalid configurations throw before markup changes. Automatic changes retain the saved choice, defer hiding focused content/buttons, and emit no expand/collapse/toggle events. Without matchMedia viewport activation stays inactive; without ResizeObserver call refresh after container changes.",
    },
    {
      name: "button / content",
      type: "readonly button: HTMLButtonElement; readonly content: HTMLElement",
      description: "Public element references on A11yLongTextToggleInstance. The button's aria-controls references the target ID; aria-expanded describes the presentation. No live region, disabled-state management, or custom keyboard shortcuts are added.",
    },
    {
      name: "expand(options?)",
      type: "(options?: { silent?: boolean; keepFocus?: boolean }) => void",
      description: "Save the expanded choice and reveal content. Emit expand only when the choice changes. Defaults: silent false, keepFocus true. keepFocus re-focuses an already-focused button with preventScroll, without moving focus from elsewhere. silent suppresses events for this call.",
    },
    {
      name: "collapse(options?)",
      type: "(options?: { silent?: boolean; keepFocus?: boolean }) => void",
      description: "Save the collapsed choice and apply the preview when allowed; the focusable-content safeguard can prevent it. Emit collapse only when the choice changes. Defaults: silent false, keepFocus true. If a split remainder or list item being hidden contains focus, move focus to the button first, even with keepFocus false.",
    },
    {
      name: "toggle(options?)",
      type: "(options?: { silent?: boolean }) => void",
      description: "Switch the saved choice unless prevented by the safeguard. Emit expand/collapse followed by toggle. The native button calls this on click; silent true suppresses both events.",
    },
    {
      name: "refresh(options?)",
      type: "(options?: { silent?: boolean }) => void",
      description: "Recheck overflow, interactive descendants, and responsive conditions. Call after application text changes or revealing a previously unmeasurable target; ResizeObserver also schedules refreshes. Emit overflow-change on measurement changes unless silent true. Item mode recovers focus before hiding a newly collapsible focused item. Options are not re-read; replace the target/split remainder only after destroy and reinitialization.",
    },
    {
      name: "isExpanded()",
      type: "() => boolean",
      description: "Reports the saved expanded/collapsed choice, which may differ from visible content when responsive activation is inactive, content fits its preview, or the safeguard prevents collapsing. aria-expanded reports the presentation.",
    },
    {
      name: "destroy()",
      type: "() => void",
      description: "Restore authored button text, attributes, managed classes/styles, generated IDs, and split visibility. Remove listeners, observers, and pending refresh/focus work, then emit destroy. Safe to call again; mutations after destruction do nothing. Reinitialize to read new options or replacement regions.",
    },
    {
      name: "EVENTS",
      type: "typeof EVENTS",
      description: "Frozen event-name object. All events dispatch on content, bubble, are noncancelable, and do not cross Shadow DOM boundaries. Detail contains instance. Initial setup suppresses state/overflow events. EVENTS.init = a11y-long-text:init (listen before construction); expand = a11y-long-text:expand; collapse = a11y-long-text:collapse; toggle = a11y-long-text:toggle (after expand/collapse); overflowChange = a11y-long-text:overflow-change (detail also has overflowing: boolean); destroy = a11y-long-text:destroy (after cleanup).",
    },
    {
      name: "Public types",
      type: "TypeScript type exports",
      description: "Import type A11yLongTextToggleOptions, A11yLongTextToggleResponsiveOptions, A11yLongTextToggleInstance, A11yLongTextToggleEventDetail, A11yLongTextToggleOverflowChangeEventDetail, or A11yLongTextToggleEventMap from the package root. EventMap describes custom events without globally augmenting DOM listeners. Import PluginDocs and the named docs object from the /docs entry point.",
    },
  ],
  examples: [
    {
      name: "Demo and integration guide",
      description: "Build with npm run pages:build, serve the repository, and open /examples/. The consolidated page uses local dist files for line, item, split, short-content, and responsive examples, installation, API, styling, keyboard/focus checks, and limitations. No separate examples/basic page exists.",
      path: "examples/index.html",
    },
  ],
} satisfies PluginDocs;
