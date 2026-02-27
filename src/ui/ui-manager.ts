import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";

import { CameraManager } from "../manager/CameraManager";
import { router } from "../router/router";
import { ViewportService } from "../services/viewport.service";
import { HudRenderer } from "./hud-renderer";
import { openSidebar, subscribeLayoutState } from "./layout-state";
import { MenuRenderer } from "./menu-renderer";
import { PlanetSidebarRenderer } from "./planet-sidebar-renderer";
import { SceneVisibilityState, subscribeSceneVisibilityState } from "./scene-visibility-state";
import { StageControlsRenderer } from "./stage-controls-renderer";
import { UiRenderer } from "./ui-renderer";

export type UiManagerDeps = {
  cssRenderer: CSS2DRenderer;
  viewportService: ViewportService;
  cameraManager: CameraManager;
  onSimulationSpeedChange: (speed: number) => void;
  onSceneVisibilityChange: (state: SceneVisibilityState) => void;
};

export type UiManagerInit = {
  simulationSpeed: number;
};

/**
 * Owns DOM/UI bootstrap and UI-specific event wiring.
 *
 * Why this lives in `src/ui/` (not `src/manager/`):
 * - It directly touches DOM nodes + CSS classes and instantiates DOM renderers.
 * - Scene managers focus on 3D world state; this focuses on HTML/UI state.
 */
export class UiManager {
  private readonly deps: UiManagerDeps;

  private uiRight?: UiRenderer;
  private hud?: HudRenderer;
  private menu?: MenuRenderer;

  private lastLayoutKey: string | null = null;

  public constructor(deps: UiManagerDeps) {
    this.deps = deps;
  }

  public init(opts: UiManagerInit): void {
    this.bindGlobalUiEvents();
    this.mountRenderers(opts);
    this.bindLayoutState();
    this.bindSceneVisibilityState();
  }

  public setSelectedBodyName(name?: string): void {
    this.uiRight?.setSelectedBodyName(name);
    if (name) this.hud?.setSelectedBodyName(name);
  }

  public openRightSidebar(): void {
    openSidebar("right");
  }

  private mountRenderers(opts: UiManagerInit): void {
    const stageControlsSlot = document.querySelector<HTMLElement>(
      '#ui-root [data-slot="stage-controls"]',
    );
    if (stageControlsSlot) {
      new StageControlsRenderer(stageControlsSlot).init();
    }

    const hudSlot = document.querySelector<HTMLElement>('#ui-root [data-slot="hud"]');
    if (hudSlot) {
      this.hud = new HudRenderer(hudSlot, {
        bodyName: "None",
        simulationSpeed: opts.simulationSpeed,
        paused: opts.simulationSpeed <= 0,
        orbitsVisible: {
          planets: true,
          moons: true,
        },
        markersVisible: true,
      });
    }

    const uiRightSidebarSlot = document.querySelector<HTMLElement>("#sidebar-right-slot");
    if (uiRightSidebarSlot) {
      this.uiRight = new UiRenderer(uiRightSidebarSlot, {
        hideMoons: false,
        hidePlanets: false,
      });
      this.uiRight.init();
    }

    const menuSlot = document.querySelector<HTMLElement>('#ui-root [data-slot="menu"]');
    if (menuSlot) {
      this.menu = new MenuRenderer(menuSlot);
      this.menu.init();
    }

    const uiLeftSidebarSlot = document.querySelector<HTMLElement>("#sidebar-left-slot");
    if (uiLeftSidebarSlot) {
      new PlanetSidebarRenderer(uiLeftSidebarSlot).init();
    }
  }

  private bindLayoutState(): void {
    // Apply open/close state to both sidebars and resize smoothly during transitions.
    subscribeLayoutState(s => {
      const leftRoot = document.getElementById("sidebar-left-root");
      const rightRoot = document.getElementById("sidebar-right-root");

      if (leftRoot) {
        leftRoot.classList.toggle("is-open", s.leftOpen);
        leftRoot.classList.toggle("is-closed", !s.leftOpen);
      }
      if (rightRoot) {
        rightRoot.classList.toggle("is-open", s.rightOpen);
        rightRoot.classList.toggle("is-closed", !s.rightOpen);
      }

      const key = `${s.leftOpen ? 1 : 0}${s.rightOpen ? 1 : 0}`;
      if (this.lastLayoutKey !== null && this.lastLayoutKey !== key) {
        this.deps.viewportService.resizeDuringTransition(280);
      }
      this.lastLayoutKey = key;
    });
  }

  private bindSceneVisibilityState(): void {
    subscribeSceneVisibilityState(v => {
      const overlay = this.deps.cssRenderer.domElement as HTMLElement | undefined;
      if (overlay) {
        overlay.classList.toggle("markers-off", !v.markersVisible);
        overlay.classList.toggle("markers-on", v.markersVisible);
      }

      this.deps.onSceneVisibilityChange(v);
      this.hud?.setMarkersVisible(v.markersVisible);
      this.hud?.setOrbitVisibility({ planets: v.orbitsVisible, moons: v.orbitsVisible });
    });
  }

  private bindGlobalUiEvents(): void {
    window.addEventListener("ui:speedChange", (e: Event) => {
      const ce = e as CustomEvent<{ speed: number }>;
      const speed = ce.detail?.speed;
      if (speed == null) return;
      this.deps.onSimulationSpeedChange(speed);
      this.hud?.setSimulationSpeed(speed);
    });

    window.addEventListener("ui:zoom-step", this.handleUiZoomStep as EventListener);

    window.addEventListener("ui:select-body", (e: Event) => {
      const ce = e as CustomEvent<{ name: string; kind: "planet" | "moon" }>;
      const name = ce.detail?.name;
      const kind = ce.detail?.kind;
      if (!name || !kind) return;
      if (kind === "moon") router.goMoon(name);
      else router.goPlanet(name);
    });
  }

  private readonly handleUiZoomStep = (e: Event): void => {
    const ce = e as CustomEvent<{ direction?: "in" | "out" }>;
    const direction = ce.detail?.direction;
    if (direction !== "in" && direction !== "out") return;

    const activeEntry = this.deps.cameraManager.getActiveEntry();
    const control = activeEntry?.control;
    if (!control) return;

    const step = 0.075;
    const signedStep = direction === "in" ? -step : step;
    control.zoom = THREE.MathUtils.clamp(control.zoom + signedStep, 0, 1);
  };
}
