import type * as THREE from "three";

export type UpdateContext = {
  /**
   * Frame delta in seconds.
   */
  delta: number;

  /**
   * Simulation speed multiplier (e.g. 1 = realtime).
   */
  simSpeed: number;

  /**
   * Active camera for this frame.
   */
  camera: THREE.PerspectiveCamera;

  /**
   * Root scene.
   */
  scene: THREE.Scene;

  /**
   * Device pixel ratio used for rendering.
   */
  dpr: number;

  /**
   * Current viewport size in CSS pixels.
   */
  viewport: {
    width: number;
    height: number;
  };
};
