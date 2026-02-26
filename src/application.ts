import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { CameraManager } from "./manager/CameraManager";
import { AstronomicalManager } from "./manager/AstronomicalManager";
import { MinorBodyManager } from "./manager/minor-body-manager";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import {
  bloomThreshold,
  bloomStrength,
  bloomRadius,
  simulationSpeed,
} from "../data/settings.data";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { mixPassShader } from "./shader/mixpass.shader";
import { starfieldPointsShader } from "./shader/starfield-points.shader";
import { UiRenderer } from "./ui/ui-renderer";
import { HudRenderer } from "./ui/hud-renderer";
import { StageControlsRenderer } from "./ui/stage-controls-renderer";
import { SceneTogglesRenderer } from "./ui/scene-toggles-renderer";
import { PlanetSidebarRenderer } from "./ui/planet-sidebar-renderer";
import { openSidebar, subscribeLayoutState } from "./ui/layout-state";
import { subscribeSceneVisibilityState } from "./ui/scene-visibility-state";
import { AppRoute, router } from "./router/router";
import { ZoomControlsRenderer } from "./ui/zoom-controls.-renderer";
import { MobileTogglesRenderer } from "./ui/mobile-toggles-renderer";

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

  private isLayoutTransitioning = false;
  private resizeScheduled = false;
  private transitionResizeTimer: number | null = null;
  private lastLayoutKey: string | null = null;
  private viewportObserver: ResizeObserver | null = null;

  private uiRight?: UiRenderer;

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
    this.cameraManager.switchCamera("Default").initEventControls();
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
    setTimeout(() => { this.initRouter(); }, 1000)

  }

  public initPostProcessing() {
    const renderScene = new RenderPass(
      this.scene,
      this.cameraManager.getActiveEntry().camera,
    );

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(
        this.getViewportSize().width,
        this.getViewportSize().height,
      ),
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

    const sceneTogglesSlot = document.querySelector<HTMLElement>(
      '#ui-root [data-slot="scene-toggles"]',
    );

    if (sceneTogglesSlot) {
      new SceneTogglesRenderer(sceneTogglesSlot).init();
    }

    const mobileToggleSlot = document.querySelector<HTMLElement>(
      '#ui-root [data-slot="mobile-toggles"]',
    );

    if (mobileToggleSlot) {
      new MobileTogglesRenderer(mobileToggleSlot).init();
    }

    const uiSlotHud = document.querySelector<HTMLElement>(
      '#ui-root [data-slot="hud"]',
    );

    if (uiSlotHud) {
      const hud = new HudRenderer(uiSlotHud, {
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

    const uiRightSidebarSlot = document.querySelector<HTMLElement>(
      "#sidebar-right-slot",
    );
    if (uiRightSidebarSlot) {
      this.uiRight = new UiRenderer(uiRightSidebarSlot, {
        hideMoons: false,
        hidePlanets: false,
      });
      this.uiRight.init();
    }

    const uiLeftSidebarSlot =
      document.querySelector<HTMLElement>("#sidebar-left-slot");
    if (uiLeftSidebarSlot) {
      new PlanetSidebarRenderer(uiLeftSidebarSlot).init();
    }

    const uiZoomControls = document.querySelector<HTMLElement>('#ui-root [data-slot="zoom-controls"]');
    if (uiZoomControls) {
      new ZoomControlsRenderer(uiZoomControls).init();
    }

    // Apply open/close state to both sidebars and resize smoothly during transitions.
    subscribeLayoutState((s) => {
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
    subscribeSceneVisibilityState((v) => {
      const overlay = this.cssRenderer?.domElement as HTMLElement | undefined;
      if (overlay) {
        overlay.classList.toggle("markers-off", !v.markersVisible);
        overlay.classList.toggle("markers-on", v.markersVisible);
      }

      this.astronomicalManager.setOrbitsVisible(v.orbitsVisible);
    });
  }

  private initRouter(): void {
    router.start();
    router.subscribe((r) => this.applyRoute(r));
  }

  private applyRoute(route: AppRoute): void {
    if (route.name === "home") {
      this.cameraManager.switchCamera("Default");
      this.uiRight?.setSelectedBodyName(undefined);
      return;
    }

    // Body route (planet or moon).
    const bodyName = route.name === "planet" ? route.planet : route.moon;

    this.cameraManager.switchCamera(bodyName);
    this.uiRight?.setSelectedBodyName(bodyName);

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

    var gl = this.webglRenderer.getContext();

    // Blending aktivieren
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private getRenderPixelRatio(): number {
    // Favor sharpness while staying within a sensible mobile budget.
    // You can bump this to 3 on high-end devices, but 2 is a good default.
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  private initCSS2DRenderer() {
    const { width, height } = this.getViewportSize();

    this.cssRenderer.setSize(width, height);

    this.cssRenderer.domElement.classList.add("css-renderer");
    this.cssRenderer.domElement.classList.add("markers-on");
    this.cssRenderer.domElement.classList.add('hideMoons')
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
      transparent: true,
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
      if (r < 0.06) return new THREE.Color(0.55, 0.70, 1.00);
      if (r < 0.16) return new THREE.Color(0.70, 0.82, 1.00);
      if (r < 0.62) return new THREE.Color(1.00, 1.00, 1.00);
      if (r < 0.88) return new THREE.Color(1.00, 0.92, 0.76);
      return new THREE.Color(1.00, 0.75, 0.52);
    };

    let i = 0;
    const writeStar = (
      dir: THREE.Vector3,
      sizePx: number,
      alpha: number,
      color: THREE.Color
    ) => {
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

    // Avoid thrashing render targets during transitions.
    if (width < 2 || height < 2) return;
    if (
      width === this.lastViewportSize.width &&
      height === this.lastViewportSize.height
    )
      return;
    this.lastViewportSize = { width, height };

    const activeCamera = this.cameraManager.getActiveEntry().camera;

    // Keep pixel ratio in sync (e.g. browser zoom or OS setting changes).
    const dpr = this.getRenderPixelRatio();
    if (dpr !== this.lastDevicePixelRatio) {
      this.lastDevicePixelRatio = dpr;
      this.webglRenderer.setPixelRatio(dpr);
      this.bloomComposer.setPixelRatio?.(dpr);
      this.finalComposer.setPixelRatio?.(dpr);
      // Force a buffer resize at the next opportunity.
      this.lastRenderSize = { width: 0, height: 0 };
    }

    // Always keep camera + CSS2D in sync with the *container* size.
    this.cssRenderer.setSize(width, height);
    this.astronomicalManager.setOrbitLineResolution(width, height);

    activeCamera.aspect = width / height;
    activeCamera.updateProjectionMatrix();

    // During sidebar transitions we keep the WebGL render buffers stable to avoid
    // GPU stalls & render-target reallocations (the "flashbang" problem).
    if (this.isLayoutTransitioning) return;

    if (
      width === this.lastRenderSize.width &&
      height === this.lastRenderSize.height
    )
      return;
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
        if (this.transitionResizeTimer != null)
          window.clearInterval(this.transitionResizeTimer);
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
    [this.bloomComposer, this.finalComposer].forEach((composer) => {
      composer.passes.forEach((pass) => {
        if (pass instanceof RenderPass) {
          pass.camera = newCamera;
        }
      });
    });
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

      const far = (camera as any).far ?? 5000;
      const desiredRadius = Math.max(200, far * 0.95);
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

    this.cameraManager.updateControls(deltaTime);

    requestAnimationFrame(() => {
      this.animate();
    });
  }
}
