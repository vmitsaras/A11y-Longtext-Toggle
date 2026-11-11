import { afterEach, describe, expect, it } from "vitest";
import { A11yLongTextToggle, createA11yLongTextToggle, EVENTS } from "../src/index.js";
import type {
  A11yLongTextToggleEventMap,
  A11yLongTextToggleOptions,
} from "../src/index.js";

const activeInstances: A11yLongTextToggle[] = [];

function setup(
  contentMarkup = "<p>Long product copy</p>",
  options: A11yLongTextToggleOptions = {},
) {
  let contentOverflows = true;
  document.body.innerHTML = `
    <div id="description">${contentMarkup}</div>
    <button type="button" data-target="description" data-collapsed-lines="2" data-show-more-text="">
      Show full description
    </button>
  `;
  const content = document.querySelector<HTMLElement>("#description")!;
  const button = document.querySelector<HTMLButtonElement>("button")!;
  const authoredButtonText = button.textContent;
  Object.defineProperty(content, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      height: content.classList.contains("a11y-long-text--collapsed") && contentOverflows ? 60 : 160,
    }),
  });
  const instance = createA11yLongTextToggle(button, options);
  activeInstances.push(instance as A11yLongTextToggle);
  return {
    button,
    content,
    instance,
    authoredButtonText,
    setContentOverflows: (value: boolean) => { contentOverflows = value; },
  };
}

afterEach(() => {
  for (const instance of activeInstances.splice(0)) instance.destroy();
  document.body.innerHTML = "";
});

