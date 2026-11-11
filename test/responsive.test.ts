import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { A11yLongTextToggle, EVENTS } from "../src/index.js";
import type { A11yLongTextToggleOptions } from "../src/index.js";

const instances: A11yLongTextToggle[] = [];
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
let nextFixture = 0;

function mediaQuery(initialMatches = true) {
  const list = Object.assign(new EventTarget(), {
    matches: initialMatches,
    media: "(width < 48rem)",
    onchange: null,
  });
  const add = vi.spyOn(list, "addEventListener");
  const remove = vi.spyOn(list, "removeEventListener");
  vi.stubGlobal("matchMedia", vi.fn(() => list));
  return {
    list,
    add,
    remove,
    setMatches(matches: boolean) {
      if (matches === list.matches) return;
      list.matches = matches;
      const event = Object.assign(new Event("change"), { matches, media: list.media });
      list.dispatchEvent(event);
    },
  };
}

class TestResizeObserver {
  static all = new Set<TestResizeObserver>();
  readonly targets = new Set<Element>();
  constructor(readonly callback: ResizeObserverCallback) {
    TestResizeObserver.all.add(this);
  }
  observe = vi.fn((target: Element) => this.targets.add(target));
  unobserve = vi.fn((target: Element) => this.targets.delete(target));
  disconnect = vi.fn(() => this.targets.clear());
  static notify(target: Element, contentWidth = 500) {
    const entry = {
      target,
      contentRect: { ...target.getBoundingClientRect(), width: contentWidth },
      contentBoxSize: [{ inlineSize: contentWidth, blockSize: 160 }],
      borderBoxSize: [{ inlineSize: contentWidth, blockSize: 160 }],
      devicePixelContentBoxSize: [],
    } as unknown as ResizeObserverEntry;
    for (const observer of TestResizeObserver.all) {
      if (observer.targets.has(target)) observer.callback([entry], observer as unknown as ResizeObserver);
    }
  }
}

function fixture(markup = "<p>Long product description.</p>") {
  const id = `responsive-description-${++nextFixture}`;
  const host = document.createElement("section");
  host.innerHTML = `
    <div id="${id}-wrapper">
      <div id="${id}">${markup}</div>
      <button type="button" data-target="${id}">Show full description</button>
    </div>
    <button type="button" data-outside>Continue reading</button>
  `;
  document.body.append(host);
  const wrapper = host.firstElementChild as HTMLElement;
  const content = document.getElementById(id)!;
  const button = wrapper.querySelector("button")!;
  const outside = host.querySelector<HTMLButtonElement>("[data-outside]")!;
  let width = 500;
  let overflowing = true;
  const horizontalPadding = () => parseFloat(wrapper.style.paddingLeft || "0")
    + parseFloat(wrapper.style.paddingRight || "0");
  Object.defineProperty(wrapper, "clientWidth", {
    configurable: true,
    get: () => width + horizontalPadding(),
  });
  Object.defineProperty(wrapper, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ width: width + horizontalPadding() + 4, height: 200 }),
  });
  Object.defineProperty(content, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      width,
      height: overflowing && content.classList.contains("a11y-long-text--collapsed") ? 60 : 160,
    }),
  });
  return {
    host, wrapper, content, button, outside,
    setWidth(value: number) { width = value; },
    setOverflow(value: boolean) { overflowing = value; },
    start(options: A11yLongTextToggleOptions = {}) {
      const instance = new A11yLongTextToggle(button, options);
      instances.push(instance);
      return instance;
    },
  };
}

async function settle() {
  await Promise.resolve();
  for (let round = 0; frames.size && round < 10; round += 1) {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback(performance.now());
    await Promise.resolve();
  }
  expect(frames.size, "responsive work must settle rather than schedule endlessly").toBe(0);
}

function expectFull(content: HTMLElement) {
  expect(content.classList.contains("a11y-long-text--collapsed")).toBe(false);
  expect(content.querySelector("[data-a11y-long-text-more][hidden]")).toBeNull();
  expect(content.querySelector(".a11y-long-text__item--collapsed")).toBeNull();
}

beforeEach(() => {
  frames.clear();
  TestResizeObserver.all.clear();
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
});

