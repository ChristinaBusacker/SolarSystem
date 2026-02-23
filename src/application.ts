import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { CameraManager } from "./manager/CameraManager";
import { AstronomicalManager } from "./manager/AstronomicalManager";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import Stats from "stats.js";
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

export class Application {
  private static instance: Application | null = null;

  public webglRenderer = new THREE.WebGLRenderer({ antialias: true });
  public cssRenderer = new CSS2DRenderer();
  public scene = new THREE.Scene();
  public clock = new THREE.Clock();
  public stats = new Stats();
  public bloomComposer = new EffectComposer(this.webglRenderer);
  public finalComposer = new EffectComposer(this.webglRenderer);

  public simulationSpeed = simulationSpeed;

  public cameraManager = new CameraManager(this.scene);
  public astronomicalManager = new AstronomicalManager();

  private backgroundImage?: THREE.Texture;

  private constructor() {
    document.body.appendChild(this.stats.dom);
    window.addEventListener("resize", () => {
      this.onResize();
    });

    const cameraSelector = document.getElementById("cameraSelector");
    cameraSelector.addEventListener("change", (event) => {
      const selectedCamera = (event.target as HTMLSelectElement).value;
      this.cameraManager.switchCamera(selectedCamera);
    });

    window.addEventListener("ui:speedChange", (e: Event) => {
      const ce = e as CustomEvent<{ speed: number }>;
      if (ce.detail?.speed != null) this.simulationSpeed = ce.detail.speed;
    });


    window.addEventListener("ui:sidebarTransition", (e: Event) => {
      const ce = e as CustomEvent<{ durationMs?: number }>;
      const durationMs = Math.max(0, Number(ce.detail?.durationMs ?? 280));
      this.resizeDuringTransition(durationMs);
    });
  }

  public init() {
    this.cameraManager.switchCamera("Default").initEventControls();
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
    const uiSlotHud = document.querySelector<HTMLElement>(
      '#ui-root [data-slot="hud"]',
    );

    if (uiSlotHud) {
      const hud = new HudRenderer(uiSlotHud, {
        simulationSpeed: this.simulationSpeed,
      });
      hud.init();
    }

    const uiSidebarSlot = document.querySelector<HTMLElement>(
      '#sidebar-slot',
    );

    if (uiSidebarSlot) {
      const ui = new UiRenderer(uiSidebarSlot, {
        hideMoons: false,
        hidePlanets: false,
        sidebarOpen: true,
      });
      ui.init();
    }
  }

  private initWebGLRenderer() {
    const { width, height } = this.getViewportSize();

    this.webglRenderer.setSize(width, height);

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
    const activeCamera = this.cameraManager.getActiveEntry().camera;

    this.webglRenderer.setSize(width, height);
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

  private resizeDuringTransition(durationMs: number): void {
    // During sidebar open/close transitions the viewport size changes gradually.
    // Fire a few resize updates so the canvas doesn't "jump".
    const start = performance.now();
    const maxMs = Math.min(1200, Math.max(0, durationMs) + 80);

    const tick = () => {
      this.onResize();
      if (performance.now() - start < maxMs) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
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
    this.stats.begin();
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
    this.stats.end();

    requestAnimationFrame(() => {
      this.animate();
    });
  }
}
