import { describe, expect, it } from "vitest";

import { isRayOccludedBySpheres } from "./occlusion";

describe("isRayOccludedBySpheres", () => {
  it("returns true when a sphere intersects the ray segment", () => {
    const occluded = isRayOccludedBySpheres({
      rayOrigin: { x: 0, y: 0, z: 0 },
      target: { x: 10, y: 0, z: 0 },
      spheres: [{ id: "planet", center: { x: 5, y: 0, z: 0 }, radius: 2 }],
      radiusMultiplier: 1,
    });

    expect(occluded).toBe(true);
  });

  it("returns false when the sphere is behind the target", () => {
    const occluded = isRayOccludedBySpheres({
      rayOrigin: { x: 0, y: 0, z: 0 },
      target: { x: 10, y: 0, z: 0 },
      spheres: [{ id: "behind", center: { x: 20, y: 0, z: 0 }, radius: 5 }],
      radiusMultiplier: 1,
    });

    expect(occluded).toBe(false);
  });

  it("supports ignoreIds", () => {
    const occluded = isRayOccludedBySpheres({
      rayOrigin: { x: 0, y: 0, z: 0 },
      target: { x: 10, y: 0, z: 0 },
      spheres: [{ id: "ignored", center: { x: 5, y: 0, z: 0 }, radius: 2 }],
      ignoreIds: new Set(["ignored"]),
      radiusMultiplier: 1,
    });

    expect(occluded).toBe(false);
  });

  it("treats a grazing intersection as occluded", () => {
    // Ray from origin to (10,0,0). Sphere center offset on Y so the ray just touches the radius.
    const occluded = isRayOccludedBySpheres({
      rayOrigin: { x: 0, y: 0, z: 0 },
      target: { x: 10, y: 0, z: 0 },
      spheres: [{ id: "grazing", center: { x: 5, y: 2, z: 0 }, radius: 2 }],
      radiusMultiplier: 1,
    });

    expect(occluded).toBe(true);
  });
});
