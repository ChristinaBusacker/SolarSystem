import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { SIMULATION_SPEED } from "../data/settings.data";
import { AstronomicalManager } from "./manager/AstronomicalManager";
import { CameraManager } from "./manager/CameraManager";
import { CinematicDirector } from "./manager/CinematicDirector";
import { MinorBodyManager } from "./manager/minor-body-manager";
import { StarfieldManager } from "./manager/StarfieldManager";
import { UiManager } from "./ui/ui-manager";

import type { UpdateContext } from "./core/update-context";
import { SoundManager } from "./manager/SoundManager";
import { RenderPipeline } from "./rendering/render-pipeline";
import { AppRoute, router } from "./router/router";
import { ViewportService } from "./services/viewport.service";
import { registerCinematicDevtools } from "./dev/cinematic-devtools";

export class Application {
  private static instance: Application | null = null;

  public webglRenderer = new THREE.WebGLRenderer({ antialias: true });
  public cssRenderer = new CSS2DRenderer();
  public scene = new THREE.Scene();
  public timer = new THREE.Timer();

  private renderPipeline = new RenderPipeline(this.webglRenderer, this.scene);

  private viewportService: ViewportService;

  public simulationSpeed = SIMULATION_SPEED;

  // Cinematic mode applies a curated simulation speed (15 min / s) and restores on exit.
  private prevSimSpeedBeforeCinematic: number | null = null;

  public cameraManager = new CameraManager(this.scene);
  public astronomicalManager = new AstronomicalManager();
  public minorBodyManager = new MinorBodyManager();

  private cinematicDirector = new CinematicDirector({
    cameraManager: this.cameraManager,
    astronomicalManager: this.astronomicalManager,
  });

  private starfieldManager = new StarfieldManager();

  // The post-processing RenderPass camera must match the active camera.
  // We keep it in sync to avoid "offset sky" and other weirdness when switching bodies.
  private lastPipelineCamera?: THREE.Camera;

  // Scene visibility state (mirrors ui/scene-visibility-state).
  private markersVisible = true;
  private orbitsVisible = true;
  private declutterAuto = true;

  // Cheap DOM overlap handling for moon labels.
  private lastDeclutterLayoutMs = 0;
  private lastPlanetClusterLayoutMs = 0;

  private uiManager: UiManager;

  // Current selection derived from the router (used for declutter logic).
  private currentSelectedBodySlug?: string;

  // Used to detect direct navigation to /cinematic on first load.
  private firstRouteHandled = false;
  private cinematicConfirmedOnce = false;

  private constructor() {
    this.viewportService = new ViewportService({
      webglRenderer: this.webglRenderer,
      cssRenderer: this.cssRenderer,
      renderPipeline: this.renderPipeline,
      cameraManager: this.cameraManager,
      astronomicalManager: this.astronomicalManager,
    });

    this.uiManager = new UiManager({
      cssRenderer: this.cssRenderer,
      viewportService: this.viewportService,
      cameraManager: this.cameraManager,
      onSimulationSpeedChange: speed => {
        this.simulationSpeed = speed;
      },
      onSceneVisibilityChange: v => {
        this.markersVisible = v.markersVisible;
        this.orbitsVisible = v.orbitsVisible;
        this.declutterAuto = v.declutterAuto;
      },
    });
  }

  public init() {
    this.timer.connect(document);
    this.cameraManager.switchCamera("Default", false).initEventControls();
    const entry = this.cameraManager.getActiveEntry();
    SoundManager.init(entry.camera);
    SoundManager.initAmbientSound("/assets/sounds/ambient.mp3");
    SoundManager.bindVisibilityHandling({
      stopAmbientOnHidden: true,
      resumeAmbientOnVisible: true,
    });

    this.viewportService.init();
    this.viewportService.resizeNow();

    this.astronomicalManager.initObjects(this.scene, this.cameraManager);
    this.minorBodyManager.init(this.scene);
    {
      const { width, height } = this.viewportService.getViewportSize();
      this.astronomicalManager.setOrbitLineResolution(width, height);
    }
    this.initWebGLRenderer();
    this.initCSS2DRenderer();
    // Ensure renderers + camera match the final DOM size.
    this.viewportService.resizeNow();
    this.starfieldManager.init(this.scene);
    this.initSunLight();
    this.initPostProcessing();
    this.uiManager.init({
      simulationSpeed: this.simulationSpeed,
    });

    // Devtools: expose a small console API for iterating on cinematic shots without reloads.
    // Available in dev builds as `window.cine`.
    if (process.env.NODE_ENV !== "production") {
      registerCinematicDevtools(this.cinematicDirector);
    }

    setTimeout(() => {
      this.initRouter();
    }, 1000);
  }

