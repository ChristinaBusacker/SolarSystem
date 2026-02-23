import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { CameraManager } from "./manager/CameraManager";
import { AstronomicalManager } from "./manager/AstronomicalManager";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";

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
import { PlanetSidebarRenderer } from "./ui/planet-sidebar-renderer";
import { subscribeLayoutState } from "./ui/layout-state";

export class Application {
  private static instance: Application | null = null;

  public webglRenderer = new THREE.WebGLRenderer({ antialias: true });
  public cssRenderer = new CSS2DRenderer();
  public scene = new THREE.Scene();
  public clock = new THREE.Clock();

  public bloomComposer = new EffectComposer(this.webglRenderer);
  public finalComposer = new EffectComposer(this.webglRenderer);

  public simulationSpeed = simulationSpeed;

  public cameraManager = new CameraManager(this.scene);
  public astronomicalManager = new AstronomicalManager();

  private backgroundImage?: THREE.Texture;

  private lastViewportSize: { width: number; height: number } = {
    width: 0,
    height: 0,
  };
  private resizeScheduled = false;
  private transitionResizeTimer: number | null = null;
  private lastLayoutKey: string | null = null;
  private viewportObserver: ResizeObserver | null = null;

  private constructor() {
    window.addEventListener("resize", () => this.scheduleResize());

    const cameraSelector = document.getElementById("cameraSelector");
    cameraSelector.addEventListener("change", (event) => {
      const selectedCamera = (event.target as HTMLSelectElement).value;
      this.cameraManager.switchCamera(selectedCamera);
    });

    window.addEventListener("ui:speedChange", (e: Event) => {
      const ce = e as CustomEvent<{ speed: number }>;
      if (ce.detail?.speed != null) this.simulationSpeed = ce.detail.speed;
    });
  }

  public init() {
    this.cameraManager.switchCamera("Default").initEventControls();
    this.attachViewportResizeObserver();
    this.onResize();
    this.astronomicalManager.initObjects(this.scene);
    this.initWebGLRenderer();
    this.initCSS2DRenderer();
    this.initBackground();
    this.initSunLight();
    this.initPostProcessing();
    this.initUi();
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

    this.finalComposer.addPass(renderScene);
    this.finalComposer.addPass(mixPass);
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
      new UiRenderer(uiRightSidebarSlot, {
        hideMoons: false,
        hidePlanets: false,
      }).init();
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
  }

  private initWebGLRenderer() {
    const { width, height } = this.getViewportSize();

    // Keep the canvas styled by CSS (100% size) and only update the render buffer size here.
    this.webglRenderer.setSize(width, height, false);

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
    document.getElementById("app").appendChild(this.cssRenderer.domElement);
  }

  private async initBackground() {
    const pmremGenerator = new THREE.PMREMGenerator(this.webglRenderer);
    pmremGenerator.compileEquirectangularShader();
    const loader = new THREE.TextureLoader();

    const backgroundImage = await loader.loadAsync(
      "assets/backgrounds/background6.jpg",
    );

    backgroundImage.colorSpace = THREE.SRGBColorSpace;

    this.backgroundImage =
      pmremGenerator.fromEquirectangular(backgroundImage).texture;
    this.scene.background = this.backgroundImage;

    pmremGenerator.dispose();

    return this.scene.background;
  }

  private initSunLight() {}

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

    this.webglRenderer.setSize(width, height, false);
    this.cssRenderer.setSize(width, height);
    this.bloomComposer.setSize(width, height);
    this.finalComposer.setSize(width, height);

    activeCamera.aspect = width / height;
    activeCamera.updateProjectionMatrix();
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

    this.scheduleResize();

    this.transitionResizeTimer = window.setInterval(() => {
      this.scheduleResize();
      i += 1;
      if (i >= steps) {
        if (this.transitionResizeTimer != null)
          window.clearInterval(this.transitionResizeTimer);
        this.transitionResizeTimer = null;
        // Final snap to exact size at the end of the transition.
        window.setTimeout(() => this.scheduleResize(), 30);
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

    //this.scene.background = null
    this.astronomicalManager.preBloom();
    this.bloomComposer.render(deltaTime * this.simulationSpeed);
    this.astronomicalManager.postBloom();
    //this.scene.background = this.backgroundImage

    this.finalComposer.render(deltaTime);

    this.cssRenderer.render(this.scene, camera);

    this.cameraManager.updateControls(deltaTime);

    requestAnimationFrame(() => {
      this.animate();
    });
  }
}
