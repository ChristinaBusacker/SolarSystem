import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";

import { AstronomicalManager } from "../manager/AstronomicalManager";
import { CameraManager } from "../manager/CameraManager";
import { RenderPipeline } from "../rendering/render-pipeline";

export type ViewportSize = { width: number; height: number };

export type ViewportServiceOptions = {
  viewportElementId?: string;
  maxDevicePixelRatio?: number;
};

/**
 * Owns viewport measuring + resize scheduling.
 *
 * This keeps Application focused on orchestration rather than DOM sizing details.
 * Behavior is intentionally conservative (no feature change).
 */
export class ViewportService {
  private lastViewportSize: ViewportSize = { width: 0, height: 0 };

  private lastRenderSize: ViewportSize = { width: 0, height: 0 };

  private lastDevicePixelRatio = 1;

  private isLayoutTransitioning = false;
  private resizeScheduled = false;
  private transitionResizeTimer: number | null = null;
  private viewportObserver: ResizeObserver | null = null;

  private readonly viewportElementId: string;
  private readonly maxDevicePixelRatio: number;

  public constructor(
    private readonly deps: {
      webglRenderer: THREE.WebGLRenderer;
      cssRenderer: CSS2DRenderer;
      renderPipeline: RenderPipeline;
      cameraManager: CameraManager;
      astronomicalManager: AstronomicalManager;
    },
    opts: ViewportServiceOptions = {},
  ) {
    this.viewportElementId = opts.viewportElementId ?? "scene-root";
    this.maxDevicePixelRatio = opts.maxDevicePixelRatio ?? 2;
  }

  private readonly handleWindowResize = (): void => {
    this.scheduleResize();
  };

  public init(): void {
    window.addEventListener("resize", this.handleWindowResize);
    this.attachViewportResizeObserver();
  }

  public destroy(): void {
    window.removeEventListener("resize", this.handleWindowResize);
    this.viewportObserver?.disconnect();
    this.viewportObserver = null;

    if (this.transitionResizeTimer != null) {
      window.clearInterval(this.transitionResizeTimer);
      this.transitionResizeTimer = null;
    }
  }

  public getRenderPixelRatio(): number {
    return Math.min(window.devicePixelRatio || 1, this.maxDevicePixelRatio);
  }

  public getViewportSize(): ViewportSize {
    const viewport = document.getElementById(this.viewportElementId);
    if (!viewport) {
      return { width: window.innerWidth, height: window.innerHeight };
    }

    const rect = viewport.getBoundingClientRect();
    // Guard against 0 sizes during early init.
    return {
      width: Math.max(1, Math.floor(rect.width)),
      height: Math.max(1, Math.floor(rect.height)),
    };
  }

  public scheduleResize(): void {
    if (this.resizeScheduled) return;
    this.resizeScheduled = true;
    requestAnimationFrame(() => {
      this.resizeScheduled = false;
      this.onResize(false);
    });
  }

  public resizeNow(): void {
    this.onResize(true);
  }

  public resizeDuringTransition(durationMs: number): void {
    // Calling onResize every frame can cause flicker on some GPUs.
    // Instead, update a few times during the CSS transition.
    if (this.transitionResizeTimer != null) {
      window.clearInterval(this.transitionResizeTimer);
      this.transitionResizeTimer = null;
    }

    const steps = 7;
    const interval = Math.max(20, Math.floor(Math.max(0, durationMs) / steps));
    let i = 0;

    this.isLayoutTransitioning = true;
    this.scheduleResize();

    this.transitionResizeTimer = window.setInterval(() => {
      this.scheduleResize();
      i += 1;
      if (i >= steps) {
        if (this.transitionResizeTimer != null) window.clearInterval(this.transitionResizeTimer);
        this.transitionResizeTimer = null;

        // Final snap to exact size at the end of the transition.
        window.setTimeout(() => {
          this.isLayoutTransitioning = false;

          // First update camera + CSS2D.
          this.scheduleResize();

          // Then resize heavy WebGL buffers once.
          const { width, height } = this.getViewportSize();
          const dpr = this.getRenderPixelRatio();
          if (dpr !== this.lastDevicePixelRatio) {
            this.lastDevicePixelRatio = dpr;
            this.deps.webglRenderer.setPixelRatio(dpr);
            this.deps.renderPipeline.setPixelRatio(dpr);
          }

          this.lastRenderSize = { width: 0, height: 0 };
          this.deps.webglRenderer.setSize(width, height, false);
          this.deps.renderPipeline.setSize(width, height);
          this.lastRenderSize = { width, height };
        }, 60);
      }
    }, interval);
  }

  private onResize(force: boolean): void {
    const { width, height } = this.getViewportSize();

    if (width < 2 || height < 2) return;
    if (!force && width === this.lastViewportSize.width && height === this.lastViewportSize.height) return;
    this.lastViewportSize = { width, height };

    const activeCamera = this.deps.cameraManager.getActiveEntry().camera;

    const dpr = this.getRenderPixelRatio();
    if (dpr !== this.lastDevicePixelRatio) {
      this.lastDevicePixelRatio = dpr;
      this.deps.webglRenderer.setPixelRatio(dpr);
      this.deps.renderPipeline.setPixelRatio(dpr);
      this.lastRenderSize = { width: 0, height: 0 };
    }

    this.deps.cssRenderer.setSize(width, height);
    this.deps.astronomicalManager.setOrbitLineResolution(width, height);

    activeCamera.aspect = width / height;
    activeCamera.updateProjectionMatrix();

    if (this.isLayoutTransitioning) return;

    if (!force && width === this.lastRenderSize.width && height === this.lastRenderSize.height) return;
    this.lastRenderSize = { width, height };

    this.deps.webglRenderer.setSize(width, height, false);
    this.deps.renderPipeline.setSize(width, height);
  }

  private attachViewportResizeObserver(): void {
    const viewport = document.getElementById(this.viewportElementId);
    if (!viewport || typeof ResizeObserver === "undefined") return;

    this.viewportObserver?.disconnect();
    this.viewportObserver = new ResizeObserver(() => {
      this.scheduleResize();
    });

    this.viewportObserver.observe(viewport);
  }
}