  public initPostProcessing() {
    const { width, height } = this.viewportService.getViewportSize();
    const dpr = this.viewportService.getRenderPixelRatio();
    this.renderPipeline.init({
      camera: this.cameraManager.getActiveEntry().camera,
      width,
      height,
      dpr,
    });
  }
  public static getInstance(): Application {
    if (!Application.instance) {
      Application.instance = new Application();
    }
    return Application.instance;
  }

  private initRouter(): void {
    router.start();
    router.subscribe(r => this.applyRoute(r));
  }

  private applyRoute(route: AppRoute): void {
    const isFirst = !this.firstRouteHandled;
    this.firstRouteHandled = true;

    if (route.name === "cinematic") {
      // If the user lands directly on /cinematic, ask for confirmation.
      // (Entering cinematic mode implies sound + hiding UI state.)
      if (isFirst && !this.cinematicConfirmedOnce) {
        this.uiManager.showConfirmModal({
          title: "Cinematic mode",
          message:
            "Start a scripted camera tour with markers and orbits hidden? You can return to Overview anytime.",
          primaryLabel: "Start cinematic",
          secondaryLabel: "Back to overview",
          onPrimary: () => {
            this.cinematicConfirmedOnce = true;
            this.enterCinematicMode();
          },
          onSecondary: () => {
            router.goHome({ replace: true });
          },
        });

        // Keep the default camera active while the prompt is visible.
        this.cameraManager.switchCamera("Default");
        this.uiManager.setSelectedBodyName(undefined);
        this.currentSelectedBodySlug = undefined;
        return;
      }

      this.uiManager.hideModal();
      this.enterCinematicMode();
      return;
    }

    // Leaving cinematic mode.
    this.uiManager.hideModal();
    if (this.cinematicDirector.isActive()) this.cinematicDirector.stop();
    if (this.prevSimSpeedBeforeCinematic != null) {
      this.simulationSpeed = this.prevSimSpeedBeforeCinematic;
      this.uiManager.setSimulationSpeed(this.prevSimSpeedBeforeCinematic);
      this.prevSimSpeedBeforeCinematic = null;
    }

    // Clear cinematic body class when leaving the mode.
    document.body.classList.remove("cinematic");

    if (route.name === "home") {
      this.cameraManager.switchCamera("Default");
      this.uiManager.setSelectedBodyName(undefined);
      this.currentSelectedBodySlug = undefined;

      // Apply declutter immediately to avoid a one-frame flash of labels.
      this.astronomicalManager.applyDeclutterVisibility({
        camera: this.cameraManager.getActiveEntry().camera,
        markersVisible: this.markersVisible,
        orbitsVisible: this.orbitsVisible,
        declutterAuto: this.declutterAuto,
      });
      return;
    }

    // Body route (planet or moon).
    const bodyName = route.name === "planet" ? route.planet : route.moon;

    this.cameraManager.switchCamera(bodyName);
    this.uiManager.setSelectedBodyName(bodyName);
    this.currentSelectedBodySlug = undefined;

    // Apply declutter immediately to avoid a one-frame flash of labels.
    this.astronomicalManager.applyDeclutterVisibility({
      camera: this.cameraManager.getActiveEntry().camera,
      markersVisible: this.markersVisible,
      orbitsVisible: this.orbitsVisible,
      declutterAuto: this.declutterAuto,
    });

    // Show info panel when a body is selected.
    this.uiManager.openRightSidebar();
  }

  private enterCinematicMode(): void {
    // Store current speed once per cinematic session.
    if (this.prevSimSpeedBeforeCinematic == null) {
      this.prevSimSpeedBeforeCinematic = this.simulationSpeed;
    }

    // Set cinematic speed to real-time to keep target tracking stable, especially on mobile.
    // HudRenderer preset: secondsPerSecond / ENGINE_BASE_SECONDS => 1 / 60.
    const realtimeSpeed = 1 / 60;
    this.simulationSpeed = realtimeSpeed;
    this.uiManager.setSimulationSpeed(realtimeSpeed);

    // Add a body class so UI can adapt (hide HUD/menu items, etc.).
    document.body.classList.add("cinematic");

    this.cameraManager.switchCamera("Cinematic");
    this.uiManager.setSelectedBodyName(undefined);
    this.currentSelectedBodySlug = undefined;

    // Start the director. If called from a user gesture, it will also unlock sound.
    void this.cinematicDirector.start();
  }

