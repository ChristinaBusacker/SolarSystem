// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  closeAllSidebars,
  closeSidebar,
  getLayoutState,
  openSidebar,
  subscribeLayoutState,
  toggleSidebar,
} from "./layout-state";

describe("layout-state", () => {
  beforeEach(() => {
    // Keep module state and DOM in a known state between tests.
    document.body.className = "";
    closeAllSidebars();
  });

  it("starts with both sidebars closed", () => {
    expect(getLayoutState()).toEqual({ leftOpen: false, rightOpen: false });
    expect(document.body.classList.contains("sidebar-open")).toBe(false);
  });

  it("opens exactly one sidebar at a time", () => {
    openSidebar("left");
    expect(getLayoutState()).toEqual({ leftOpen: true, rightOpen: false });
    expect(document.body.classList.contains("sidebar-open")).toBe(true);

    openSidebar("right");
    expect(getLayoutState()).toEqual({ leftOpen: false, rightOpen: true });
    expect(document.body.classList.contains("sidebar-open")).toBe(true);
  });

  it("closes sidebars and removes the body class", () => {
    openSidebar("right");
    closeSidebar("right");

    expect(getLayoutState()).toEqual({ leftOpen: false, rightOpen: false });
    expect(document.body.classList.contains("sidebar-open")).toBe(false);
  });

  it("toggles a sidebar", () => {
    toggleSidebar("left");
    expect(getLayoutState()).toEqual({ leftOpen: true, rightOpen: false });

    toggleSidebar("left");
    expect(getLayoutState()).toEqual({ leftOpen: false, rightOpen: false });
  });

  it("notifies subscribers and supports unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeLayoutState(listener);

    // Immediate initial snapshot
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({ leftOpen: false, rightOpen: false });

    openSidebar("left");
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith({ leftOpen: true, rightOpen: false });

    unsubscribe();
    openSidebar("right");

    // No further calls after unsubscribe
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
