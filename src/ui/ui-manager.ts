import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";

import { CameraManager } from "../manager/CameraManager";
import { ViewportService } from "../services/viewport.service";
import { HudRenderer } from "./hud-renderer";
import { openSidebar, subscribeLayoutState } from "./layout-state";
import { MenuRenderer } from "./menu-renderer";
import { PlanetSidebarRenderer } from "./planet-sidebar-renderer";
import { SceneVisibilityState, subscribeSceneVisibilityState } from "./scene-visibility-state";
import { StageControlsRenderer } from "./stage-controls-renderer";
import { UiActions, createSceneToggleActions } from "./ui-actions";
import { UiRenderer } from "./ui-renderer";
import { escapeHtml } from "./template";

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

  private readonly actions: UiActions;

  private uiRight?: UiRenderer;
  private hud?: HudRenderer;
  private menu?: MenuRenderer;

  private modalSlot?: HTMLElement;
  private modalRoot?: HTMLElement;

  private lastLayoutKey: string | null = null;

  public constructor(deps: UiManagerDeps) {
    this.deps = deps;

    this.actions = {
      ...createSceneToggleActions(),
      setSimulationSpeed: speed => {
        this.deps.onSimulationSpeedChange(speed);
        this.hud?.setSimulationSpeed(speed);
      },
      zoomStep: direction => {
        const activeEntry = this.deps.cameraManager.getActiveEntry();
        const control = activeEntry?.control;
        if (!control) return;

        const step = 0.075;
        const signedStep = direction === "in" ? -step : step;
        control.zoom = THREE.MathUtils.clamp(control.zoom + signedStep, 0, 1);
      },
    };
  }

  public init(opts: UiManagerInit): void {
    this.mountRenderers(opts);
    this.bindLayoutState();
    this.bindSceneVisibilityState();
  }

  public showConfirmModal(opts: {
    title: string;
    message: string;
    primaryLabel: string;
    secondaryLabel: string;
    onPrimary: () => void;
    onSecondary: () => void;
  }): void {
    if (!this.modalSlot) return;

    this.hideModal();

    const root = document.createElement("div");
    root.className = "ui-modal-backdrop";
    root.innerHTML = `
      <div class="ui-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(opts.title)}">
        <h3 class="ui-modal__title">${escapeHtml(opts.title)}</h3>
        <p class="ui-modal__text">${escapeHtml(opts.message)}</p>
        <div class="ui-modal__actions">
          <button class="ui-btn ui-btn--primary" type="button" data-action="primary">${escapeHtml(
            opts.primaryLabel,
          )}</button>
          <button class="ui-btn ui-btn--ghost" type="button" data-action="secondary">${escapeHtml(
            opts.secondaryLabel,
          )}</button>
        </div>
      </div>
    `;

    const click = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const primary = target?.closest<HTMLElement>("[data-action='primary']");
      const secondary = target?.closest<HTMLElement>("[data-action='secondary']");

      if (primary) {
        e.stopPropagation();
        this.hideModal();
        opts.onPrimary();
        return;
      }

      if (secondary || target === root) {
        e.stopPropagation();
        this.hideModal();
        opts.onSecondary();
      }
    };

    root.addEventListener("click", click);

    this.modalSlot.appendChild(root);
    this.modalRoot = root;
  }

  public hideModal(): void {
    if (!this.modalRoot) return;
    try {
      this.modalRoot.remove();
    } catch {
      // ignore
    }
    this.modalRoot = undefined;
  }

  public setSelectedBodyName(name?: string): void {
    this.uiRight?.setSelectedBodyName(name);
    if (name) this.hud?.setSelectedBodyName(name);
  }

  /**
   * Programmatically adjust simulation speed.
   *
   * This intentionally goes through the same code path as UI interactions:
   * - Updates the app-level speed via the injected callback
   * - Syncs the HUD slider/label
   */
  public setSimulationSpeed(speed: number): void {
    this.deps.onSimulationSpeedChange(speed);
    this.hud?.setSimulationSpeed(speed);
  }

  public openRightSidebar(): void {
    openSidebar("right");
  }

  private mountRenderers(opts: UiManagerInit): void {
    const stageControlsSlot = document.querySelector<HTMLElement>(
      '#ui-root [data-slot="stage-controls"]',
    );
    if (stageControlsSlot) {
      new StageControlsRenderer(stageControlsSlot, this.actions).init();
    }

    const hudSlot = document.querySelector<HTMLElement>('#ui-root [data-slot="hud"]');
    if (hudSlot) {
      this.hud = new HudRenderer(
        hudSlot,
        {
          bodyName: "None",
          simulationSpeed: opts.simulationSpeed,
          paused: opts.simulationSpeed <= 0,
          orbitsVisible: {
            planets: true,
            moons: true,
          },
          markersVisible: true,
        },
        this.actions,
      );
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
      this.menu = new MenuRenderer(menuSlot, this.actions);
      this.menu.init();
    }

    const uiLeftSidebarSlot = document.querySelector<HTMLElement>("#sidebar-left-slot");
    if (uiLeftSidebarSlot) {
      new PlanetSidebarRenderer(uiLeftSidebarSlot).init();
    }

    this.modalSlot =
      document.querySelector<HTMLElement>('#ui-root [data-slot="modal"]') ?? undefined;
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

  // NOTE: This class intentionally does not listen to `window` CustomEvents.
  // UI components call the typed `UiActions` surface instead.
}
