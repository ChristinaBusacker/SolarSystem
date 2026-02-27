import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { bloomRadius, bloomStrength, bloomThreshold, simulationSpeed } from "../data/settings.data";
import { AstronomicalManager } from "./manager/AstronomicalManager";
import { CameraManager } from "./manager/CameraManager";
import { MinorBodyManager } from "./manager/minor-body-manager";
import { mixPassShader } from "./shader/mixpass.shader";
import { starfieldPointsShader } from "./shader/starfield-points.shader";
import { HudRenderer } from "./ui/hud-renderer";
import { StageControlsRenderer } from "./ui/stage-controls-renderer";
import { UiRenderer } from "./ui/ui-renderer";

import { SoundManager } from "./manager/SoundManager";
import { AppRoute, router } from "./router/router";
import { openSidebar, subscribeLayoutState } from "./ui/layout-state";
import { MenuRenderer } from "./ui/menu-renderer";
import { PlanetSidebarRenderer } from "./ui/planet-sidebar-renderer";
import { subscribeSceneVisibilityState } from "./ui/scene-visibility-state";

export class Application {
  private static instance: Application | null = null;

  public webglRenderer = new THREE.WebGLRenderer({ antialias: true });
  public cssRenderer = new CSS2DRenderer();
  public scene = new THREE.Scene();
  public clock = new THREE.Clock();

  public bloomComposer = new EffectComposer(this.webglRenderer);
  public finalComposer = new EffectComposer(this.webglRenderer);

  private smaaPass?: SMAAPass;

  public simulationSpeed = simulationSpeed;

  public cameraManager = new CameraManager(this.scene);
  public astronomicalManager = new AstronomicalManager();
  public minorBodyManager = new MinorBodyManager();

  // Procedural starfield (kept out of bloom for a clean look)
  private starfield?: THREE.Points;
  private starfieldMaterial?: THREE.ShaderMaterial;

  private readonly tmpWorldPos = new THREE.Vector3();

  // The post-processing RenderPass camera must match the active camera.
  // We keep it in sync to avoid "offset sky" and other weirdness when switching bodies.
  private lastComposerCamera?: THREE.Camera;

  // Container size (scene-root).
  private lastViewportSize: { width: number; height: number } = {
    width: 0,
    height: 0,
  };

  // Actual WebGL render-buffer size (we avoid re-allocations during sidebar transitions).
  private lastRenderSize: { width: number; height: number } = {
    width: 0,
    height: 0,
  };

  private lastDevicePixelRatio = 1;

  // Scene visibility state (mirrors ui/scene-visibility-state).
  private markersVisible = true;
  private orbitsVisible = true;
  private declutterAuto = true;

  // Cheap DOM overlap handling for moon labels.
  private lastDeclutterLayoutMs = 0;
  private lastPlanetClusterLayoutMs = 0;

  private isLayoutTransitioning = false;
  private resizeScheduled = false;
  private transitionResizeTimer: number | null = null;
  private lastLayoutKey: string | null = null;
  private viewportObserver: ResizeObserver | null = null;

  private uiRight?: UiRenderer;
  private menuRenderer?: MenuRenderer;

  // Current selection derived from the router (used for declutter logic).
  private currentSelectedBodySlug?: string;

