# Agent Instructions

## Architecture

Build this as a **vanilla JavaScript class**, not a Web Component.

Use:

```js
new A11yLongTextToggle(button, options);
```

Do not use:

```html
<a11y-long-text-toggle>
```

## Core Rules

- No framework.
- No dependencies.
- No Shadow DOM.
- No custom elements.
- No required build step for the core class.
- Enhance existing HTML.
- Full content must be visible before JavaScript runs.

## Accessibility Rules

Use native browser behavior first.

Required:

- toggle must be a real `<button>`
- button must use `aria-expanded`
- button must use `aria-controls`
- focus must stay on the button after expand/collapse
- visible focus styles must be documented
- no clickable `<div>`
- no vague button text like “More”
- no forced focus jump into content

## Content Rules

The class controls an existing content region.

The content region should:

- have an ID, or receive a generated ID
- remain readable without JavaScript
- support CMS-rendered rich text
- not require duplicated text

## Important Limitation

Do not place interactive controls inside clipped/collapsed content for MVP.

Reason: links/buttons hidden visually by clipping may still be keyboard reachable.

Document this clearly.

Future enhancement may add split mode or focusable-child handling.

## CSS Rules

Expose stable classes:

```css
.a11y-long-text
.a11y-long-text--collapsed
.a11y-long-text--expanded
.a11y-long-text--overflow
.a11y-long-text__fade
```

Use CSS custom properties:

```css
--a11y-long-text-collapsed-lines
--a11y-long-text-collapsed-height
--a11y-long-text-fade-height
```

## JavaScript Rules

The class should:

- read options from JS and `data-*` attributes
- allow JS options to override HTML attributes
- support `ResizeObserver`
- expose `refresh()`
- expose `destroy()`
- avoid global state
- clean up all listeners on destroy

## Anti-Patterns

Do not:

- create a Web Component
- hide full content before JS loads
- use links for button actions
- rely only on gradient fade
- move focus unexpectedly
- add excessive ARIA
- create a giant abstraction
