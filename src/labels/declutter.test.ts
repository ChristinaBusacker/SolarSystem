import { describe, expect, it } from "vitest";

import type { DeclutterBody } from "./declutter";
import { computeDeclutterVisibility } from "./declutter";

describe("computeDeclutterVisibility", () => {
  it("hides the selected body label", () => {
    const bodies: DeclutterBody[] = [
      {
        id: "mars",
        kind: "planet",
        position: { x: 10, y: 0, z: 0 },
        radius: 5,
      },
      {
        id: "phobos",
        kind: "moon",
        parentId: "mars",
        position: { x: 12, y: 0, z: 0 },
        radius: 1,
      },
    ];

    const res = computeDeclutterVisibility({
      bodies,
      state: {
        isOverview: false,
        selectedId: "mars",
        cameraPos: { x: 0, y: 0, z: 0 },
        thresholds: {
          // Keep rules from hiding other planets/moons for this test.
          focusHideOthersDistance: 0,
          moonFocusLabelDistance: 1_000_000,
        },
        occlusion: { enabled: false },
      },
    });

    expect(res.labelVisibleById.mars).toBe(false);
    // Phobos should be visible (rules allow moons of the selected planet)
    expect(res.labelVisibleById.phobos).toBe(true);
  });

  it("in overview, hides moon labels when the camera is far from the parent", () => {
    const bodies: DeclutterBody[] = [
      {
        id: "jupiter",
        kind: "planet",
        position: { x: 0, y: 0, z: 0 },
        radius: 5,
      },
      {
        id: "io",
        kind: "moon",
        parentId: "jupiter",
        position: { x: 2, y: 0, z: 0 },
        radius: 1,
      },
    ];

    const res = computeDeclutterVisibility({
      bodies,
      state: {
        isOverview: true,
        cameraPos: { x: 1000, y: 0, z: 0 },
        thresholds: {
          moonRevealDistanceToParent: 10,
        },
        occlusion: { enabled: false },
      },
    });

    expect(res.labelVisibleById.jupiter).toBe(true);
    expect(res.labelVisibleById.io).toBe(false);
    // overview: planet orbit shown, moon orbit hidden
    expect(res.orbitVisibleById.jupiter).toBe(true);
    expect(res.orbitVisibleById.io).toBe(false);
  });

  it("can occlude a moon label behind its parent planet", () => {
    const bodies: DeclutterBody[] = [
      {
        id: "saturn",
        kind: "planet",
        position: { x: 5, y: 0, z: 0 },
        radius: 2,
      },
      {
        id: "dione",
        kind: "moon",
        parentId: "saturn",
        position: { x: 10, y: 0, z: 0 },
        radius: 1,
      },
    ];

    const res = computeDeclutterVisibility({
      bodies,
      state: {
        isOverview: true,
        cameraPos: { x: 0, y: 0, z: 0 },
        thresholds: {
          moonRevealDistanceToParent: 1_000_000,
        },
        occlusion: {
          enabled: true,
          radiusMultiplier: 1,
        },
      },
    });

    expect(res.labelVisibleById.saturn).toBe(true);
    expect(res.labelVisibleById.dione).toBe(false);
  });
});
