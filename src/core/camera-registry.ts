import type * as THREE from "three";
import type { SimpleControl } from "../controls/simple.control";

/**
 * Minimal contract required by Astronomical bodies to register their cameras.
 *
 * This keeps object code decoupled from the concrete CameraManager implementation.
 */
export type CameraRegistry = {
  addCamera: (selector: string, camera: THREE.PerspectiveCamera, control: SimpleControl) => unknown;
};
