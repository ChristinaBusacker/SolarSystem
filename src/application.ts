import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { CameraManager } from "./manager/CameraManager";
import { AstronomicalManager } from "./manager/AstronomicalManager";
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import Stats from "stats.js";
import { bloomThreshold, bloomStrength, bloomRadius, simulationSpeed } from "../data/settings.data";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { mixPassShader } from "./shader/mixpass.shader";

export class Application {
    private static instance: Application | null = null;

    public webglRenderer = new THREE.WebGLRenderer({ antialias: true })
    public cssRenderer = new CSS2DRenderer();
    public scene = new THREE.Scene();
    public clock = new THREE.Clock();
    public stats = new Stats();
    public bloomComposer = new EffectComposer(this.webglRenderer)
    public finalComposer = new EffectComposer(this.webglRenderer)

    public simulationSpeed = simulationSpeed

    public cameraManager = new CameraManager(this.scene);
    public astronomicalManager = new AstronomicalManager();

    private backgroundImage?: THREE.Texture

    private constructor() {
        document.body.appendChild(this.stats.dom);
        window.addEventListener("resize", () => { this.onResize() });

        const cameraSelector = document.getElementById("cameraSelector");
        cameraSelector.addEventListener("change", (event) => {
            const selectedCamera = (event.target as HTMLSelectElement).value;
            this.cameraManager.switchCamera(selectedCamera)
        });


        const simulationSpeedSlider = document.getElementById('simulationSpeedSlider') as HTMLInputElement
        simulationSpeedSlider.addEventListener('change', () => {
            this.simulationSpeed = parseInt(simulationSpeedSlider.value)
        })

    }

    public init() {
        this.cameraManager.switchCamera('Default').initEventControls()
        this.onResize();
        this.astronomicalManager.initObjects(this.scene);
        this.initWebGLRenderer();
        this.initCSS2DRenderer();
        this.initBackground();
        this.initSunLight();
        this.initPostProcessing();
    }

    public initPostProcessing() {
        const renderScene = new RenderPass(this.scene, this.cameraManager.getActiveEntry().camera);

        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            bloomStrength,
            bloomRadius,
            bloomThreshold
        );

        this.bloomComposer.addPass(renderScene);
        this.bloomComposer.addPass(bloomPass);
        this.bloomComposer.renderToScreen = false;

        const { vertexShader, fragmentShader } = mixPassShader

        const mixPass = new ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                defines: {}
            }), 'baseTexture'
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

    private initWebGLRenderer() {
        this.webglRenderer.setSize(window.innerWidth, window.innerHeight);

        this.webglRenderer.toneMapping = THREE.CineonToneMapping;
        this.webglRenderer.toneMappingExposure = 1
        document.body.appendChild(this.webglRenderer.domElement);
    }

    private initCSS2DRenderer() {
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);

        this.cssRenderer.domElement.classList.add("css-renderer");
        document.body.appendChild(this.cssRenderer.domElement);
    }

    private async initBackground() {
        const pmremGenerator = new THREE.PMREMGenerator(this.webglRenderer);
        pmremGenerator.compileEquirectangularShader();
        const loader = new THREE.TextureLoader();

        const backgroundImage = await loader.loadAsync(
            "assets/backgrounds/background6.jpg"
        );

        backgroundImage.colorSpace = THREE.SRGBColorSpace

        this.backgroundImage = pmremGenerator.fromEquirectangular(backgroundImage).texture;
        this.scene.background = this.backgroundImage

        pmremGenerator.dispose();

        return this.scene.background
    }

    private initSunLight() {
        const light = new THREE.PointLight(0xffffff, 1.5, 50000000, 0);
        light.position.set(0, 0, 0);
        this.scene.add(light);
    }

    public onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const activeCamera = this.cameraManager.getActiveEntry().camera
        this.webglRenderer.setSize(width, height);
        this.cssRenderer.setSize(width, height);
        this.bloomComposer.setSize(width, height);
        this.finalComposer.setSize(width, height);

        activeCamera.aspect = width / height;
        activeCamera.updateProjectionMatrix();
    }

    public updateComposer(newCamera: THREE.Camera) {

        [this.bloomComposer, this.finalComposer].forEach((composer) => {
            composer.passes.forEach(pass => {
                if (pass instanceof RenderPass) {
                    pass.camera = newCamera;
                }
            });
        })
    }

    public animate() {
        this.stats.begin();
        const deltaTime = this.clock.getDelta();
        const camera = this.cameraManager.getActiveEntry().camera

        this.astronomicalManager.render(deltaTime, camera, this.scene)



        //this.scene.background = null
        this.astronomicalManager.preBloom()
        this.bloomComposer.render(deltaTime * this.simulationSpeed);
        this.astronomicalManager.postBloom()
        //this.scene.background = this.backgroundImage


        this.finalComposer.render(deltaTime)

        this.cssRenderer.render(this.scene, camera);

        this.cameraManager.updateControls(deltaTime);
        this.stats.end();

        requestAnimationFrame(() => { this.animate() });
    }

}