describe("A11yLongTextToggle", () => {
  it("exports the class and creation function and initializes native markup", () => {
    const { button, content, instance } = setup();

    expect(instance).toBeInstanceOf(A11yLongTextToggle);
    expect(button.getAttribute("aria-controls")).toBe("description");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(content.classList.contains("a11y-long-text--collapsed")).toBe(true);
  });

  it("keeps a generated target ID through toggling and refresh and supports reinitialization", () => {
    document.body.innerHTML = `
      <div data-long-text="description"><p>Full product description</p></div>
      <button type="button" data-target="[data-long-text='description']">
        Show full product description
      </button>
    `;
    const content = document.querySelector<HTMLElement>("[data-long-text='description']")!;
    const button = document.querySelector<HTMLButtonElement>("button")!;
    const authoredTarget = button.dataset.target;
    Object.defineProperty(content, "getBoundingClientRect", {
      value: () => ({
        height: content.classList.contains("a11y-long-text--collapsed") ? 60 : 160,
      }),
    });
    expect(content.hasAttribute("id")).toBe(false);

    const instance = new A11yLongTextToggle(button);
    activeInstances.push(instance);
    const generatedId = content.id;

    expect(instance.content).toBe(content);
    expect(generatedId.trim()).not.toBe("");
    expect(button.getAttribute("aria-controls")).toBe(generatedId);
    expect(document.getElementById(generatedId)).toBe(content);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(button.hidden).toBe(false);

    button.focus();
    for (const expanded of [true, false]) {
      button.click();

      expect(instance.isExpanded()).toBe(expanded);
      expect(button.getAttribute("aria-expanded")).toBe(String(expanded));
      expect(content.id).toBe(generatedId);
      expect(button.getAttribute("aria-controls")).toBe(generatedId);
      expect(document.activeElement).toBe(button);

      instance.refresh();

      expect(instance.isExpanded()).toBe(expanded);
      expect(button.getAttribute("aria-expanded")).toBe(String(expanded));
      expect(content.id).toBe(generatedId);
      expect(button.getAttribute("aria-controls")).toBe(generatedId);
      expect(document.activeElement).toBe(button);
    }

    instance.destroy();

    expect(content.hasAttribute("id")).toBe(false);
    expect(button.hasAttribute("aria-controls")).toBe(false);
    expect(button.hasAttribute("aria-expanded")).toBe(false);
    expect(button.dataset.target).toBe(authoredTarget);

    const reinitialized = new A11yLongTextToggle(button);
    activeInstances.push(reinitialized);

    expect(reinitialized).not.toBe(instance);
    expect(reinitialized.content).toBe(content);
    expect(content.id.trim()).not.toBe("");
    expect(button.getAttribute("aria-controls")).toBe(content.id);
    expect(document.getElementById(content.id)).toBe(content);

    button.click();
    expect(reinitialized.isExpanded()).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(button);
  });

  it("generates distinct target IDs and preserves authored IDs selected through data attributes", () => {
    document.body.innerHTML = `
      <div data-long-text="description"><p>Full product description</p></div>
      <button type="button" data-target="[data-long-text='description']">Show full product description</button>
      <div data-long-text="care"><p>Full care instructions</p></div>
      <button type="button" data-target="[data-long-text='care']">Show full care instructions</button>
      <div id="authored-materials" data-long-text="materials"><p>Full materials details</p></div>
      <button type="button" data-target="[data-long-text='materials']">Show full materials details</button>
    `;
    const contents = Array.from(document.querySelectorAll<HTMLElement>("[data-long-text]"));
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>("button"));
    const instances = buttons.map((button) => {
      const instance = new A11yLongTextToggle(button);
      activeInstances.push(instance);
      return instance;
    });

    expect(new Set(contents.map((content) => content.id)).size).toBe(contents.length);
    contents.forEach((content, index) => {
      expect(content.id.trim()).not.toBe("");
      expect(instances[index].content).toBe(content);
      expect(buttons[index].getAttribute("aria-controls")).toBe(content.id);
      expect(document.getElementById(content.id)).toBe(content);
    });
    expect(contents[2].id).toBe("authored-materials");

    instances.forEach((instance) => instance.destroy());

    expect(contents[0].hasAttribute("id")).toBe(false);
    expect(contents[1].hasAttribute("id")).toBe(false);
    expect(contents[2].id).toBe("authored-materials");
  });

  it("restores authored ARIA attributes when destroying a target with a generated ID", () => {
    document.body.innerHTML = `
      <div id="authored-content"><p>Previously controlled content</p></div>
      <div data-long-text="description"><p>Full product description</p></div>
      <button type="button" data-target="[data-long-text='description']"
        aria-controls="authored-content" aria-expanded="true">Show full product description</button>
    `;
    const content = document.querySelector<HTMLElement>("[data-long-text='description']")!;
    const button = document.querySelector<HTMLButtonElement>("button")!;
    const instance = new A11yLongTextToggle(button, { autoHide: false });
    activeInstances.push(instance);

    expect(instance.content).toBe(content);
    expect(content.id.trim()).not.toBe("");
    expect(button.getAttribute("aria-controls")).toBe(content.id);
    expect(button.getAttribute("aria-expanded")).toBe("false");

    instance.destroy();

    expect(content.hasAttribute("id")).toBe(false);
    expect(button.getAttribute("aria-controls")).toBe("authored-content");
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("authored-content")).not.toBeNull();
  });

  it("reuses the existing instance and synchronizes state while focus stays on the button", () => {
    const { button, content, instance } = setup();
    const duplicate = new A11yLongTextToggle(button);
    button.focus();
    button.click();

    expect(duplicate).toBe(instance);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.textContent).toBe("Show less");
    expect(document.activeElement).toBe(button);
    expect(content.classList.contains("a11y-long-text--expanded")).toBe(true);
  });

  it("lets JavaScript options override data attributes and keeps button labels nonempty", () => {
    const { button, content } = setup("<p>Long product copy</p>", { collapsedLines: 5 });

    expect(content.style.getPropertyValue("--a11y-long-text-collapsed-lines")).toBe("5");
    expect(button.textContent).toBe("Show full description");
  });

  it("emits bubbling lifecycle events with the instance in detail", () => {
    const { button, content, instance } = setup();
    const onExpand = (event: Event) => {
      expect((event as CustomEvent).detail.instance).toBe(instance);
    };
    content.addEventListener("a11y-long-text:expand", onExpand, { once: true });
    button.click();

    expect(content.classList.contains("a11y-long-text--expanded")).toBe(true);
  });

  it("reports initialization, overflow, and destruction from the content region", () => {
    const observed: CustomEvent[] = [];
    const onEvent = (event: Event) => observed.push(event as CustomEvent);
    document.body.addEventListener(EVENTS.init, onEvent);
    const { content, instance, setContentOverflows } = setup();
    document.body.removeEventListener(EVENTS.init, onEvent);
    content.addEventListener(EVENTS.overflowChange, onEvent);
    content.addEventListener(EVENTS.destroy, onEvent);

    setContentOverflows(false);
    instance.refresh();
    instance.destroy();
    instance.expand();
    instance.collapse();
    instance.toggle();
    instance.refresh();
    instance.destroy();

    expect(observed.map((event) => event.type)).toEqual([
      EVENTS.init,
      EVENTS.overflowChange,
      EVENTS.destroy,
    ]);
    expect(observed.every((event) => event.bubbles && !event.composed && !event.cancelable)).toBe(true);
    expect(observed.map((event) => event.detail.instance)).toEqual([instance, instance, instance]);
    expect(observed[1].detail.overflowing).toBe(false);
  });

  it("exports frozen event names and emits state changes only when state changes", () => {
    const { content, instance } = setup();
    const eventTypes: string[] = [];
    const observed: Event[] = [];
    const onEvent = (event: Event) => {
      eventTypes.push(event.type);
      observed.push(event);
    };
    content.addEventListener(EVENTS.expand, onEvent);
    content.addEventListener(EVENTS.collapse, onEvent);
    content.addEventListener(EVENTS.toggle, onEvent);

    instance.expand();
    instance.expand();
    instance.collapse();
    instance.collapse();
    instance.toggle();

    expect(Object.isFrozen(EVENTS)).toBe(true);
    expect(eventTypes).toEqual([
      EVENTS.expand,
      EVENTS.collapse,
      EVENTS.expand,
      EVENTS.toggle,
    ]);
    expect(observed.every((event) => event.bubbles && !event.composed && !event.cancelable)).toBe(true);
    expect((observed[0] as CustomEvent).detail.instance).toBe(instance);

    const eventMap: A11yLongTextToggleEventMap | null = null;
    expect(eventMap).toBeNull();
  });

  it("stops refresh after an overflow listener destroys the instance", () => {
    const { button, content, instance, authoredButtonText, setContentOverflows } = setup();
    content.addEventListener(EVENTS.overflowChange, () => instance.destroy(), { once: true });
    setContentOverflows(false);

    instance.refresh();

    expect(button.textContent).toBe(authoredButtonText);
    expect(button.hasAttribute("aria-expanded")).toBe(false);
    expect(content.classList.contains("a11y-long-text")).toBe(false);
  });

  it("leaves rich text with focusable descendants expanded and hides its toggle", () => {
    const { button, content } = setup('<p>Read the <a href="/materials">materials guide</a>.</p>');

    expect(button.hidden).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(content.classList.contains("a11y-long-text--collapsed")).toBe(false);
  });

  it("uses the authored split region to hide interactive rich text without clipping it", () => {
    const { button, content, instance } = setup(
      '<p>Always-visible preview.</p><div data-a11y-long-text-more><p>More detail with a <a href="/materials">materials link</a>.</p></div>',
      { mode: "split", fade: true },
    );
    const splitContent = content.querySelector<HTMLElement>("[data-a11y-long-text-more]")!;
    const link = splitContent.querySelector("a")!;

    expect(splitContent.hidden).toBe(true);
    expect(button.hidden).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(content.dataset.a11yLongTextMode).toBe("split");
    expect(content.classList.contains("a11y-long-text--collapsed")).toBe(true);
    expect(content.classList.contains("a11y-long-text__fade")).toBe(false);

    button.focus();
    button.click();

    expect(splitContent.hidden).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(instance.isExpanded()).toBe(true);
    expect(document.activeElement).toBe(button);
    expect(link.closest("[hidden]")).toBeNull();

    button.click();
    expect(splitContent.hidden).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button);

    instance.expand();
    link.focus();
    instance.collapse();
    expect(splitContent.hidden).toBe(true);
    expect(document.activeElement).toBe(button);
  });

  it("auto-hides the split toggle when its marked remainder is empty", () => {
    const { button } = setup('<p>Preview only.</p><div data-a11y-long-text-more>  </div>', { mode: "split" });

    expect(button.hidden).toBe(true);
  });

  it("requires a split region before changing authored markup", () => {
    document.body.innerHTML = '<div id="description"><p>Content</p></div><button data-target="description">Show content</button>';
    const content = document.querySelector<HTMLElement>("#description")!;
    const button = document.querySelector<HTMLButtonElement>("button")!;

    expect(() => new A11yLongTextToggle(button, { mode: "split" })).toThrow(/data-a11y-long-text-more/);
    expect(content.classList.contains("a11y-long-text")).toBe(false);
    expect(button.hasAttribute("aria-controls")).toBe(false);
    expect(button.hasAttribute("aria-expanded")).toBe(false);
  });

  it("rejects ambiguous split markup before changing authored markup", () => {
    document.body.innerHTML = '<div id="description"><div data-a11y-long-text-more>One</div><div data-a11y-long-text-more>Two</div></div><button data-target="description">Show content</button>';
    const content = document.querySelector<HTMLElement>("#description")!;
    const button = document.querySelector<HTMLButtonElement>("button")!;

    expect(() => new A11yLongTextToggle(button, { mode: "split" })).toThrow(/exactly one/);
    expect(content.classList.contains("a11y-long-text")).toBe(false);
    expect(button.hasAttribute("aria-controls")).toBe(false);
  });

  it("rejects a split toggle placed inside the region it would hide", () => {
    document.body.innerHTML = '<div id="description"><p>Preview.</p><div data-a11y-long-text-more><p>Remainder.</p><button data-target="description">Show content</button></div></div>';
    const content = document.querySelector<HTMLElement>("#description")!;
    const button = document.querySelector<HTMLButtonElement>("button")!;

    expect(() => new A11yLongTextToggle(button, { mode: "split" })).toThrow(/toggle button to be outside/);
    expect(content.classList.contains("a11y-long-text")).toBe(false);
    expect(button.hasAttribute("aria-controls")).toBe(false);
  });

  it("restores the split region authored state on destroy", () => {
    const { content, instance } = setup(
      '<p>Preview.</p><div data-a11y-long-text-more><p>Remainder.</p></div>',
      { mode: "split" },
    );
    const splitContent = content.querySelector<HTMLElement>("[data-a11y-long-text-more]")!;

    instance.destroy();

    expect(splitContent.hidden).toBe(false);
    expect(content.hasAttribute("data-a11y-long-text-mode")).toBe(false);
  });

  it("restores authored state and removes the click listener on destroy", () => {
    const { button, content, instance, authoredButtonText } = setup();
    instance.destroy();
    button.click();

    expect(button.textContent).toBe(authoredButtonText);
    expect(button.hasAttribute("aria-expanded")).toBe(false);
    expect(content.classList.contains("a11y-long-text")).toBe(false);
  });
});
