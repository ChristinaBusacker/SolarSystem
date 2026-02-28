import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSceneVisibilityState,
  setDeclutterAuto,
  setMarkersVisible,
  setOrbitsVisible,
  subscribeSceneVisibilityState,
  toggleDeclutterAuto,
  toggleMarkers,
  toggleOrbits,
} from "./scene-visibility-state";

describe("scene-visibility-state", () => {
  beforeEach(() => {
    // Reset to defaults between tests.
    setMarkersVisible(true);
    setOrbitsVisible(true);
    setDeclutterAuto(true);
  });

  it("has cinematic defaults", () => {
    expect(getSceneVisibilityState()).toEqual({
      markersVisible: true,
      orbitsVisible: true,
      declutterAuto: true,
    });
  });

  it("toggles markers and orbits", () => {
    toggleMarkers();
    expect(getSceneVisibilityState().markersVisible).toBe(false);

    toggleOrbits();
    expect(getSceneVisibilityState().orbitsVisible).toBe(false);
  });

  it("toggles declutter auto", () => {
    toggleDeclutterAuto();
    expect(getSceneVisibilityState().declutterAuto).toBe(false);
  });

  it("notifies subscribers and supports unsubscribe", () => {
    const listener = vi.fn();
    const unsub = subscribeSceneVisibilityState(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({
      markersVisible: true,
      orbitsVisible: true,
      declutterAuto: true,
    });

    setMarkersVisible(false);
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith({
      markersVisible: false,
      orbitsVisible: true,
      declutterAuto: true,
    });

    unsub();
    setOrbitsVisible(false);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
