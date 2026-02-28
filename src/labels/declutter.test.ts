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

  it("keeps non-selected planets visible when focusing a planet from far away", () => {
    const bodies: DeclutterBody[] = [
      {
        id: "mars",
        kind: "planet",
        position: { x: 0, y: 0, z: 0 },
        radius: 5,
      },
      {
        id: "earth",
        kind: "planet",
        position: { x: 100, y: 0, z: 0 },
        radius: 5,
      },
    ];

    const res = computeDeclutterVisibility({
      bodies,
      state: {
        isOverview: false,
        selectedId: "mars",
        cameraPos: { x: 10_000, y: 0, z: 0 },
        thresholds: {
          // Far away: should NOT hide other planets.
          focusHideOthersDistance: 10,
        },
        occlusion: { enabled: false },
      },
    });

    expect(res.labelVisibleById.mars).toBe(false);
    expect(res.labelVisibleById.earth).toBe(true);
  });

  it("hides other planets when focusing a planet up close", () => {
    const bodies: DeclutterBody[] = [
      {
        id: "mars",
        kind: "planet",
        position: { x: 0, y: 0, z: 0 },
        radius: 5,
      },
      {
        id: "earth",
        kind: "planet",
        position: { x: 100, y: 0, z: 0 },
        radius: 5,
      },
    ];

    const res = computeDeclutterVisibility({
      bodies,
      state: {
        isOverview: false,
        selectedId: "mars",
        cameraPos: { x: 1, y: 0, z: 0 },
        thresholds: {
          focusHideOthersDistance: 10,
        },
        occlusion: { enabled: false },
      },
    });

    // Selected stays hidden, others also hidden when close.
    expect(res.labelVisibleById.mars).toBe(false);
    expect(res.labelVisibleById.earth).toBe(false);
  });

  it("shows moons of the selected planet only when within the focus distance", () => {
    const bodies: DeclutterBody[] = [
      {
        id: "mars",
        kind: "planet",
        position: { x: 0, y: 0, z: 0 },
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

    const near = computeDeclutterVisibility({
      bodies,
      state: {
        isOverview: false,
        selectedId: "mars",
        cameraPos: { x: 1, y: 0, z: 0 },
        thresholds: {
          moonFocusLabelDistance: 10,
          focusHideOthersDistance: 0,
        },
        occlusion: { enabled: false },
      },
    });

    const far = computeDeclutterVisibility({
      bodies,
      state: {
        isOverview: false,
        selectedId: "mars",
        cameraPos: { x: 1_000, y: 0, z: 0 },
        thresholds: {
          moonFocusLabelDistance: 10,
          focusHideOthersDistance: 0,
        },
        occlusion: { enabled: false },
      },
    });

    expect(near.labelVisibleById.mars).toBe(false);
    expect(near.labelVisibleById.phobos).toBe(true);

    expect(far.labelVisibleById.mars).toBe(false);
    expect(far.labelVisibleById.phobos).toBe(false);
  });

  it("when focusing a moon, hides the selected moon label and can show sibling moons", () => {
    const bodies: DeclutterBody[] = [
      {
        id: "sun",
        kind: "sun",
        position: { x: -10_000, y: 0, z: 0 },
        radius: 500,
      },
      {
        id: "mars",
        kind: "planet",
        position: { x: 0, y: 0, z: 0 },
        radius: 5,
      },
      {
        id: "phobos",
        kind: "moon",
        parentId: "mars",
        position: { x: 12, y: 0, z: 0 },
        radius: 1,
      },
      {
        id: "deimos",
        kind: "moon",
        parentId: "mars",
        position: { x: 16, y: 0, z: 0 },
        radius: 1,
      },
      {
        id: "io",
        kind: "moon",
        parentId: "jupiter",
        position: { x: 5_000, y: 0, z: 0 },
        radius: 1,
      },
    ];

    const res = computeDeclutterVisibility({
      bodies,
      state: {
        isOverview: false,
        selectedId: "phobos",
        selectedParentId: "mars",
        cameraPos: { x: 1, y: 0, z: 0 },
        thresholds: {
          moonFocusLabelDistance: 1_000_000,
          focusHideOthersDistance: 1_000_000,
        },
        occlusion: { enabled: false },
      },
    });

    expect(res.labelVisibleById.phobos).toBe(false);
    // Parent can remain visible for context.
    expect(res.labelVisibleById.mars).toBe(true);
    // Sibling moons can be visible, but not moons of other parents.
    expect(res.labelVisibleById.deimos).toBe(true);
    expect(res.labelVisibleById.io).toBe(false);
    // Sun allowed as context while close.
    expect(res.labelVisibleById.sun).toBe(true);
  });

  it("can occlude a moon label behind the selected planet in focus mode", () => {
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
        isOverview: false,
        selectedId: "saturn",
        cameraPos: { x: 0, y: 0, z: 0 },
        thresholds: {
          moonFocusLabelDistance: 1_000_000,
          focusHideOthersDistance: 0,
        },
        occlusion: {
          enabled: true,
          radiusMultiplier: 1,
        },
      },
    });

    expect(res.labelVisibleById.saturn).toBe(false);
    expect(res.labelVisibleById.dione).toBe(false);
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
