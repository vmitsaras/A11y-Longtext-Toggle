export const EVENTS: Readonly<{
  init: "a11y-long-text:init";
  expand: "a11y-long-text:expand";
  collapse: "a11y-long-text:collapse";
  toggle: "a11y-long-text:toggle";
  overflowChange: "a11y-long-text:overflow-change";
  destroy: "a11y-long-text:destroy";
}>;

export type A11yLongTextToggleResponsiveOptions =
  | { mediaQuery: string; container?: never; maxWidth?: never }
  | { container: HTMLElement | string; maxWidth: number | string; mediaQuery?: never };

export interface A11yLongTextToggleOptions {
  target?: HTMLElement | string;
  mode?: "lines" | "height" | "items" | "split";
  collapsedLines?: number | string;
  /** Maximum number of direct <li> children to show in each list while collapsed. */
  collapsedItems?: number | string;
  collapsedHeight?: string;
  autoHide?: boolean | string;
  showMoreText?: string;
  showLessText?: string;
  fade?: boolean | string;
  allowInteractiveContent?: boolean | string;
  /** Activate collapsing only at matching viewport/container widths. Null overrides data attributes. */
  responsive?: A11yLongTextToggleResponsiveOptions | null;
}

export interface A11yLongTextToggleInstance {
  readonly button: HTMLButtonElement;
  readonly content: HTMLElement;
  expand(options?: { silent?: boolean; keepFocus?: boolean }): void;
  collapse(options?: { silent?: boolean; keepFocus?: boolean }): void;
  toggle(options?: { silent?: boolean }): void;
  refresh(options?: { silent?: boolean }): void;
  isExpanded(): boolean;
  destroy(): void;
}

export interface A11yLongTextToggleEventDetail {
  instance: A11yLongTextToggleInstance;
}

export interface A11yLongTextToggleOverflowChangeEventDetail
  extends A11yLongTextToggleEventDetail {
  overflowing: boolean;
}

export interface A11yLongTextToggleEventMap {
  [EVENTS.init]: CustomEvent<A11yLongTextToggleEventDetail>;
  [EVENTS.expand]: CustomEvent<A11yLongTextToggleEventDetail>;
  [EVENTS.collapse]: CustomEvent<A11yLongTextToggleEventDetail>;
  [EVENTS.toggle]: CustomEvent<A11yLongTextToggleEventDetail>;
  [EVENTS.overflowChange]: CustomEvent<A11yLongTextToggleOverflowChangeEventDetail>;
  [EVENTS.destroy]: CustomEvent<A11yLongTextToggleEventDetail>;
}

export class A11yLongTextToggle implements A11yLongTextToggleInstance {
  constructor(button: HTMLButtonElement, options?: A11yLongTextToggleOptions);
  readonly button: HTMLButtonElement;
  readonly content: HTMLElement;
  expand(options?: { silent?: boolean; keepFocus?: boolean }): void;
  collapse(options?: { silent?: boolean; keepFocus?: boolean }): void;
  toggle(options?: { silent?: boolean }): void;
  refresh(options?: { silent?: boolean }): void;
  isExpanded(): boolean;
  destroy(): void;
}