  private constructor() {
    window.addEventListener("resize", () => this.scheduleResize());

    window.addEventListener("ui:speedChange", (e: Event) => {
      const ce = e as CustomEvent<{ speed: number }>;
      if (ce.detail?.speed != null) this.simulationSpeed = ce.detail.speed;
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

    const activeEntry = this.cameraManager.getActiveEntry();
    const control = activeEntry?.control;
    if (!control) return;

    const step = 0.075;
    const signedStep = direction === "in" ? -step : step;
    control.zoom = THREE.MathUtils.clamp(control.zoom + signedStep, 0, 1);
  };

  public init() {
    this.cameraManager.switchCamera("Default", false).initEventControls();
    const entry = this.cameraManager.getActiveEntry();
    SoundManager.init(entry.camera);
    SoundManager.initAmbientSound("/assets/sounds/ambient.mp3");
    SoundManager.bindVisibilityHandling({
      stopAmbientOnHidden: true,
      resumeAmbientOnVisible: true,
    });
    this.attachViewportResizeObserver();
    this.onResize();
    this.astronomicalManager.initObjects(this.scene);
    this.minorBodyManager.init(this.scene);
    {
      const { width, height } = this.getViewportSize();
      this.astronomicalManager.setOrbitLineResolution(width, height);
    }
    this.initWebGLRenderer();
    this.initCSS2DRenderer();
    this.initBackground();
    this.initSunLight();
    this.initPostProcessing();
    this.initUi();
    setTimeout(() => {
      this.initRouter();
    }, 1000);
  }

  public initPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.cameraManager.getActiveEntry().camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.getViewportSize().width, this.getViewportSize().height),
      bloomStrength,
      bloomRadius,
      bloomThreshold,
    );

    this.bloomComposer.addPass(renderScene);
    this.bloomComposer.addPass(bloomPass);
    this.bloomComposer.renderToScreen = false;

    const { vertexShader, fragmentShader } = mixPassShader;

