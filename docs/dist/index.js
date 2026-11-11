//#region src/a11y-long-text-toggle.js
const DEFAULT_OPTIONS = Object.freeze({
	mode: "lines",
	collapsedLines: 3,
	collapsedItems: 3,
	collapsedHeight: "8rem",
	autoHide: true,
	showLessText: "Show less",
	fade: false,
	allowInteractiveContent: false
});
const SELECTORS = Object.freeze({ focusable: [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])",
	"summary",
	"audio[controls]",
	"video[controls]",
	"iframe",
	"object",
	"embed",
	"[contenteditable]:not([contenteditable=\"false\"])"
].join(",") });
const CLASSES = Object.freeze({
	content: "a11y-long-text",
	collapsed: "a11y-long-text--collapsed",
	expanded: "a11y-long-text--expanded",
	overflow: "a11y-long-text--overflow",
	fade: "a11y-long-text__fade",
	collapsedItem: "a11y-long-text__item--collapsed"
});
const ATTRIBUTES = Object.freeze({
	controls: "aria-controls",
	expanded: "aria-expanded"
});
const CSS_PROPERTIES = Object.freeze({
	collapsedLines: "--a11y-long-text-collapsed-lines",
	collapsedHeight: "--a11y-long-text-collapsed-height"
});
const OVERFLOW_TOLERANCE_PX = 1;
const CONTENT_CLASS = CLASSES.content;
const COLLAPSED_CLASS = CLASSES.collapsed;
const EXPANDED_CLASS = CLASSES.expanded;
const OVERFLOW_CLASS = CLASSES.overflow;
const FADE_CLASS = CLASSES.fade;
const COLLAPSED_ITEM_CLASS = CLASSES.collapsedItem;
const COLLAPSED_LINES_PROPERTY = CSS_PROPERTIES.collapsedLines;
const COLLAPSED_HEIGHT_PROPERTY = CSS_PROPERTIES.collapsedHeight;
const FOCUSABLE_SELECTOR = SELECTORS.focusable;
const EVENTS = Object.freeze({
	init: "a11y-long-text:init",
	expand: "a11y-long-text:expand",
	collapse: "a11y-long-text:collapse",
	toggle: "a11y-long-text:toggle",
	overflowChange: "a11y-long-text:overflow-change",
	destroy: "a11y-long-text:destroy"
});
var A11yLongTextToggle = class A11yLongTextToggle {
	static instances = /* @__PURE__ */ new WeakMap();
	constructor(button, options = {}) {
		if (!(button instanceof HTMLButtonElement)) throw new TypeError("A11yLongTextToggle requires a native <button>.");
		const existingInstance = A11yLongTextToggle.instances.get(button);
		if (existingInstance) return existingInstance;
		this.button = button;
		this.options = { ...options };
		this.content = this._resolveTarget(this.options.target);
		if (!this.content) throw new Error("A11yLongTextToggle target content was not found.");
		this.mode = this._normalizeMode(this._readOption("mode", DEFAULT_OPTIONS.mode));
		const splitRegions = this.mode === "split" ? this.content.querySelectorAll("[data-a11y-long-text-more]") : [];
		this.splitContent = splitRegions[0] || null;
		if (this.mode === "split" && splitRegions.length !== 1) throw new Error("A11yLongTextToggle split mode requires exactly one [data-a11y-long-text-more] region inside the target content.");
		if (this.mode === "split" && this.splitContent.contains(this.button)) throw new Error("A11yLongTextToggle split mode requires its toggle button to be outside the [data-a11y-long-text-more] region.");
		this.responsive = this._readResponsiveOption();
		this._mediaQuery = this.responsive?.mediaQuery && typeof window.matchMedia === "function" ? window.matchMedia(this.responsive.mediaQuery) : null;
		this._responsiveActive = !this.responsive;
		this._responsiveFocusExpanded = false;
		this._destroyed = false;
		this._isExpanded = false;
		this._isOverflowing = false;
		this._hasDisallowedInteractiveContent = false;
		this._observer = null;
		this._refreshFrame = null;
		this._onClick = () => this.toggle();
		this._onResponsiveChange = () => this._scheduleRefresh();
		this._onResponsiveFocusOut = () => this._scheduleRefresh();
		this._initialButtonText = this.button.textContent;
		this._initialButtonHidden = this.button.hidden;
		this._initialButtonType = this.button.getAttribute("type");
		this._initialAriaControls = this.button.getAttribute(ATTRIBUTES.controls);
		this._initialAriaExpanded = this.button.getAttribute(ATTRIBUTES.expanded);
		this._initialContentMode = this.content.dataset.a11yLongTextMode;
		this._initialSplitContentHidden = this.splitContent?.hidden;
		this._initialCollapsedLines = this.content.style.getPropertyValue(COLLAPSED_LINES_PROPERTY);
		this._initialCollapsedHeight = this.content.style.getPropertyValue(COLLAPSED_HEIGHT_PROPERTY);
		this._initialContentClasses = /* @__PURE__ */ new Map([
			[CONTENT_CLASS, this.content.classList.contains(CONTENT_CLASS)],
			[COLLAPSED_CLASS, this.content.classList.contains(COLLAPSED_CLASS)],
			[EXPANDED_CLASS, this.content.classList.contains(EXPANDED_CLASS)],
			[OVERFLOW_CLASS, this.content.classList.contains(OVERFLOW_CLASS)],
			[FADE_CLASS, this.content.classList.contains(FADE_CLASS)]
		]);
		this._initialListItemClasses = /* @__PURE__ */ new Map();
		this._generatedContentId = !this.content.id;
		if (this._generatedContentId) this.content.id = `a11y-long-text-${this._createUniqueId()}`;
		this.collapsedLines = this._readPositiveNumberOption("collapsedLines", DEFAULT_OPTIONS.collapsedLines);
		this.collapsedItems = this._readPositiveNumberOption("collapsedItems", DEFAULT_OPTIONS.collapsedItems);
		this.collapsedHeight = this._readOption("collapsedHeight", DEFAULT_OPTIONS.collapsedHeight);
		this.autoHide = this._readBooleanOption("autoHide", DEFAULT_OPTIONS.autoHide);
		this.showMoreText = this._readStringOption("showMoreText", this.button.textContent?.trim() || "Show full content");
		this.showLessText = this._readStringOption("showLessText", DEFAULT_OPTIONS.showLessText);
		this.useFade = this._readBooleanOption("fade", DEFAULT_OPTIONS.fade);
		this.allowInteractiveContent = this._readBooleanOption("allowInteractiveContent", DEFAULT_OPTIONS.allowInteractiveContent);
		if (!this.button.hasAttribute("type")) this.button.type = "button";
		this.button.setAttribute(ATTRIBUTES.controls, this.content.id);
		this.button.addEventListener("click", this._onClick);
		this._mediaQuery?.addEventListener("change", this._onResponsiveChange);
		if (this.responsive) {
			this.button.addEventListener("focusout", this._onResponsiveFocusOut);
			this.content.addEventListener("focusout", this._onResponsiveFocusOut);
		}
		this.content.classList.add(CONTENT_CLASS);
		this.content.style.setProperty(COLLAPSED_LINES_PROPERTY, String(this.collapsedLines));
		this.content.style.setProperty(COLLAPSED_HEIGHT_PROPERTY, String(this.collapsedHeight));
		if (this.useFade && !["split", "items"].includes(this.mode)) this.content.classList.add(FADE_CLASS);
		this._hasDisallowedInteractiveContent = this.mode !== "split" && this._detectDisallowedInteractiveContent();
		if (typeof ResizeObserver !== "undefined") {
			this._observer = new ResizeObserver(() => {
				this._scheduleRefresh();
			});
			this._observer.observe(this.content);
			if (this.responsive?.container) this._observer.observe(this.responsive.container);
		}
		if (!this.responsive) this.collapse({
			silent: true,
			keepFocus: false
		});
		this.refresh({ silent: true });
		A11yLongTextToggle.instances.set(button, this);
		this._emit(EVENTS.init, { instance: this });
	}
	_emit(type, detail) {
		this.content.dispatchEvent(new CustomEvent(type, {
			bubbles: true,
			composed: false,
			cancelable: false,
			detail
		}));
	}
	_restoreStyleProperty(propertyName, value) {
		if (value) this.content.style.setProperty(propertyName, value);
		else this.content.style.removeProperty(propertyName);
	}
	_datasetValue(key) {
		return this.button.dataset[key];
	}
	_readOption(key, fallback) {
		if (this.options[key] !== void 0) return this.options[key];
		const datasetValue = this._datasetValue(key);
		return datasetValue !== void 0 ? datasetValue : fallback;
	}
	_readPositiveNumberOption(key, fallback) {
		const value = Number(this._readOption(key, fallback));
		return Number.isInteger(value) && value > 0 ? value : fallback;
	}
	_readStringOption(key, fallback) {
		const value = this._readOption(key, fallback);
		return typeof value === "string" && value.trim() ? value.trim() : fallback;
	}
	_readBooleanOption(key, fallback) {
		const raw = this._readOption(key, fallback);
		if (typeof raw === "boolean") return raw;
		if (typeof raw === "string") {
			const normalized = raw.trim().toLowerCase();
			if ([
				"false",
				"0",
				"no",
				"off"
			].includes(normalized)) return false;
			if ([
				"true",
				"1",
				"yes",
				"on"
			].includes(normalized)) return true;
			return fallback;
		}
		return typeof raw === "boolean" ? raw : fallback;
	}
	_readResponsiveOption() {
		let responsive = this.options.responsive;
		if (responsive === void 0) {
			const { mediaQuery, container, containerMaxWidth } = this.button.dataset;
			if (mediaQuery === void 0 && container === void 0 && containerMaxWidth === void 0) return null;
			responsive = mediaQuery !== void 0 ? {
				mediaQuery,
				...container !== void 0 || containerMaxWidth !== void 0 ? {
					container,
					maxWidth: containerMaxWidth
				} : {}
			} : {
				container,
				maxWidth: containerMaxWidth
			};
		}
		if (responsive === null) return null;
		if (typeof responsive !== "object" || Array.isArray(responsive)) throw new TypeError("A11yLongTextToggle responsive must be a mediaQuery or container configuration, or null.");
		if ("mediaQuery" in responsive) {
			if ("container" in responsive || "maxWidth" in responsive || typeof responsive.mediaQuery !== "string" || !responsive.mediaQuery.trim()) throw new TypeError("A11yLongTextToggle responsive.mediaQuery requires a nonempty query and cannot be combined with a container.");
			return { mediaQuery: responsive.mediaQuery.trim() };
		}
		const container = typeof responsive.container === "string" ? this._querySelector(responsive.container) : responsive.container;
		const maxWidth = typeof responsive.maxWidth === "number" || typeof responsive.maxWidth === "string" ? Number(responsive.maxWidth) : NaN;
		if (!(container instanceof HTMLElement) || container === this.content || !container.contains(this.content) || !Number.isFinite(maxWidth) || maxWidth <= 0) throw new TypeError("A11yLongTextToggle responsive requires an ancestor container and a finite positive maxWidth in CSS pixels.");
		return {
			container,
			maxWidth
		};
	}
	_matchesResponsiveCondition() {
		if (!this.responsive) return true;
		if (this.responsive.mediaQuery) return Boolean(this._mediaQuery?.matches);
		const { container, maxWidth } = this.responsive;
		if (container.clientWidth <= 0) return false;
		const style = getComputedStyle(container);
		const padding = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
		const borders = (parseFloat(style.borderLeftWidth) || 0) + (parseFloat(style.borderRightWidth) || 0);
		const clientContentWidth = container.clientWidth - padding;
		let width = clientContentWidth;
		if (style.width.endsWith("px")) {
			const resolvedWidth = parseFloat(style.width) - (style.boxSizing === "border-box" ? padding + borders : 0);
			width = resolvedWidth - Math.max(0, Math.round(resolvedWidth - clientContentWidth));
		}
		return width > 0 && width <= maxWidth;
	}
	_syncResponsiveState() {
		let active = this._matchesResponsiveCondition();
		const focused = document.activeElement;
		if (!active && this._responsiveActive && focused === this.button) active = true;
		this._responsiveActive = active;
		this._responsiveFocusExpanded = Boolean(this.responsive && active && !this._isExpanded && focused !== this.button && this.content.contains(focused));
	}
	_isResponsiveExpanded() {
		return !this._responsiveActive || this._responsiveFocusExpanded;
	}
	_normalizeMode(mode) {
		return [
			"height",
			"items",
			"split"
		].includes(mode) ? mode : "lines";
	}
	_resolveTarget(explicitTarget) {
		if (explicitTarget instanceof HTMLElement) return explicitTarget;
		const target = explicitTarget || this.button.dataset.target || this.button.getAttribute("aria-controls");
		if (!target || typeof target !== "string") return null;
		const trimmedTarget = target.trim();
		if (!trimmedTarget) return null;
		return document.getElementById(trimmedTarget) || this._querySelector(trimmedTarget);
	}
	_querySelector(selector) {
		try {
			return document.querySelector(selector);
		} catch {
			return null;
		}
	}
	_createUniqueId() {
		if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
		return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	}
	_scheduleRefresh() {
		if (this._destroyed || this._refreshFrame !== null) return;
		this._refreshFrame = requestAnimationFrame(() => {
			this._refreshFrame = null;
			this.refresh();
		});
	}
	_applyModeClass() {
		this.content.dataset.a11yLongTextMode = this.mode;
	}
	_applyStateClasses() {
		this._applyModeClass();
		if (this._isResponsiveExpanded()) {
			this.content.classList.remove(COLLAPSED_CLASS);
			this.content.classList.add(EXPANDED_CLASS);
			if (this.splitContent) this.splitContent.hidden = false;
			this._applyListItemVisibility(false);
			return;
		}
		if (this.mode === "split") {
			this.splitContent.hidden = !this._isExpanded;
			this.content.classList.remove(FADE_CLASS);
			this.content.classList.toggle(COLLAPSED_CLASS, !this._isExpanded);
			this.content.classList.toggle(EXPANDED_CLASS, this._isExpanded);
			return;
		}
		if (this.mode === "items") this.content.classList.remove(FADE_CLASS);
		if (this._hasDisallowedInteractiveContent) {
			this.content.classList.remove(COLLAPSED_CLASS);
			this.content.classList.add(EXPANDED_CLASS);
			this._applyListItemVisibility(false);
			return;
		}
		if (this.autoHide && !this._isOverflowing) {
			this.content.classList.remove(COLLAPSED_CLASS, EXPANDED_CLASS);
			this._applyListItemVisibility(false);
			return;
		}
		if (this._isExpanded) {
			this.content.classList.remove(COLLAPSED_CLASS);
			this.content.classList.add(EXPANDED_CLASS);
			this._applyListItemVisibility(false);
			return;
		}
		this.content.classList.add(COLLAPSED_CLASS);
		this.content.classList.remove(EXPANDED_CLASS);
		this._applyListItemVisibility(this.mode === "items");
	}
	_updateButtonState() {
		const fullContentIsVisible = this._isExpanded || this._hasDisallowedInteractiveContent || this._isResponsiveExpanded() || this.autoHide && !this._isOverflowing;
		this.button.setAttribute(ATTRIBUTES.expanded, String(fullContentIsVisible));
		this.button.textContent = fullContentIsVisible ? this.showLessText : this.showMoreText;
	}
	_updateButtonVisibility() {
		const hidden = !this._responsiveActive || this._hasDisallowedInteractiveContent || this.autoHide && !this._isOverflowing;
		this.button.hidden = hidden && !(this.responsive && document.activeElement === this.button && !this.button.hidden);
	}
	_detectDisallowedInteractiveContent() {
		if (this.allowInteractiveContent || this.mode === "split") return false;
		return this.content.querySelector(FOCUSABLE_SELECTOR) !== null;
	}
	_getListItemsByList() {
		const lists = [];
		if (this.content.matches("ol, ul")) lists.push(this.content);
		lists.push(...this.content.querySelectorAll("ol, ul"));
		return lists.map((list) => Array.from(list.children).filter((child) => child.tagName === "LI"));
	}
	_getCollapsibleItems() {
		if (this.mode !== "items") return [];
		return this._getListItemsByList().flatMap((items) => items.slice(this.collapsedItems));
	}
	_applyListItemVisibility(collapsed) {
		if (this.mode !== "items") return;
		const listItemsByList = this._getListItemsByList();
		const currentItems = new Set(listItemsByList.flat());
		for (const [item, wasPresent] of this._initialListItemClasses) if (!currentItems.has(item)) {
			item.classList.toggle(COLLAPSED_ITEM_CLASS, wasPresent);
			this._initialListItemClasses.delete(item);
		}
		for (const items of listItemsByList) items.forEach((item, index) => {
			if (!this._initialListItemClasses.has(item)) this._initialListItemClasses.set(item, item.classList.contains(COLLAPSED_ITEM_CLASS));
			item.classList.toggle(COLLAPSED_ITEM_CLASS, collapsed && index >= this.collapsedItems);
		});
	}
	_measureOverflow() {
		if (this.mode === "split") return Boolean(this.splitContent.textContent?.trim() || this.splitContent.children.length);
		if (this.mode === "items") return this._getListItemsByList().some((items) => items.length > this.collapsedItems);
		const hadCollapsedClass = this.content.classList.contains(COLLAPSED_CLASS);
		const hadExpandedClass = this.content.classList.contains(EXPANDED_CLASS);
		this.content.classList.add(COLLAPSED_CLASS);
		this.content.classList.remove(EXPANDED_CLASS);
		const collapsedHeight = this.content.getBoundingClientRect().height;
		this.content.classList.remove(COLLAPSED_CLASS);
		this.content.classList.add(EXPANDED_CLASS);
		const expandedHeight = this.content.getBoundingClientRect().height;
		this.content.classList.toggle(COLLAPSED_CLASS, hadCollapsedClass);
		this.content.classList.toggle(EXPANDED_CLASS, hadExpandedClass);
		return expandedHeight > collapsedHeight + OVERFLOW_TOLERANCE_PX;
	}
	_updateOverflowState(nextOverflow, { silent = false } = {}) {
		const changed = this._isOverflowing !== nextOverflow;
		this._isOverflowing = nextOverflow;
		this.content.classList.toggle(OVERFLOW_CLASS, nextOverflow);
		this._updateButtonVisibility();
		if (changed && !silent) this._emit(EVENTS.overflowChange, {
			instance: this,
			overflowing: nextOverflow
		});
	}
	_focusButton(keepFocus) {
		if (!keepFocus || document.activeElement !== this.button) return;
		if (typeof this.button.focus === "function") this.button.focus({ preventScroll: true });
	}
	isExpanded() {
		return this._isExpanded;
	}
	expand({ silent = false, keepFocus = true } = {}) {
		if (this._destroyed) return;
		const changed = !this._isExpanded;
		this._isExpanded = true;
		this._responsiveFocusExpanded = false;
		this._applyStateClasses();
		this._updateButtonState();
		this._focusButton(keepFocus);
		if (changed && !silent) this._emit(EVENTS.expand, { instance: this });
	}
	collapse({ silent = false, keepFocus = true } = {}) {
		if (this._destroyed) return;
		this._hasDisallowedInteractiveContent = this.mode !== "split" && this._detectDisallowedInteractiveContent();
		if (this._hasDisallowedInteractiveContent) {
			this._applyStateClasses();
			this._updateButtonState();
			return;
		}
		const activeElement = document.activeElement;
		const focusIsInCollapsingItem = this.mode === "items" && this._getCollapsibleItems().some((item) => item.contains(activeElement));
		if (this._responsiveActive && (this.mode === "split" && this.splitContent.contains(activeElement) || focusIsInCollapsingItem)) this.button.focus({ preventScroll: true });
		const changed = this._isExpanded;
		this._isExpanded = false;
		this._responsiveFocusExpanded = false;
		this._applyStateClasses();
		this._updateButtonState();
		this._focusButton(keepFocus);
		if (changed && !silent) this._emit(EVENTS.collapse, { instance: this });
	}
	toggle({ silent = false } = {}) {
		if (this._destroyed) return;
		this._hasDisallowedInteractiveContent = this.mode !== "split" && this._detectDisallowedInteractiveContent();
		if (this._hasDisallowedInteractiveContent) {
			this._applyStateClasses();
			this._updateButtonState();
			return;
		}
		if (this._isExpanded) this.collapse({
			silent,
			keepFocus: true
		});
		else this.expand({
			silent,
			keepFocus: true
		});
		if (!this._destroyed && !silent) this._emit(EVENTS.toggle, { instance: this });
	}
	refresh({ silent = false } = {}) {
		if (this._destroyed) return;
		this._applyModeClass();
		this._syncResponsiveState();
		this._hasDisallowedInteractiveContent = this._detectDisallowedInteractiveContent();
		const overflowing = !this._responsiveActive || this._hasDisallowedInteractiveContent ? false : this._measureOverflow();
		this._updateOverflowState(overflowing, { silent });
		if (this._destroyed) return;
		if (this.mode === "items" && !this._isResponsiveExpanded() && !this._isExpanded && !this._hasDisallowedInteractiveContent && (!this.autoHide || overflowing) && this._getCollapsibleItems().some((item) => item.contains(document.activeElement))) this.button.focus({ preventScroll: true });
		this._applyStateClasses();
		this._updateButtonState();
	}
	destroy() {
		if (this._destroyed) return;
		this._destroyed = true;
		this.button.removeEventListener("click", this._onClick);
		this._mediaQuery?.removeEventListener("change", this._onResponsiveChange);
		this.button.removeEventListener("focusout", this._onResponsiveFocusOut);
		this.content.removeEventListener("focusout", this._onResponsiveFocusOut);
		if (this._observer) {
			this._observer.disconnect();
			this._observer = null;
		}
		if (this._refreshFrame !== null) {
			cancelAnimationFrame(this._refreshFrame);
			this._refreshFrame = null;
		}
		this.button.hidden = this._initialButtonHidden;
		this.button.textContent = this._initialButtonText;
		if (this._initialButtonType === null) this.button.removeAttribute("type");
		else this.button.setAttribute("type", this._initialButtonType);
		if (this._initialAriaExpanded === null) this.button.removeAttribute(ATTRIBUTES.expanded);
		else this.button.setAttribute(ATTRIBUTES.expanded, this._initialAriaExpanded);
		if (this._initialAriaControls === null) this.button.removeAttribute(ATTRIBUTES.controls);
		else this.button.setAttribute(ATTRIBUTES.controls, this._initialAriaControls);
		for (const [className, wasPresent] of this._initialContentClasses) this.content.classList.toggle(className, wasPresent);
		for (const [item, wasPresent] of this._initialListItemClasses) item.classList.toggle(COLLAPSED_ITEM_CLASS, wasPresent);
		this._initialListItemClasses.clear();
		if (this._initialContentMode === void 0) delete this.content.dataset.a11yLongTextMode;
		else this.content.dataset.a11yLongTextMode = this._initialContentMode;
		this._restoreStyleProperty(COLLAPSED_LINES_PROPERTY, this._initialCollapsedLines);
		this._restoreStyleProperty(COLLAPSED_HEIGHT_PROPERTY, this._initialCollapsedHeight);
		if (this._generatedContentId) this.content.removeAttribute("id");
		if (this.splitContent) this.splitContent.hidden = this._initialSplitContentHidden;
		A11yLongTextToggle.instances.delete(this.button);
		this._emit(EVENTS.destroy, { instance: this });
	}
};
//#endregion
//#region src/index.ts
function createA11yLongTextToggle(button, options = {}) {
	return new A11yLongTextToggle(button, options);
}
//#endregion
export { A11yLongTextToggle, EVENTS, createA11yLongTextToggle };

//# sourceMappingURL=index.js.map