  private initWebGLRenderer() {
    const { width, height } = this.viewportService.getViewportSize();

    // On HiDPI displays (almost all phones), a missing pixel ratio makes the whole scene
    // look "mushy" because the canvas gets upscaled by CSS.
    const dpr = this.viewportService.getRenderPixelRatio();
    this.webglRenderer.setPixelRatio(dpr);
    this.renderPipeline.setPixelRatio(dpr);

    // Keep the canvas styled by CSS (100% size) and only update the render buffer size here.
    this.webglRenderer.setSize(width, height, false);

    // Prevent "white flash" if rendering stalls during resizes/transitions.
    this.webglRenderer.setClearColor(0x000000, 1);

    this.webglRenderer.toneMapping = THREE.ReinhardToneMapping;
    this.webglRenderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.webglRenderer.toneMappingExposure = 1;
    document.getElementById("app").appendChild(this.webglRenderer.domElement);

    const gl = this.webglRenderer.getContext();

    // Blending aktivieren
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /**
   * DOM-based collision avoidance for CSS2D moon labels.
   *
   * This is intentionally lightweight (low frequency) and only kicks in when
   * auto-declutter is enabled.
   */
  private applyMoonLabelCollisionAvoidance(): void {
    if (!this.declutterAuto || !this.markersVisible) return;

    const now = performance.now();
    if (now - this.lastDeclutterLayoutMs < 250) return;
    this.lastDeclutterLayoutMs = now;

    const overlay = this.cssRenderer?.domElement as HTMLElement | undefined;
    if (!overlay) return;

    const toSlug = (v: string): string => (v || "").toLowerCase();
    const route: AppRoute = router.getCurrent();

    let focusSlug: string | null = null;
    let selectedMoonSlug: string | null = null;

    if (route.name === "planet") {
      focusSlug = toSlug(route.planet);
    } else if (route.name === "moon") {
      selectedMoonSlug = toSlug(route.moon);
      const moonEl = overlay.querySelector<HTMLElement>(`.object.moon.${selectedMoonSlug}`);
      if (moonEl) {
        const blacklist = new Set(["object", "moon", selectedMoonSlug]);
        const parent = Array.from(moonEl.classList).find(c => !blacklist.has(c));
        if (parent) focusSlug = parent;
      }
    } else {
      return;
    }

    if (!focusSlug) return;

    const moonEls = Array.from(
      overlay.querySelectorAll<HTMLElement>(`.object.moon.${focusSlug}:not(.hide)`),
    );

    if (moonEls.length < 2) return;

    // Reset collision hides.
    moonEls.forEach(el => el.classList.remove("hide-collide"));

    // Prefer to keep the currently selected moon visible.
    if (selectedMoonSlug) {
      moonEls.sort((a, b) => {
        const aSel = a.classList.contains(selectedMoonSlug) ? -1 : 0;
        const bSel = b.classList.contains(selectedMoonSlug) ? -1 : 0;
        return aSel - bSel;
      });
    }

    const kept: DOMRect[] = [];
    const margin = 6;
    const intersects = (a: DOMRect, b: DOMRect): boolean => {
      return !(
        a.right + margin < b.left ||
        a.left - margin > b.right ||
        a.bottom + margin < b.top ||
        a.top - margin > b.bottom
      );
    };

    for (const el of moonEls) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;

      if (kept.some(k => intersects(r, k))) {
        el.classList.add("hide-collide");
      } else {
        kept.push(r);
      }
    }
  }

