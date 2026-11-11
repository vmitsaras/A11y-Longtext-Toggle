import { A11yLongTextToggle, EVENTS } from "./a11y-long-text-toggle.js";
import type {
  A11yLongTextToggleEventDetail,
  A11yLongTextToggleEventMap,
  A11yLongTextToggleInstance,
  A11yLongTextToggleOverflowChangeEventDetail,
  A11yLongTextToggleOptions,
  A11yLongTextToggleResponsiveOptions,
} from "./a11y-long-text-toggle.js";

export { A11yLongTextToggle, EVENTS };
export type {
  A11yLongTextToggleEventDetail,
  A11yLongTextToggleEventMap,
  A11yLongTextToggleInstance,
  A11yLongTextToggleOverflowChangeEventDetail,
  A11yLongTextToggleOptions,
  A11yLongTextToggleResponsiveOptions,
};

export function createA11yLongTextToggle(
  button: HTMLButtonElement,
  options: A11yLongTextToggleOptions = {},
): A11yLongTextToggleInstance {
  return new A11yLongTextToggle(button, options);
}
