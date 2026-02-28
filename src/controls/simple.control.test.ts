// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { SimpleControl } from "./simple.control";

describe("SimpleControl", () => {
  it("clamps zoom to [0..1]", () => {
    const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const c = new SimpleControl(1, 10, cam);

    c.zoom = 0.5;
    c.applyZoomDelta(10);
    expect(c.zoom).toBe(1);

    c.applyZoomDelta(-999);
    expect(c.zoom).toBe(0);
  });

  it("wheel input can move away from endpoints", () => {
    const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const c = new SimpleControl(1, 10, cam);

    // At zoom=0, wheel should still be able to zoom out (increase zoom)
    c.zoom = 0;
    c.applyWheel(120);
    expect(c.zoom).toBeGreaterThan(0);

    // At zoom=1, wheel should still be able to zoom in (decrease zoom)
    c.zoom = 1;
    c.applyWheel(-120);
    expect(c.zoom).toBeLessThan(1);
  });

  it("update lerps camera distance toward zoom target", () => {
    const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    cam.position.set(0, 0, 0);
    const c = new SimpleControl(10, 110, cam);

    c.zoom = 1;
    c.update(0.2);
    expect(cam.position.z).toBeGreaterThan(0);
    expect(cam.position.z).toBeLessThanOrEqual(110);
  });

  it("clamps vertical rotation to the configured limit", () => {
    const cam = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const c = new SimpleControl(1, 10, cam);
    c.verticleRotationLimit = 60;

    // Simulate a big drag and a frame update.
    c.startRotate(0, 0);
    c.moveRotate(0, -10000, 1);
    c.update(0.016);
    c.endRotate();

    const limitRad = (c.verticleRotationLimit * Math.PI) / 180;
    expect(c.vertical.rotation.x).toBeLessThanOrEqual(limitRad + 1e-6);
    expect(c.vertical.rotation.x).toBeGreaterThanOrEqual(-limitRad - 1e-6);
  });
});