  /**
   * Overview label clustering for planets + dwarf planets.
   *
   * In wide shots, inner planet labels pile up in the center. We keep the marker dots visible/clickable,
   * but hide overlapping *text* labels and append a small "+N" indicator to the kept label.
   */
  private applyPlanetLabelClustering(): void {
    if (!this.declutterAuto || !this.markersVisible) return;

    const route: AppRoute = router.getCurrent();
    if (route.name !== "home") return;

    const now = performance.now();
    if (now - this.lastPlanetClusterLayoutMs < 250) return;
    this.lastPlanetClusterLayoutMs = now;

    const overlay = this.cssRenderer?.domElement as HTMLElement | undefined;
    if (!overlay) return;

    const { width, height } = this.viewportService.getViewportSize();
    if (width < 2 || height < 2) return;

    const planetEls = Array.from(
      overlay.querySelectorAll<HTMLElement>(`.object.planet:not(.hide)`),
    );
    if (planetEls.length < 2) return;

    // Reset previous clustering state.
    for (const el of planetEls) {
      el.classList.remove("hide-label");
      const p = el.querySelector<HTMLParagraphElement>("p");
      if (!p) continue;
      const base = p.dataset.baseLabel || p.textContent || "";
      p.textContent = base;
    }

    const priorityOrder = [
      "sun",
      "mercury",
      "venus",
      "earth",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      // dwarfs (lower priority)
      "ceres",
      "pluto",
      "haumea",
      "makemake",
      "eris",
    ];
    const prio = new Map(priorityOrder.map((s, idx) => [s, idx]));

    // IMPORTANT: cluster based on the *actual text label* DOM rect, not the dot position.
    // Otherwise the label can overlap even when the dots are slightly apart.
    type Item = {
      el: HTMLElement;
      slug: string;
      prio: number;
      p: HTMLParagraphElement;
      rect: DOMRect;
    };
    const items: Item[] = [];

    for (const el of planetEls) {
      const p = el.querySelector<HTMLParagraphElement>("p");
      if (!p) continue;
      const slug = priorityOrder.find(s => el.classList.contains(s));
      if (!slug) continue;
      const r = p.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      items.push({ el, slug, prio: prio.get(slug) ?? 999, p, rect: r });
    }

    if (items.length < 2) return;
    items.sort((a, b) => a.prio - b.prio);

    const margin = 10;
    const intersects = (a: DOMRect, b: DOMRect): boolean => {
      return !(
        a.right + margin < b.left ||
        a.left - margin > b.right ||
        a.bottom + margin < b.top ||
        a.top - margin > b.bottom
      );
    };

    const clusters: Array<{ leader: Item; hiddenCount: number }> = [];

    for (const it of items) {
      const hit = clusters.find(c => intersects(it.rect, c.leader.rect));
      if (!hit) {
        clusters.push({ leader: it, hiddenCount: 0 });
        continue;
      }

      it.el.classList.add("hide-label");
      hit.hiddenCount += 1;
    }

    for (const c of clusters) {
      if (c.hiddenCount <= 0) continue;
      const p = c.leader.p;
      const base = p.dataset.baseLabel || p.textContent || "";
      p.textContent = base;
      const span = document.createElement("span");
      span.className = "cluster-count";
      span.textContent = `+${c.hiddenCount}`;
      p.appendChild(span);
    }
  }

  private initCSS2DRenderer() {
    const { width, height } = this.viewportService.getViewportSize();

    this.cssRenderer.setSize(width, height);

    this.cssRenderer.domElement.classList.add("css-renderer");
    this.cssRenderer.domElement.classList.add("markers-on");
    this.cssRenderer.domElement.classList.add("hideMoons");
    document.getElementById("app").appendChild(this.cssRenderer.domElement);

    // Allow CameraManager to toggle marker classes without importing the app singleton.
    this.cameraManager.attachCssOverlay(this.cssRenderer.domElement);
  }

  private initSunLight() {
    const sunLight = new THREE.PointLight(0xffffff, 6, 0, 2);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = false;
    this.scene.add(sunLight);

    this.scene.add(new THREE.AmbientLight(0xffffff, 2.06));
  }

  public onResize() {
    // Kept for backwards compatibility; prefer viewportService.
    this.viewportService.resizeNow();
  }

  public updateComposer(newCamera: THREE.Camera) {
    this.renderPipeline.setCamera(newCamera);
  }

  private applyCss2dLabelClustering(): void {
    // Only do aggressive clustering in the overview (no selected body).
    if (this.currentSelectedBodySlug) return;

    const overlay = this.cssRenderer?.domElement as HTMLElement | undefined;
    if (!overlay) return;

    const objs = Array.from(overlay.querySelectorAll<HTMLElement>(".object"));
    if (!objs.length) return;

    // Reset previous clustering.
    for (const el of objs) {
      el.classList.remove("is-cluster-hidden", "is-cluster-anchor");
      const p = el.querySelector<HTMLParagraphElement>("p");
      if (!p) continue;
      const base = (p.dataset.baseLabel ?? p.textContent ?? "").trim();
      if (!p.dataset.baseLabel) p.dataset.baseLabel = base;
      p.textContent = base;
    }

    type Candidate = {
      el: HTMLElement;
      p: HTMLParagraphElement;
      rect: DOMRect;
      prio: number;
    };

    const alwaysKeep = new Set([
      "Sun",
      "Mercury",
      "Venus",
      "Earth",
      "Mars",
      "Jupiter",
      "Saturn",
      "Uranus",
      "Neptune",
      "Ceres",
      "Pluto",
      "Haumea",
      "Makemake",
      "Eris",
    ]);

    const getPrio = (el: HTMLElement): number => {
      const body = el.dataset.body ?? "";
      const kind = el.dataset.kind ?? "";

      if (body === "Sun" || el.classList.contains("sun")) return 1000;

      if (kind === "planet") {
        if (
          ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"].includes(
            body,
          )
        )
          return 900;
        if (["Ceres", "Pluto", "Haumea", "Makemake", "Eris"].includes(body)) return 850;
        return 800;
      }

      if (kind === "moon") return 300;
      return 0;
    };

