import * as THREE from 'three';
import { MathUtils } from "three";
import { saturnRawData } from "../../data/raw-object.data";
import { PURE_BLACK_MATERIAL } from "../constant/pureBlackMaterial.constant";
import { ringShader } from "../shader/ring.shader";
import { Astronomical } from "./astronomical.object";
import { Enceladus } from "./enceladus.object";
import { Iapetus } from "./iapetus.object";
import { Rhea } from "./rhea.object";
import { Titan } from "./titan.object";

export class Saturn extends Astronomical {
    public cameraPosition = new THREE.Vector3(1, 1, 1);

    public ringMaterial?: THREE.ShaderMaterial
    public ringMesh?: THREE.Mesh

    public moons = [
        new Titan(), new Enceladus(), new Iapetus(), new Rhea()
    ]

    constructor() {
        super(["assets/textures/2k_saturn.jpg"], "assets/normals/2k_saturn.png", saturnRawData, false);
    }

    init() {
        super.init();

        const ringInnerRadius = 1.2 * this.data.size; // Innere Radius der Ringe, angepasst an die Größe des Saturns
        const ringOuterRadius = 2.5 * this.data.size; // Äußere Radius der Ringe

        const { vertexShader, fragmentShader } = ringShader

        const planetWorldPosition = new THREE.Vector3();
        this.mesh.getWorldPosition(planetWorldPosition);

        this.ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
                planetWorldPosition: { value: planetWorldPosition },
                sunWorldPosition: { value: new THREE.Vector3(0, 0, 0) },
                planetRadius: { value: this.data.size },
                ringTexture: { value: new THREE.TextureLoader().load('/assets/textures/2k_saturn_ring_alpha.png') }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.DoubleSide,
            transparent: true
        });

        const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 256);

        // Aktualisierung der UV-Koordinaten
        const phiSegments = 256; // Anzahl der Segmente um den Ring herum
        const thetaSegments = 1; // Anzahl der Segmente zwischen den Ringen, normalerweise 1 für einen einfachen Ring

        const uv = ringGeometry.attributes.uv;
        for (let i = 0; i < phiSegments + 1; i++) {
            // Die innere Seite des Rings
            uv.setXY(i, i / phiSegments, 0);
            // Die äußere Seite des Rings
            uv.setXY(i + phiSegments + 1, i / phiSegments, 1);
        }

        ringGeometry.attributes.uv.needsUpdate = true; // Sehr wichtig, um zu sagen, dass die UVs aktualisiert wurden

        this.ringMesh = new THREE.Mesh(ringGeometry, this.ringMaterial);

        this.ringMesh.rotation.x = -Math.PI / 2;

        this.planetaryGroup.add(this.ringMesh);


        this.planetaryGroup.rotateX(MathUtils.DEG2RAD * this.data.planetaryTilt)

        this.moons.forEach(moon => {
            moon.orbitingParent = this;
            moon.init();

            const moonGrp = new THREE.Group();
            moonGrp.add(moon.orbitalGroup);
            moonGrp.rotateX(MathUtils.DEG2RAD * moon.data.orbitalTilt);

            this.group.add(moonGrp);
        })


        this.generateMaterials()
        this.isInit = true
    }


    public preBloom(): void {
        super.preBloom();
        this.ringMesh.material = PURE_BLACK_MATERIAL
    }

    public postBloom(): void {
        super.postBloom();
        this.ringMesh.material = this.ringMaterial
    }

    public render(delta: number, camera?: THREE.PerspectiveCamera) {
        super.render(delta);

        const planetWorldPosition = new THREE.Vector3();
        this.mesh.getWorldPosition(planetWorldPosition);

        this.moons.forEach(moon => {
            moon.render(delta, camera);
        })

        if (this.ringMaterial) {
            this.ringMaterial.uniforms.planetWorldPosition.value.copy(planetWorldPosition);
        }
    }
}