afterEach(() => {
  for (const instance of instances.splice(0)) instance.destroy();
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("responsive activation", () => {
  it("shows full desktop text while retaining the initial collapsed preference", () => {
    mediaQuery(false);
    const { content, button, start } = fixture();
    const instance = start({ mode: "height", collapsedHeight: "400px", responsive: { mediaQuery: "(width < 48rem)" } });

    expectFull(content);
    expect(button.hidden).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(instance.isExpanded()).toBe(false);
  });

  it("initializes a matching viewport collapsed and keeps native click focus", () => {
    mediaQuery(true);
    const { content, button, start } = fixture();
    const instance = start({ responsive: { mediaQuery: "(width < 48rem)" } });
    expect(button.hidden).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(content.classList.contains("a11y-long-text--collapsed")).toBe(true);
    button.focus();
    button.click();
    expect(document.activeElement).toBe(button);
    expect(instance.isExpanded()).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("preserves both expanded and collapsed choices through repeated crossings", async () => {
    const media = mediaQuery(true);
    const { content, button, start } = fixture();
    const instance = start({ responsive: { mediaQuery: "(width < 48rem)" } });
    instance.expand();
    media.setMatches(false);
    await settle();
    expect(button.hidden).toBe(true);
    expect(instance.isExpanded()).toBe(true);
    media.setMatches(true);
    await settle();
    expectFull(content);
    expect(button.hidden).toBe(false);
    instance.collapse();
    media.setMatches(false);
    await settle();
    expectFull(content);
    expect(instance.isExpanded()).toBe(false);
    media.setMatches(true);
    await settle();
    expect(content.classList.contains("a11y-long-text--collapsed")).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("accepts explicit state changes while inactive without hiding content or moving focus", async () => {
    const media = mediaQuery(false);
    const { content, button, outside, start } = fixture();
    const instance = start({ responsive: { mediaQuery: "(width < 48rem)" } });
    const changes: string[] = [];
    for (const event of [EVENTS.expand, EVENTS.collapse, EVENTS.toggle]) {
      content.addEventListener(event, () => changes.push(event));
    }
    outside.focus();
    instance.expand();
    instance.collapse();
    instance.toggle();
    expect(instance.isExpanded()).toBe(true);
    expectFull(content);
    expect(button.hidden).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(outside);
    expect(changes).toEqual([EVENTS.expand, EVENTS.collapse, EVENTS.expand, EVENTS.toggle]);
    media.setMatches(true);
    await settle();
    expectFull(content);
    expect(changes).toHaveLength(4);
  });

  it("does not emit user state-change events for automatic responsive changes", async () => {
    const media = mediaQuery(false);
    const { content, start } = fixture();
    start({ responsive: { mediaQuery: "(width < 48rem)" } });
    const onState = vi.fn();
    for (const event of [EVENTS.expand, EVENTS.collapse, EVENTS.toggle]) content.addEventListener(event, onState);
    media.setMatches(true);
    await settle();
    media.setMatches(false);
    await settle();
    expect(onState).not.toHaveBeenCalled();
  });

  it("keeps short content open and only shows a toggle when overflow develops", async () => {
    mediaQuery(true);
    const page = fixture();
    page.setOverflow(false);
    page.start({ responsive: { mediaQuery: "(width < 48rem)" } });
    expectFull(page.content);
    expect(page.button.hidden).toBe(true);
    page.setOverflow(true);
    TestResizeObserver.notify(page.content);
    await settle();
    expect(page.button.hidden).toBe(false);
    expect(page.content.classList.contains("a11y-long-text--collapsed")).toBe(true);
  });

  it("hides outside the condition even with autoHide disabled, and reveals on activation", async () => {
    const media = mediaQuery(false);
    const { button, content, start } = fixture();
    start({ autoHide: false, responsive: { mediaQuery: "(width < 48rem)" } });
    expect(button.hidden).toBe(true);
    expectFull(content);
    media.setMatches(true);
    await settle();
    expect(button.hidden).toBe(false);
    expect(content.classList.contains("a11y-long-text--collapsed")).toBe(true);
  });

  it("retains the interactive-content safeguard in a matching viewport", async () => {
    const media = mediaQuery(false);
    const { button, content, start } = fixture('<p>Read the <a href="#materials">materials guide</a>.</p>');
    start({ responsive: { mediaQuery: "(width < 48rem)" } });
    media.setMatches(true);
    await settle();
    expectFull(content);
    expect(button.hidden).toBe(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("reveals and restores the authored split remainder across widths", async () => {
    const media = mediaQuery(true);
    const { content, start } = fixture('<p>Preview.</p><div data-a11y-long-text-more><a href="#details">More details</a></div>');
    const more = content.querySelector<HTMLElement>("[data-a11y-long-text-more]")!;
    const instance = start({ mode: "split", responsive: { mediaQuery: "(width < 48rem)" } });
    expect(more.hidden).toBe(true);
    media.setMatches(false);
    await settle();
    expect(more.hidden).toBe(false);
    expect(instance.isExpanded()).toBe(false);
    media.setMatches(true);
    await settle();
    expect(more.hidden).toBe(true);
  });

  it("keeps a split region collapsed after refresh when its toggle is inside the target", async () => {
    mediaQuery(true);
    const page = fixture('<p>Preview.</p><div data-a11y-long-text-more><p>Full details.</p></div>');
    page.content.append(page.button);
    const more = page.content.querySelector<HTMLElement>("[data-a11y-long-text-more]")!;
    const instance = page.start({ mode: "split", responsive: { mediaQuery: "(width < 48rem)" } });
    page.button.focus();
    page.button.click();
    expect(more.hidden).toBe(false);
    page.button.click();
    expect(more.hidden).toBe(true);
    instance.refresh();
    TestResizeObserver.notify(page.content);
    await settle();
    expect(more.hidden).toBe(true);
    expect(page.content.classList.contains("a11y-long-text--collapsed")).toBe(true);
    expect(instance.isExpanded()).toBe(false);
    expect(page.button.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(page.button);
  });

  it("removes item hiding while inactive and reapplies the saved count on activation", async () => {
    const media = mediaQuery(true);
    const { content, start } = fixture("<ul><li>First</li><li>Second</li><li>Third</li></ul>");
    start({ mode: "items", collapsedItems: 1, responsive: { mediaQuery: "(width < 48rem)" } });
    expect(content.querySelectorAll(".a11y-long-text__item--collapsed")).toHaveLength(2);
    media.setMatches(false);
    await settle();
    expectFull(content);
    media.setMatches(true);
    await settle();
    expect(content.querySelectorAll(".a11y-long-text__item--collapsed")).toHaveLength(2);
  });

  it("supports viewport and container data attributes", async () => {
    const media = mediaQuery(false);
    const viewport = fixture();
    viewport.button.dataset.mediaQuery = "(width < 48rem)";
    viewport.start();
    expect(viewport.button.hidden).toBe(true);
    media.setMatches(true);
    await settle();
    expect(viewport.button.hidden).toBe(false);

    const container = fixture();
    container.button.dataset.container = `#${container.wrapper.id}`;
    container.button.dataset.containerMaxWidth = "400";
    container.start();
    expect(container.button.hidden).toBe(true);
    container.setWidth(400);
    TestResizeObserver.notify(container.wrapper, 400);
    await settle();
    expect(container.button.hidden).toBe(false);
  });

  it("lets a JavaScript responsive object replace all HTML responsive settings", () => {
    mediaQuery(true);
    const { button, content, start } = fixture();
    button.dataset.container = "#does-not-exist";
    button.dataset.containerMaxWidth = "invalid";
    start({ responsive: { mediaQuery: "(width < 48rem)" } });
    expect(button.hidden).toBe(false);
    expect(content.classList.contains("a11y-long-text--collapsed")).toBe(true);
  });

  it("lets responsive:null disable inherited HTML responsive settings", () => {
    const { button, content, start } = fixture();
    button.dataset.mediaQuery = "(width < 48rem)";
    button.dataset.container = "#missing";
    start({ responsive: null });
    expect(button.hidden).toBe(false);
    expect(content.classList.contains("a11y-long-text--collapsed")).toBe(true);
  });

  it.each([
    ["empty configuration", {}],
    ["empty media query", { mediaQuery: " " }],
    ["mixed forms", { mediaQuery: "(width < 48rem)", container: "#missing", maxWidth: 400 }],
    ["missing container", { maxWidth: 400 }],
    ["missing width", { container: "#missing" }],
    ["missing element", { container: "#missing", maxWidth: 400 }],
    ["zero width", { container: "#missing", maxWidth: 0 }],
    ["negative width", { container: "#missing", maxWidth: -2 }],
    ["nonfinite width", { container: "#missing", maxWidth: Infinity }],
    ["unit-bearing width", { container: "#missing", maxWidth: "40rem" }],
  ])("rejects %s before changing authored markup", (_name, responsive) => {
    const { host, start } = fixture();
    const authored = host.innerHTML;
    expect(() => start({ responsive } as A11yLongTextToggleOptions)).toThrow();
    expect(host.innerHTML).toBe(authored);
  });

  it("requires a container ancestor distinct from the target", () => {
    const page = fixture();
    const authored = page.host.innerHTML;
    expect(() => page.start({ responsive: { container: page.content, maxWidth: 400 } })).toThrow();
    expect(() => page.start({ responsive: { container: page.outside, maxWidth: 400 } })).toThrow();
    expect(page.host.innerHTML).toBe(authored);
  });

  it.each([0, -2, Infinity, NaN, "", "40rem"])("rejects invalid maxWidth %s with a valid container", (maxWidth) => {
    const page = fixture();
    const authored = page.host.innerHTML;
    expect(() => page.start({ responsive: { container: page.wrapper, maxWidth } })).toThrow(/maxWidth/);
    expect(page.host.innerHTML).toBe(authored);
  });

  it("rejects conflicting HTML responsive forms before changing markup", () => {
    const page = fixture();
    page.button.dataset.mediaQuery = "(width < 48rem)";
    page.button.dataset.container = `#${page.wrapper.id}`;
    page.button.dataset.containerMaxWidth = "400";
    const authored = page.host.innerHTML;
    expect(() => page.start()).toThrow();
    expect(page.host.innerHTML).toBe(authored);
  });

  it("uses inclusive container content width, excluding padding and borders", async () => {
    const page = fixture();
    page.wrapper.style.paddingLeft = "20px";
    page.wrapper.style.paddingRight = "30px";
    page.setWidth(400);
    page.start({ responsive: { container: page.wrapper, maxWidth: "400" } });
    expect(page.button.hidden).toBe(false);
    page.setWidth(400.5);
    TestResizeObserver.notify(page.wrapper, 400.5);
    await settle();
    expect(page.button.hidden).toBe(true);
    expectFull(page.content);
  });

  it("retains fractional content widths for a border-box container", async () => {
    const page = fixture();
    Object.assign(page.wrapper.style, {
      boxSizing: "border-box", width: "454.25px", paddingLeft: "20px", paddingRight: "30px", border: "2px solid",
    });
    page.setWidth(400.25);
    page.start({ responsive: { container: page.wrapper, maxWidth: 400 } });
    expect(page.button.hidden).toBe(true);
    page.wrapper.style.width = "454px";
    page.setWidth(400);
    TestResizeObserver.notify(page.wrapper, 400);
    await settle();
    expect(page.button.hidden).toBe(false);
  });

  it("excludes a classic scrollbar while retaining fractional border-box thresholds", async () => {
    const page = fixture();
    Object.assign(page.wrapper.style, {
      boxSizing: "border-box", width: "660px", paddingLeft: "20px", paddingRight: "20px", border: "2px solid",
      overflowY: "scroll",
    });
    // A 660px border box has 40px padding, 4px borders and a 20px
    // classic scrollbar: the actual content width is 596px, clientWidth 636px.
    page.setWidth(596);
    Object.defineProperty(page.wrapper, "getBoundingClientRect", {
      configurable: true,
      value: () => ({ width: parseFloat(page.wrapper.style.width), height: 200 }),
    });
    page.start({ responsive: { container: page.wrapper, maxWidth: 600 } });
    expect(page.button.hidden).toBe(false);

    // clientWidth is integral even when the resolved CSS content width is
    // fractional. The scrollbar must not erase a 0.25px boundary crossing.
    page.wrapper.style.width = "664.25px";
    page.setWidth(600);
    TestResizeObserver.notify(page.wrapper, 600.25);
    await settle();
    expect(page.button.hidden).toBe(true);
    page.wrapper.style.width = "664px";
    TestResizeObserver.notify(page.wrapper, 600);
    await settle();
    expect(page.button.hidden).toBe(false);
  });

  it("responds to independent container widths without a viewport resize", async () => {
    const first = fixture();
    const second = fixture();
    first.setWidth(300);
    second.setWidth(700);
    first.start({ responsive: { container: first.wrapper, maxWidth: 400 } });
    second.start({ responsive: { container: `#${second.wrapper.id}`, maxWidth: 400 } });
    expect(first.button.hidden).toBe(false);
    expect(second.button.hidden).toBe(true);
    first.setWidth(700);
    second.setWidth(300);
    TestResizeObserver.notify(first.wrapper, 700);
    TestResizeObserver.notify(second.wrapper, 300);
    await settle();
    expect(first.button.hidden).toBe(true);
    expect(second.button.hidden).toBe(false);
  });

  it("leaves zero-width containers open until they become measurable", async () => {
    const page = fixture();
    page.setWidth(0);
    page.start({ responsive: { container: page.wrapper, maxWidth: 400 } });
    expectFull(page.content);
    expect(page.button.hidden).toBe(true);
    page.setWidth(300);
    TestResizeObserver.notify(page.wrapper, 300);
    await settle();
    expect(page.button.hidden).toBe(false);
    expect(page.content.classList.contains("a11y-long-text--collapsed")).toBe(true);
  });

  it("supports manual container refresh without ResizeObserver", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const page = fixture();
    page.setWidth(700);
    const instance = page.start({ responsive: { container: page.wrapper, maxWidth: 400 } });
    expect(page.button.hidden).toBe(true);
    page.setWidth(300);
    instance.refresh();
    expect(page.button.hidden).toBe(false);
  });

  it("leaves viewport-controlled content readable when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    const { button, content, start } = fixture();
    expect(() => start({ responsive: { mediaQuery: "(width < 48rem)" } })).not.toThrow();
    expectFull(content);
    expect(button.hidden).toBe(true);
  });

  it("keeps a focused toggle functional until focus leaves before deactivating", async () => {
    const media = mediaQuery(true);
    const { button, outside, content, start } = fixture();
    start({ responsive: { mediaQuery: "(width < 48rem)" } });
    button.focus();
    media.setMatches(false);
    await settle();
    expect(document.activeElement).toBe(button);
    expect(button.hidden).toBe(false);
    button.click();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    outside.focus();
    await settle();
    expect(button.hidden).toBe(true);
    expectFull(content);
    expect(document.activeElement).toBe(outside);
  });

  it("keeps focus stable when a container grows beyond its active width", async () => {
    const page = fixture();
    page.setWidth(300);
    page.start({ responsive: { container: page.wrapper, maxWidth: 400 } });
    page.button.focus();
    page.setWidth(600);
    TestResizeObserver.notify(page.wrapper, 600);
    await settle();
    expect(document.activeElement).toBe(page.button);
    expect(page.button.hidden).toBe(false);
    page.outside.focus();
    await settle();
    expect(page.button.hidden).toBe(true);
    expectFull(page.content);
  });

  it("keeps a focused toggle present when resize makes the content fit", async () => {
    mediaQuery(true);
    const page = fixture();
    page.start({ responsive: { mediaQuery: "(width < 48rem)" } });
    page.button.focus();
    page.setOverflow(false);
    TestResizeObserver.notify(page.content);
    await settle();
    expect(document.activeElement).toBe(page.button);
    expect(page.button.hidden).toBe(false);
    expectFull(page.content);
    page.outside.focus();
    await settle();
    expect(page.button.hidden).toBe(true);
  });

  it("cancels a deferred deactivation when the latest width matches again", async () => {
    const media = mediaQuery(true);
    const { button, outside, start } = fixture();
    start({ responsive: { mediaQuery: "(width < 48rem)" } });
    button.focus();
    media.setMatches(false);
    await settle();
    media.setMatches(true);
    await settle();
    outside.focus();
    await settle();
    expect(button.hidden).toBe(false);
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("defers split collapse while focus moves within the remainder and retries on leaving", async () => {
    const media = mediaQuery(false);
    const page = fixture('<p>Preview.</p><div data-a11y-long-text-more><a href="#one">First detail</a><a href="#two">Second detail</a></div>');
    const instance = page.start({ mode: "split", responsive: { mediaQuery: "(width < 48rem)" } });
    const links = page.content.querySelectorAll("a");
    const more = page.content.querySelector<HTMLElement>("[data-a11y-long-text-more]")!;
    links[0].focus();
    media.setMatches(true);
    await settle();
    expect(more.hidden).toBe(false);
    expect(document.activeElement).toBe(links[0]);
    expect(instance.isExpanded()).toBe(false);
    expect(page.button.getAttribute("aria-expanded")).toBe("true");
    links[1].focus();
    await settle();
    expect(more.hidden).toBe(false);
    page.outside.focus();
    await settle();
    expect(more.hidden).toBe(true);
    expect(document.activeElement).toBe(page.outside);
  });

  it("does not move focus out of split content during delayed initialization", async () => {
    mediaQuery(true);
    const page = fixture('<p>Preview.</p><div data-a11y-long-text-more><a href="#details">Details</a></div>');
    const link = page.content.querySelector("a")!;
    link.focus();
    page.start({ mode: "split", responsive: { mediaQuery: "(width < 48rem)" } });
    expect(document.activeElement).toBe(link);
    expectFull(page.content);
    page.outside.focus();
    await settle();
    expect(page.content.querySelector<HTMLElement>("[data-a11y-long-text-more]")!.hidden).toBe(true);
  });

  it("preserves the existing no-responsive focus recovery during delayed split initialization", () => {
    const page = fixture('<p>Preview.</p><div data-a11y-long-text-more><a href="#details">Details</a></div>');
    page.content.querySelector("a")!.focus();
    page.start({ mode: "split" });
    expect(page.content.querySelector<HTMLElement>("[data-a11y-long-text-more]")!.hidden).toBe(true);
    expect(document.activeElement).toBe(page.button);
  });

  it("does not apply a stale deferred split collapse after widening again", async () => {
    const media = mediaQuery(false);
    const page = fixture('<p>Preview.</p><div data-a11y-long-text-more><a href="#details">Details</a></div>');
    page.start({ mode: "split", responsive: { mediaQuery: "(width < 48rem)" } });
    page.content.querySelector("a")!.focus();
    media.setMatches(true);
    await settle();
    media.setMatches(false);
    await settle();
    page.outside.focus();
    await settle();
    expectFull(page.content);
    expect(page.button.hidden).toBe(true);
  });

  it("preserves focus in an item that automatic narrowing would hide", async () => {
    const media = mediaQuery(false);
    const page = fixture('<ul><li>First</li><li><a href="#details">Details</a></li></ul>');
    page.start({ mode: "items", collapsedItems: 1, allowInteractiveContent: true, responsive: { mediaQuery: "(width < 48rem)" } });
    const link = page.content.querySelector("a")!;
    link.focus();
    media.setMatches(true);
    await settle();
    expect(document.activeElement).toBe(link);
    expectFull(page.content);
    page.outside.focus();
    await settle();
    expect(page.content.querySelectorAll(".a11y-long-text__item--collapsed")).toHaveLength(1);
    expect(document.activeElement).toBe(page.outside);
  });

  it("reuses an instance and removes media listeners and pending focus work on destroy", async () => {
    const media = mediaQuery(true);
    const page = fixture();
    page.content.className = "cms-copy";
    page.content.style.color = "rebeccapurple";
    const authored = page.host.innerHTML;
    const instance = page.start({ responsive: { mediaQuery: "(width < 48rem)" } });
    expect(new A11yLongTextToggle(page.button)).toBe(instance);
    expect(media.add.mock.calls.filter(([name]) => name === "change")).toHaveLength(1);
    page.button.focus();
    media.setMatches(false);
    await settle();
    instance.destroy();
    expect(media.remove.mock.calls.some(([name]) => name === "change")).toBe(true);
    expect(page.host.innerHTML).toBe(authored);
    page.outside.focus();
    media.setMatches(true);
    media.setMatches(false);
    await settle();
    expect(page.host.innerHTML).toBe(authored);
  });

  it("disconnects container observers and cancels queued work before restoring markup", async () => {
    const page = fixture();
    page.content.className = "cms-copy";
    page.content.style.color = "rebeccapurple";
    const authored = page.host.innerHTML;
    const instance = page.start({ responsive: { container: page.wrapper, maxWidth: 400 } });
    const observers = [...TestResizeObserver.all];
    expect(observers.some((observer) => observer.targets.has(page.wrapper))).toBe(true);
    page.setWidth(300);
    TestResizeObserver.notify(page.wrapper, 300);
    instance.destroy();
    for (const observer of observers) expect(observer.disconnect).toHaveBeenCalled();
    await settle();
    TestResizeObserver.notify(page.wrapper, 300);
    expect(page.host.innerHTML).toBe(authored);
  });
});
