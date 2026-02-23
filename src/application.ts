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
import { UiRenderer } from "./ui/ui-renderer";
import { HudRenderer } from "./ui/hud-renderer";
import { StageControlsRenderer } from "./ui/stage-controls-renderer";
import { SceneTogglesRenderer } from "./ui/scene-toggles-renderer";
import { PlanetSidebarRenderer } from "./ui/planet-sidebar-renderer";
import { openSidebar, subscribeLayoutState } from "./ui/layout-state";
import { subscribeSceneVisibilityState } from "./ui/scene-visibility-state";
import { AppRoute, router } from "./router/router";

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

  private backgroundImage?: THREE.Texture;

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

    window.addEventListener("ui:select-body", (e: Event) => {
      const ce = e as CustomEvent<{ name: string; kind: "planet" | "moon" }>;
      const name = ce.detail?.name;
      const kind = ce.detail?.kind;
      if (!name || !kind) return;
      if (kind === "moon") router.goMoon(name);
      else router.goPlanet(name);
    });
  }

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
    this.initRouter();
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
    this.smaaPass = new SMAAPass();
    this.smaaPass.setSize(width, height);

    this.finalComposer.addPass(renderScene);
    this.finalComposer.addPass(mixPass);
    this.finalComposer.addPass(this.smaaPass);
    this.finalComposer.addPass(outputPass);
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

    const uiSlotHud = document.querySelector<HTMLElement>(
      '#ui-root [data-slot="hud"]',
    );

    if (uiSlotHud) {
      const hud = new HudRenderer(uiSlotHud, {
        simulationSpeed: this.simulationSpeed,
      });
      hud.init();
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

    // Keep the canvas styled by CSS (100% size) and only update the render buffer size here.
    this.webglRenderer.setSize(width, height, false);
    this.lastRenderSize = { width, height };

    // Prevent "white flash" if rendering stalls during resizes/transitions.
    this.webglRenderer.setClearColor(0x000000, 1);

    this.webglRenderer.toneMapping = THREE.CineonToneMapping;
    this.webglRenderer.toneMappingExposure = 1;
    document.getElementById("app").appendChild(this.webglRenderer.domElement);

    var gl = this.webglRenderer.getContext();

    // Blending aktivieren
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private initCSS2DRenderer() {
    const { width, height } = this.getViewportSize();

    this.cssRenderer.setSize(width, height);

    this.cssRenderer.domElement.classList.add("css-renderer");
    this.cssRenderer.domElement.classList.add("markers-on");
    document.getElementById("app").appendChild(this.cssRenderer.domElement);
  }

  private async initBackground() {
    const pmremGenerator = new THREE.PMREMGenerator(this.webglRenderer);
    pmremGenerator.compileEquirectangularShader();
    const loader = new THREE.TextureLoader();

    return
    const backgroundImage = await loader.loadAsync(
      "assets/backgrounds/background3.jpg",
    );

    backgroundImage.colorSpace = THREE.SRGBColorSpace;

    this.backgroundImage =
      pmremGenerator.fromEquirectangular(backgroundImage).texture;
    this.scene.background = this.backgroundImage;
    // Makes Standard/Physical materials (e.g. asteroids) pick up cinematic IBL.
    this.scene.environment = this.backgroundImage;

    pmremGenerator.dispose();

    return this.scene.background;
  }

  private initSunLight() {
    // Your planets use custom shaders (sunPosition uniforms), so they don't rely on Three lights.
    // Minor bodies (asteroids) use StandardMaterial for cheap specular highlights.
    const sunLight = new THREE.PointLight(0xffffff, 6, 0, 2);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = false;
    this.scene.add(sunLight);

    // Slight ambient so the "night side" isn't pure black.
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.06));
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

    // Always keep camera + CSS2D in sync with the *container* size.
    this.cssRenderer.setSize(width, height);

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
    this.smaaPass?.setSize(width, height);
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
          this.lastRenderSize = { width: 0, height: 0 };
          this.webglRenderer.setSize(width, height, false);
          this.bloomComposer.setSize(width, height);
          this.finalComposer.setSize(width, height);
          this.smaaPass?.setSize(width, height);
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

    this.astronomicalManager.render(deltaTime, camera, this.scene);
    this.minorBodyManager.render(deltaTime);

    //this.scene.background = null
    this.astronomicalManager.preBloom();
    this.minorBodyManager.preBloom();
    this.bloomComposer.render(deltaTime * this.simulationSpeed);
    this.astronomicalManager.postBloom();
    this.minorBodyManager.postBloom();
    //this.scene.background = this.backgroundImage

    this.finalComposer.render(deltaTime);

    this.cssRenderer.render(this.scene, camera);

    this.cameraManager.updateControls(deltaTime);

    requestAnimationFrame(() => {
      this.animate();
    });
  }
}
