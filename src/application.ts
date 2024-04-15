import * as THREE from "three";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { CameraManager } from "./manager/CameraManager";
import { AstronomicalManager } from "./manager/AstronomicalManager";
import Stats from "stats.js";

export class Application {
    private static instance: Application | null = null;

    public webglRenderer = new THREE.WebGLRenderer({ antialias: true })
    public cssRenderer = new CSS3DRenderer();
    public scene = new THREE.Scene();
    public clock = new THREE.Clock();
    public stats = new Stats();

    public cameraManager = new CameraManager(this.scene);
    public astronomicalManager = new AstronomicalManager(this.scene);

    private constructor() {
        document.body.appendChild(this.stats.dom);



        window.addEventListener("resize", () => { this.onResize() });

        const cameraSelector = document.getElementById("cameraSelector");
        cameraSelector.addEventListener("change", (event) => {
            const selectedCamera = (event.target as HTMLSelectElement).value;
            this.cameraManager.switchCamera(selectedCamera)
        });

    }

    public init() {
        this.initWebGLRenderer();
        this.initCSS3DRenderer();
        this.initBackground();
        this.initSunLight();
    }

    public static getInstance(): Application {
        if (!Application.instance) {
            Application.instance = new Application();
        }
        return Application.instance;
    }

    private initWebGLRenderer() {
        this.webglRenderer.setSize(window.innerWidth, window.innerHeight);
        this.webglRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.webglRenderer.shadowMap.enabled = true
        this.webglRenderer.toneMappingExposure = 0.2;

        document.body.appendChild(this.webglRenderer.domElement);
    }

    private initCSS3DRenderer() {
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

        this.scene.background =
            pmremGenerator.fromEquirectangular(backgroundImage).texture;

        pmremGenerator.dispose();
    }

    private initSunLight() {
        const light = new THREE.PointLight(0xffffff, 1.5, 50000000, 0.1);
        light.position.set(0, 0, 0);
        light.castShadow = true

        light.shadow.camera.near = 50;
        light.shadow.camera.far = 10000;
        light.shadow.mapSize.width = 4096;
        light.shadow.mapSize.height = 4096;

        this.scene.add(light);
    }

    public onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const activeCamera = this.cameraManager.getActiveEntry().camera
        this.webglRenderer.setSize(width, height);
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        activeCamera.aspect = width / height;
        activeCamera.updateProjectionMatrix();
    }

    public onCameraSwitch() {

    }

    public animate() {
        this.stats.begin();
        const deltaTime = this.clock.getDelta();
        const camera = this.cameraManager.getActiveEntry().camera

        this.astronomicalManager.render(deltaTime, camera, this.scene)

        this.webglRenderer.render(this.scene, camera);
        this.cssRenderer.render(this.scene, camera);


        this.cameraManager.updateControls(deltaTime);
        this.stats.end();

        requestAnimationFrame(() => { this.animate() });
    }

}