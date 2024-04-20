import { MathUtils } from "three";
import { saturnData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { ringShader } from "../shader/ring.shader";
import { PURE_BLACK_MATERIAL } from "../constant/pureBlackMaterial.constant";

export class Saturn extends Astronomical {
    public name = saturnData.title
    public orbitalSpeed = saturnData.orbitalSpeed;
    public cameraPosition = new THREE.Vector3(1, 1, 1);
    public distance = saturnData.distanceToOrbiting;
    public rotationSpeed = saturnData.rotationSpeed;

    public semiMajorAxis = saturnData.semiMajorAxis;
    public semiMinorAxis = saturnData.semiMinorAxis;

    public ringMaterial?: THREE.ShaderMaterial
    public ringMesh?: THREE.Mesh

    constructor() {
        super(["assets/textures/2k_saturn.jpg"], "assets/normals/2k_saturn.png", saturnData, false);


    }

    init() {
        super.init();

        const ringInnerRadius = 1.2 * saturnData.size; // Innere Radius der Ringe, angepasst an die Größe des Saturns
        const ringOuterRadius = 2.5 * saturnData.size; // Äußere Radius der Ringe

        const { vertexShader, fragmentShader } = ringShader

        const planetWorldPosition = new THREE.Vector3();
        this.mesh.getWorldPosition(planetWorldPosition);

        this.ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
                planetWorldPosition: { value: planetWorldPosition },
                sunWorldPosition: { value: new THREE.Vector3(0, 0, 0) },
                planetRadius: { value: saturnData.size },
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
        this.ringMesh.castShadow = true
        this.ringMesh.receiveShadow = true
        this.ringMesh.rotation.x = -Math.PI / 2;

        this.planetaryGroup.add(this.ringMesh);


        this.planetaryGroup.rotateX(MathUtils.DEG2RAD * saturnData.planetaryTilt)

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

        if (this.ringMaterial) {
            this.ringMaterial.uniforms.planetWorldPosition.value.copy(planetWorldPosition);
        }

    }
}
