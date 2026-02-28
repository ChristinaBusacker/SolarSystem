// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { CameraManager } from "./CameraManager";
import { SimpleControl } from "../controls/simple.control";

function setupDom() {
  document.body.innerHTML = "";

  const app = document.createElement("div");
  app.id = "app";
  document.body.appendChild(app);

  const sceneRoot = document.createElement("div");
  sceneRoot.id = "scene-root";

  // JSDOM returns 0 sizes, but CameraManager clamps to >=1. Provide stable values.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (sceneRoot as any).getBoundingClientRect = () => ({
    width: 800,
    height: 600,
    top: 0,
    left: 0,
    right: 800,
    bottom: 600,
  });

  document.body.appendChild(sceneRoot);
}

describe("CameraManager", () => {
  it("re-triggers fly-out when switching to the same body camera", () => {
    setupDom();
    const scene = new THREE.Scene();
    const mgr = new CameraManager(scene);

    // Add a body camera
    const bodyCam = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const control = new SimpleControl(100, 1000, bodyCam);
    mgr.addCamera("Mars", bodyCam, control);

    // First switch should reset camera near the target
    mgr.switchCamera("Mars", false);
    const expectedStart = Math.max(bodyCam.near * 2.0, control.distanceMin * 0.01);
    expect(bodyCam.position.z).toBeCloseTo(expectedStart, 6);

    // Simulate user zooming out / moving the camera
    bodyCam.position.set(0, 0, 999);

    // Switching again should reset start distance again (retrigger)
    mgr.switchCamera("Mars", false);
    expect(bodyCam.position.z).toBeCloseTo(expectedStart, 6);
  });

  it("toggles CSS overlay marker classes on camera switch", () => {
    setupDom();
    const scene = new THREE.Scene();
    const mgr = new CameraManager(scene);

    const overlay = document.createElement("div");
    overlay.innerHTML = `
      <div class="object Default"></div>
      <div class="object Mars"></div>
    `;
    mgr.attachCssOverlay(overlay);

    const marsCam = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const marsCtrl = new SimpleControl(10, 100, marsCam);
    mgr.addCamera("Mars", marsCam, marsCtrl);

    mgr.switchCamera("Mars", false);
    expect(overlay.querySelector(".object.Mars")?.classList.contains("hide")).toBe(true);
    expect(overlay.classList.contains("hideMoons")).toBe(false);

    mgr.switchCamera("Default", false);
    expect(overlay.querySelector(".object.Mars")?.classList.contains("hide")).toBe(false);
    expect(overlay.classList.contains("hideMoons")).toBe(true);
  });
});