    const mixPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture },
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        defines: {},
      }),
      "baseTexture",
    );
    mixPass.needsSwap = true;

    const outputPass = new OutputPass();

    // SMAA helps smooth thin lines (orbits) when rendering through EffectComposer
    const { width, height } = this.getViewportSize();
    const dpr = this.getRenderPixelRatio();
    this.smaaPass = new SMAAPass();
    // SMAA expects pixel sizes.
    this.smaaPass.setSize(Math.floor(width * dpr), Math.floor(height * dpr));

    this.finalComposer.addPass(renderScene);
    this.finalComposer.addPass(mixPass);
    this.finalComposer.addPass(this.smaaPass);
    this.finalComposer.addPass(outputPass);

    // Ensure the composers start with correct DPI-scaled buffers.
    this.bloomComposer.setPixelRatio?.(dpr);
    this.finalComposer.setPixelRatio?.(dpr);
    this.bloomComposer.setSize(width, height);
    this.finalComposer.setSize(width, height);
  }
  public static getInstance(): Application {
    if (!Application.instance) {
      Application.instance = new Application();
    }
    return Application.instance;
  }

  private initUi() {
    const stageControlsSlot = document.querySelector<HTMLElement>(
      '#ui-root [data-slot="stage-controls"]',
    );

    if (stageControlsSlot) {
      new StageControlsRenderer(stageControlsSlot).init();
    }

    const uiSlotHud = document.querySelector<HTMLElement>('#ui-root [data-slot="hud"]');

    const menuSlot = document.querySelector<HTMLElement>('#ui-root [data-slot="menu"]');

    if (uiSlotHud) {
      new HudRenderer(uiSlotHud, {
        bodyName: "None",
        simulationSpeed: this.simulationSpeed,
        paused: this.simulationSpeed <= 0,
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

    if (menuSlot) {
      this.menuRenderer = new MenuRenderer(menuSlot);
    }

    const uiLeftSidebarSlot = document.querySelector<HTMLElement>("#sidebar-left-slot");
    if (uiLeftSidebarSlot) {
      new PlanetSidebarRenderer(uiLeftSidebarSlot).init();
    }

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
        this.resizeDuringTransition(280);
      }
      this.lastLayoutKey = key;
    });

    // Scene visibility toggles (markers/orbits)
    subscribeSceneVisibilityState(v => {
      const overlay = this.cssRenderer?.domElement as HTMLElement | undefined;
      if (overlay) {
        overlay.classList.toggle("markers-off", !v.markersVisible);
        overlay.classList.toggle("markers-on", v.markersVisible);
      }

      // Mirror state for per-frame declutter rules.
      this.markersVisible = v.markersVisible;
      this.orbitsVisible = v.orbitsVisible;
      this.declutterAuto = v.declutterAuto;
    });
  }

  private initRouter(): void {
    router.start();
    router.subscribe(r => this.applyRoute(r));
  }

  private applyRoute(route: AppRoute): void {
    if (route.name === "home") {
      this.cameraManager.switchCamera("Default");
      this.uiRight?.setSelectedBodyName(undefined);
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
    this.uiRight?.setSelectedBodyName(bodyName);
    this.currentSelectedBodySlug = undefined;

    // Apply declutter immediately to avoid a one-frame flash of labels.
    this.astronomicalManager.applyDeclutterVisibility({
      camera: this.cameraManager.getActiveEntry().camera,
      markersVisible: this.markersVisible,
      orbitsVisible: this.orbitsVisible,
      declutterAuto: this.declutterAuto,
    });

    // Show info panel when a body is selected.
    openSidebar("right");
  }

  private initWebGLRenderer() {
    const { width, height } = this.getViewportSize();

    // On HiDPI displays (almost all phones), a missing pixel ratio makes the whole scene
    // look "mushy" because the canvas gets upscaled by CSS.
    this.lastDevicePixelRatio = this.getRenderPixelRatio();
    this.webglRenderer.setPixelRatio(this.lastDevicePixelRatio);
    this.bloomComposer.setPixelRatio?.(this.lastDevicePixelRatio);
    this.finalComposer.setPixelRatio?.(this.lastDevicePixelRatio);

    // Keep the canvas styled by CSS (100% size) and only update the render buffer size here.
    this.webglRenderer.setSize(width, height, false);
    this.lastRenderSize = { width, height };

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

    const { width, height } = this.getViewportSize();
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

  private getRenderPixelRatio(): number {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  private initCSS2DRenderer() {
    const { width, height } = this.getViewportSize();

    this.cssRenderer.setSize(width, height);

    this.cssRenderer.domElement.classList.add("css-renderer");
    this.cssRenderer.domElement.classList.add("markers-on");
    this.cssRenderer.domElement.classList.add("hideMoons");
    document.getElementById("app").appendChild(this.cssRenderer.domElement);
  }

  private initBackground(): void {
    // Replace large HDR/EXR env maps with a lightweight procedural starfield.
    // Using THREE.Points keeps stars crisp (no blocky artifacts) and is stable on mobile.

    const uniforms = THREE.UniformsUtils.clone(starfieldPointsShader.uniforms || {});
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: starfieldPointsShader.vertexShader,
      fragmentShader: starfieldPointsShader.fragmentShader,
      // Important: keep the starfield out of the "transparent" render list.
      // Otherwise it gets drawn *after* planets/orbits and can look like it shines through.
      transparent: false,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    mat.toneMapped = false;

    // Deterministic RNG so the sky doesn't "change" per reload.
    const mulberry32 = (seed: number) => {
      return () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const rng = mulberry32(1337);

    // Star budget: dense enough to feel "NASA-like" but still cheap.
    const isCoarsePointer =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    const smallCount = isCoarsePointer ? 22000 : 42000;
    const bigCount = isCoarsePointer ? 800 : 1400;
    const total = smallCount + bigCount;

    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const sizes = new Float32Array(total);
    const alphas = new Float32Array(total);

    const galaxyAxis = new THREE.Vector3(0.0, 0.35, 0.94).normalize();
    const galaxySigma = 0.22; // lower = tighter band

    const sampleDirection = (): THREE.Vector3 => {
      // Uniform direction on sphere
      const u = rng();
      const v = rng();
      const z = 2.0 * u - 1.0;
      const t = 2.0 * Math.PI * v;
      const r = Math.sqrt(Math.max(0, 1.0 - z * z));
      return new THREE.Vector3(r * Math.cos(t), z, r * Math.sin(t));
    };

    const sampleColor = (r: number): THREE.Color => {
      if (r < 0.06) return new THREE.Color(0.55, 0.7, 1.0);
      if (r < 0.16) return new THREE.Color(0.7, 0.82, 1.0);
      if (r < 0.62) return new THREE.Color(1.0, 1.0, 1.0);
      if (r < 0.88) return new THREE.Color(1.0, 0.92, 0.76);
      return new THREE.Color(1.0, 0.75, 0.52);
    };

    let i = 0;
    const writeStar = (dir: THREE.Vector3, sizePx: number, alpha: number, color: THREE.Color) => {
      positions[i * 3 + 0] = dir.x;
      positions[i * 3 + 1] = dir.y;
      positions[i * 3 + 2] = dir.z;

      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = sizePx;
      alphas[i] = alpha;
      i += 1;
    };

    while (i < smallCount) {
      const dir = sampleDirection();

      const dot = Math.abs(dir.dot(galaxyAxis));
      const band = Math.exp(-(dot * dot) / (2 * galaxySigma * galaxySigma));
      const accept = 0.22 + 0.78 * band;
      if (rng() > accept) continue;

      const base = 0.85 + 0.15 * rng();
      const alpha = (0.18 + 0.82 * Math.pow(rng(), 2.2)) * base;
      const size = 0.9 + 1.6 * Math.pow(rng(), 1.8);
      const c = sampleColor(rng());

      c.lerp(new THREE.Color(1, 1, 1), 0.35);

      writeStar(dir, size, alpha, c);
    }

    while (i < total) {
      const dir = sampleDirection();
      const dot = Math.abs(dir.dot(galaxyAxis));
      const band = Math.exp(-(dot * dot) / (2 * (galaxySigma * 1.15) * (galaxySigma * 1.15)));
      const accept = 0.35 + 0.65 * band;
      if (rng() > accept) continue;

      const alpha = 0.65 + 0.55 * Math.pow(rng(), 0.8);
      const size = 2.2 + 4.8 * Math.pow(rng(), 1.4);
      const c = sampleColor(rng());
      writeStar(dir, size, alpha, c);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

    const stars = new THREE.Points(geo, mat);
    stars.frustumCulled = false;
    stars.renderOrder = -1000;

    stars.scale.setScalar(5000);
    this.scene.add(stars);

    this.starfield = stars;
    this.starfieldMaterial = mat;

    this.scene.background = null;
    this.scene.environment = null;
  }

  private initSunLight() {
    const sunLight = new THREE.PointLight(0xffffff, 6, 0, 2);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = false;
    this.scene.add(sunLight);

    this.scene.add(new THREE.AmbientLight(0xffffff, 2.06));
  }

  public onResize() {
    const { width, height } = this.getViewportSize();

    if (width < 2 || height < 2) return;
    if (width === this.lastViewportSize.width && height === this.lastViewportSize.height) return;
    this.lastViewportSize = { width, height };

    const activeCamera = this.cameraManager.getActiveEntry().camera;

    const dpr = this.getRenderPixelRatio();
    if (dpr !== this.lastDevicePixelRatio) {
      this.lastDevicePixelRatio = dpr;
      this.webglRenderer.setPixelRatio(dpr);
      this.bloomComposer.setPixelRatio?.(dpr);
      this.finalComposer.setPixelRatio?.(dpr);
      this.lastRenderSize = { width: 0, height: 0 };
    }

    this.cssRenderer.setSize(width, height);
    this.astronomicalManager.setOrbitLineResolution(width, height);

    activeCamera.aspect = width / height;
    activeCamera.updateProjectionMatrix();

    if (this.isLayoutTransitioning) return;

    if (width === this.lastRenderSize.width && height === this.lastRenderSize.height) return;
    this.lastRenderSize = { width, height };

    this.webglRenderer.setSize(width, height, false);
    this.bloomComposer.setSize(width, height);
    this.finalComposer.setSize(width, height);
    // SMAA expects pixel sizes, not CSS sizes.
    this.smaaPass?.setSize(Math.floor(width * dpr), Math.floor(height * dpr));
  }

  private getViewportSize(): { width: number; height: number } {
    const viewport = document.getElementById("scene-root");
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

  private scheduleResize(): void {
    if (this.resizeScheduled) return;
    this.resizeScheduled = true;
    requestAnimationFrame(() => {
      this.resizeScheduled = false;
      this.onResize();
    });
  }

  private resizeDuringTransition(durationMs: number): void {
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
          // First update camera/CSS2D.
          this.scheduleResize();
          // Then resize heavy WebGL buffers once.
          const { width, height } = this.getViewportSize();
          const dpr = this.getRenderPixelRatio();
          if (dpr !== this.lastDevicePixelRatio) {
            this.lastDevicePixelRatio = dpr;
            this.webglRenderer.setPixelRatio(dpr);
            this.bloomComposer.setPixelRatio?.(dpr);
            this.finalComposer.setPixelRatio?.(dpr);
          }
          this.lastRenderSize = { width: 0, height: 0 };
          this.webglRenderer.setSize(width, height, false);
          this.bloomComposer.setSize(width, height);
          this.finalComposer.setSize(width, height);
          this.smaaPass?.setSize(Math.floor(width * dpr), Math.floor(height * dpr));
          this.lastRenderSize = { width, height };
        }, 60);
      }
    }, interval);
  }

  private attachViewportResizeObserver(): void {
    const viewport = document.getElementById("scene-root");
    if (!viewport || typeof ResizeObserver === "undefined") return;

    this.viewportObserver?.disconnect();
    this.viewportObserver = new ResizeObserver(() => {
      this.scheduleResize();
    });

    this.viewportObserver.observe(viewport);
  }

  public updateComposer(newCamera: THREE.Camera) {
    [this.bloomComposer, this.finalComposer].forEach(composer => {
      composer.passes.forEach(pass => {
        if (pass instanceof RenderPass) {
          pass.camera = newCamera;
        }
      });
    });
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
    const deltaTime = this.clock.getDelta();
    const camera = this.cameraManager.getActiveEntry().camera;

    // Keep post-processing cameras in sync with the active camera.
    if (camera !== this.lastComposerCamera) {
      this.updateComposer(camera);
      this.lastComposerCamera = camera;
    }

    // Keep starfield centered on the *render camera* and always inside the frustum.
    if (this.starfield) {
      camera.getWorldPosition(this.tmpWorldPos);
      this.starfield.position.copy(this.tmpWorldPos);

      // Don't scale the starfield with huge far planes (some cameras go up to ~90M).
      // Extremely large radii hurt precision and can cause artifacts.
      const far = camera.far ?? 5000;
      const desiredRadius = Math.min(5000, Math.max(200, far * 0.95));
      this.starfield.scale.setScalar(desiredRadius);
    }
    if (this.starfieldMaterial?.uniforms?.uTime) {
      this.starfieldMaterial.uniforms.uTime.value += deltaTime;
    }
    if (this.starfieldMaterial?.uniforms?.uPixelRatio) {
      this.starfieldMaterial.uniforms.uPixelRatio.value = this.lastDevicePixelRatio;
    }

    this.astronomicalManager.render(deltaTime, camera, this.scene);
    this.minorBodyManager.render(deltaTime);

    // Apply cinematic declutter rules before rendering (affects bloom + final passes).
    this.astronomicalManager.applyDeclutterVisibility({
      camera,
      markersVisible: this.markersVisible,
      orbitsVisible: this.orbitsVisible,
      declutterAuto: this.declutterAuto,
    });

    // Exclude sky from bloom pass for a clean, NASA-like look.
    if (this.starfield) this.starfield.visible = false;

    this.astronomicalManager.preBloom();
    this.minorBodyManager.preBloom();
    this.bloomComposer.render(deltaTime * this.simulationSpeed);
    this.astronomicalManager.postBloom();
    this.minorBodyManager.postBloom();

    if (this.starfield) this.starfield.visible = true;

    this.finalComposer.render(deltaTime);

    this.cssRenderer.render(this.scene, camera);
    this.applyCss2dLabelClustering();

    // Cheap overlap avoidance for moon labels (only when declutter is enabled).
    // Runs at a low frequency to avoid layout thrash.
    this.applyMoonLabelCollisionAvoidance();
    this.applyPlanetLabelClustering();

    this.cameraManager.updateControls(deltaTime);

    requestAnimationFrame(() => {
      this.animate();
    });
  }
}