    const candidates: Candidate[] = [];

    for (const el of objs) {
      const body = el.dataset.body ?? "";
      if (!alwaysKeep.has(body)) continue;

      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const p = el.querySelector<HTMLParagraphElement>("p");
      if (!p) continue;

      const r = p.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;

      candidates.push({ el, p, rect: r, prio: getPrio(el) });
    }

    // Sort by priority (higher first), so we keep important labels and hide the rest.
    candidates.sort((a, b) => b.prio - a.prio);

    const margin = 10; // px padding around text rects
    const overlaps = (a: DOMRect, b: DOMRect): boolean => {
      return !(
        a.right + margin < b.left ||
        a.left - margin > b.right ||
        a.bottom + margin < b.top ||
        a.top - margin > b.bottom
      );
    };

    const kept: Candidate[] = [];
    const counts = new Map<HTMLElement, number>();

    for (const c of candidates) {
      let anchor: Candidate | undefined;
      for (const k of kept) {
        if (overlaps(c.rect, k.rect)) {
          anchor = k;
          break;
        }
      }

      if (!anchor) {
        kept.push(c);
        continue;
      }

      // Hide this label text but keep marker dot.
      c.el.classList.add("is-cluster-hidden");
      counts.set(anchor.el, (counts.get(anchor.el) ?? 0) + 1);
    }

    // Update anchor labels with +N.
    for (const k of kept) {
      const n = counts.get(k.el) ?? 0;
      if (n <= 0) continue;
      k.el.classList.add("is-cluster-anchor");
      const base = (k.p.dataset.baseLabel ?? k.p.textContent ?? "").trim();
      k.p.textContent = `${base}`;
    }
  }

  public animate() {
    const deltaTime = this.timer.getDelta();

    const camera = this.cameraManager.getActiveEntry().camera;

    const viewport = this.viewportService.getViewportSize();
    const dpr = this.viewportService.getRenderPixelRatio();

    const ctx: UpdateContext = {
      delta: deltaTime,
      simSpeed: this.simulationSpeed,
      camera,
      scene: this.scene,
      dpr,
      viewport,
    };

    // Keep post-processing cameras in sync with the active camera.
    if (camera !== this.lastPipelineCamera) {
      this.updateComposer(camera);
      this.lastPipelineCamera = camera;
    }

    // Scripted camera movement (if enabled).
    this.cinematicDirector.update(ctx);

    this.starfieldManager.update(deltaTime, camera, dpr);

    this.astronomicalManager.render(ctx);
    this.minorBodyManager.render(ctx);

    // Apply cinematic declutter rules before rendering (affects bloom + final passes).
    this.astronomicalManager.applyDeclutterVisibility({
      camera,
      markersVisible: this.markersVisible,
      orbitsVisible: this.orbitsVisible,
      declutterAuto: this.declutterAuto,
    });

    // Exclude sky from bloom pass for a clean, NASA-like look.
    this.starfieldManager.preBloom();

    this.astronomicalManager.preBloom();
    this.minorBodyManager.preBloom();
    this.renderPipeline.renderBloom(deltaTime * this.simulationSpeed);
    this.astronomicalManager.postBloom();
    this.minorBodyManager.postBloom();

    this.starfieldManager.postBloom();

    this.renderPipeline.renderFinal(deltaTime);

    this.cssRenderer.render(this.scene, camera);
    this.applyCss2dLabelClustering();

    // Cheap overlap avoidance for moon labels (only when declutter is enabled).
    // Runs at a low frequency to avoid layout thrash.
    this.applyMoonLabelCollisionAvoidance();
    this.applyPlanetLabelClustering();

    this.cameraManager.updateControls(deltaTime);

    requestAnimationFrame(() => {
      this.animate();
      this.timer.update();
    });
  }
}
