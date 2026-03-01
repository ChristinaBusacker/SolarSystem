import * as THREE from "three";
import { SimpleControl } from "../controls/simple.control";
import { CameraEntry } from "../interfaces/entry.interfaces";
import { SoundManager } from "./SoundManager";

export class CameraManager {
  public collection: Array<CameraEntry> = [];
  private activeCamera: CameraEntry;

  private cssOverlay?: HTMLElement;

  // Single, shared input bindings (no listener hell).
  private inputBound = false;
  private isPointerDown = false;
  private touchMode: "none" | "rotate" | "pinch" = "none";
  private pinchStartDistance = 0;
  private pinchStartZoom = 0;

  constructor(scene: THREE.Scene) {
    const defaultCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      10,
      2000000,
    );

    // Default (home) camera should start fully zoomed out.
    defaultCamera.position.set(0, 0, 950000);
    const defaultControl = new SimpleControl(500, 950000, defaultCamera);
    defaultControl.zoom = 1;
    defaultControl.snapToZoom();

    scene.add(defaultControl.group);

    this.addCamera("Default", defaultCamera, defaultControl);

    // Cinematic camera (scripted movement, no direct user controls).
    const cinematicCamera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.01,
      90000000,
    );
    cinematicCamera.position.set(0, 0, 1);
    const cinematicControl = new SimpleControl(0.01, 1, cinematicCamera);
    scene.add(cinematicControl.group);
    this.addCamera("Cinematic", cinematicCamera, cinematicControl);
  }

  private isCinematicActive(): boolean {
    return this.activeCamera?.selector === "Cinematic";
  }

  private getInteractiveTarget(target: EventTarget | null): HTMLElement | null {
    if (!target) return null;
    const el = target as HTMLElement;
    if (!el || typeof el.closest !== "function") return null;

    // CSS2D labels
    const label = el.closest(".object");
    if (label) return label as HTMLElement;

    // UI overlay + sidebars
    const ui = el.closest("#ui-root, .sidebar-root");
    if (ui) return ui as HTMLElement;

    // Native interactive elements
    const native = el.closest("a, button, input, textarea, select");
    if (native) return native as HTMLElement;

    return null;
  }

  private bindInputOnce(): void {
    if (this.inputBound) return;
    const app = document.getElementById("app");
    if (!app) return;

    // Mouse
    app.addEventListener("mousedown", (e: MouseEvent) => {
      if (this.getInteractiveTarget(e.target)) return;
      if (this.isCinematicActive()) return;
      this.isPointerDown = true;
      this.activeCamera?.control?.startRotate(e.clientX, e.clientY);
    });

    app.addEventListener("mousemove", (e: MouseEvent) => {
      if (!this.isPointerDown) return;
      if (this.isCinematicActive()) return;
      this.activeCamera?.control?.moveRotate(e.clientX, e.clientY, 0.8);
    });

    const endMouse = () => {
      this.isPointerDown = false;
      this.activeCamera?.control?.endRotate();
    };
    app.addEventListener("mouseup", endMouse);
    app.addEventListener("mouseleave", endMouse);

    // Wheel zoom (single listener!)
    app.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        if (this.getInteractiveTarget(e.target)) return;
        // Prevent the browser page from scrolling on trackpads.
        e.preventDefault();
        if (this.isCinematicActive()) return;
        this.activeCamera?.control?.applyWheel(e.deltaY);
      },
      { passive: false },
    );

    // Touch (Mode 1: 1 finger rotate, 2 finger pinch zoom)
    app.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        if (this.getInteractiveTarget(e.target)) return;
        // In cinematic mode we don't control the camera, but we still must prevent
        // browser scrolling/zooming on touch devices (otherwise the viewport bounces and jitters).
        if (this.isCinematicActive()) {
          e.preventDefault();
          return;
        }

        if (e.touches.length === 1) {
          this.touchMode = "rotate";
          this.activeCamera?.control?.startRotate(e.touches[0].clientX, e.touches[0].clientY);
          e.preventDefault();
          return;
        }

        if (e.touches.length === 2) {
          this.touchMode = "pinch";
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          this.pinchStartDistance = Math.max(1, Math.hypot(dx, dy));
          this.pinchStartZoom = this.activeCamera?.control?.zoom ?? 0;
          e.preventDefault();
        }
      },
      { passive: false },
    );

    app.addEventListener(
      "touchmove",
      (e: TouchEvent) => {
        if (this.getInteractiveTarget(e.target)) return;
        if (this.isCinematicActive()) {
          e.preventDefault();
          return;
        }

        if (this.touchMode === "rotate" && e.touches.length === 1) {
          this.activeCamera?.control?.moveRotate(e.touches[0].clientX, e.touches[0].clientY, 1.0);
          e.preventDefault();
          return;
        }

        if (this.touchMode === "pinch" && e.touches.length === 2) {
          const dx = e.touches[0].clientX - e.touches[1].clientX;
          const dy = e.touches[0].clientY - e.touches[1].clientY;
          const dist = Math.max(1, Math.hypot(dx, dy));
          const ratio = dist / this.pinchStartDistance;

          // Spread fingers (ratio>1) => zoom in (zoom decreases).
          // Pinch fingers (ratio<1) => zoom out (zoom increases).
          const sensitivity = 0.85;
          const targetZoom = THREE.MathUtils.clamp(
            this.pinchStartZoom + (1 / ratio - 1) * sensitivity,
            0,
            1,
          );

          const control = this.activeCamera?.control;
          if (control) control.zoom = targetZoom;

          e.preventDefault();
          return;
        }
      },
      { passive: false },
    );

    const endTouch = (e: TouchEvent) => {
      const control = this.activeCamera?.control;

      if (this.isCinematicActive()) {
        this.touchMode = "none";
        return;
      }

      if (e.touches.length === 0) {
        this.touchMode = "none";
        control?.endRotate();
        return;
      }

      // If we ended a pinch and one finger remains, continue with rotate.
      if (e.touches.length === 1) {
        this.touchMode = "rotate";
        control?.startRotate(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    app.addEventListener("touchend", endTouch, { passive: false });
    app.addEventListener("touchcancel", endTouch, { passive: false });

    this.inputBound = true;
  }

  public addCamera(
    selector: string,
    camera: THREE.PerspectiveCamera,
    control: SimpleControl,
  ): CameraManager {
    const entry: CameraEntry = { selector, camera, control };
    this.collection.push(entry);

    return this;
  }

  public removeCamera(selector: string): CameraManager {
    this.collection = this.collection.filter(entry => entry.selector !== selector);
    return this;
  }

  private toggleClasses(selector: string) {
    if (!this.cssOverlay) return;

    if (selector !== "Default") {
      this.cssOverlay.classList.remove("hideMoons");
      const marker = this.cssOverlay.querySelector<HTMLElement>(`.object.${selector}`);
      marker?.classList.add("hide");
    } else {
      this.cssOverlay.classList.add("hideMoons");
    }
  }

  public attachCssOverlay(el: HTMLElement): void {
    this.cssOverlay = el;
  }

  public switchCamera(selector: string, switchAudio = true): CameraManager {
    if (this.cssOverlay) {
      this.cssOverlay.querySelectorAll(`.object`).forEach(elem => {
        elem.classList.remove("hide");
      });
    }

    const entry = this.collection.find(entry => entry.selector === selector);

    if (!entry) {
      console.error(`Cant find camera with selector ${selector}`);
    } else {
      // Stop any drag state before switching.
      this.activeCamera?.control?.endRotate();
      this.activeCamera = entry;

      if (switchAudio) {
        SoundManager.attachToCamera(this.activeCamera.camera);
      }

      // Home view should always come up fully zoomed out.
      if (selector === "Default") {
        const control = this.activeCamera.control;
        const cam = this.activeCamera.camera;

        control.velocity.set(0, 0);

        // Start mid-ish, then ease out to zoom=1 via update()
        const mid = THREE.MathUtils.lerp(control.distanceMin, control.distanceMax, 0.55);
        cam.position.set(0, 0, mid);

        control.zoom = 1;
      } else {
        // Re-trigger the "fly out" every time a body camera is selected.
        // These cameras persist in the collection, so without resetting their starting distance,
        // the first selection animates (from z=0) but subsequent selections appear static.
        const control = this.activeCamera.control;
        const cam = this.activeCamera.camera;

        control.velocity.set(0, 0);

        const near = Math.max(0.000001, cam.near ?? 0.01);
        const startDist = Math.max(near * 2.0, control.distanceMin * 0.01);
        cam.position.set(0, 0, startDist);
      }
    }

    // Keep aspect in sync with the stage size (not the window).
    const viewport = document.getElementById("scene-root");
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      this.activeCamera.camera.aspect = w / h;
      this.activeCamera.camera.updateProjectionMatrix();
    }

    this.toggleClasses(selector);

    return this;
  }

  public getActiveEntry(): CameraEntry {
    return this.activeCamera;
  }

  public initEventControls(): CameraManager {
    this.bindInputOnce();
    return this;
  }

  public updateControls(delta: number) {
    if (this.isCinematicActive()) return;
    // Update only the active control to avoid drift and reduce work.
    this.activeCamera?.control?.update(delta);
  }
}
