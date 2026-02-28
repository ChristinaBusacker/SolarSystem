// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { AppRouter } from "./router";

describe("AppRouter", () => {
  it("parses initial route on start", () => {
    const r = new AppRouter();

    window.history.pushState({}, "", "/planet/Mars");
    r.start();
    expect(r.getCurrent()).toEqual({ name: "planet", planet: "Mars" });
  });

  it("normalizes historical Neptun naming", () => {
    const r = new AppRouter();
    r.start();

    r.goPlanet("Neptun");
    expect(r.getCurrent()).toEqual({ name: "planet", planet: "Neptune" });
    expect(window.location.pathname).toBe("/planet/Neptune");
  });

  it("does not notify subscribers for identical commits", () => {
    const r = new AppRouter();
    r.start();

    let calls = 0;
    const unsub = r.subscribe(() => {
      calls++;
    });

    // First callback happens immediately on subscribe.
    const initialCalls = calls;
    r.goPlanet("Earth");
    const afterFirst = calls;

    // Same route again should not call.
    r.goPlanet("Earth");
    expect(calls).toBe(afterFirst);
    expect(afterFirst).toBe(initialCalls + 1);

    unsub();
  });
});
