import { MathUtils } from "three";
import { saturnData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from 'three';
import { TextureLoader } from 'three';

export class Saturn extends Astronomical {
    public name = saturnData.title
    public orbitalSpeed = saturnData.orbitalSpeed;
    public cameraPosition = new THREE.Vector3(1, 1, 1);
    public distance = saturnData.distanceToOrbiting;
    public rotationSpeed = saturnData.rotationSpeed;

    public semiMajorAxis = saturnData.semiMajorAxis;
    public semiMinorAxis = saturnData.semiMinorAxis;

    constructor() {
        super(["assets/textures/2k_saturn.jpg"], saturnData, false);


    }

    init() {
        super.init();

        const ringInnerRadius = 1.2 * saturnData.size; // Innere Radius der Ringe, angepasst an die Größe des Saturns
        const ringOuterRadius = 2.5 * saturnData.size; // Äußere Radius der Ringe

        const loader = new TextureLoader();

        loader.load('assets/textures/2k_saturn_ring_alpha.png', (texture) => {
            const ringMaterial = new THREE.MeshStandardMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
                color: 0xffffff,
                opacity: 1, // Du kannst die Opazität an deine Bedürfnisse anpassen
            });

            const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 64);

            // Aktualisierung der UV-Koordinaten
            const phiSegments = 64; // Anzahl der Segmente um den Ring herum
            const thetaSegments = 1; // Anzahl der Segmente zwischen den Ringen, normalerweise 1 für einen einfachen Ring

            const uv = ringGeometry.attributes.uv;
            for (let i = 0; i < phiSegments + 1; i++) {
                // Die innere Seite des Rings
                uv.setXY(i, i / phiSegments, 0);
                // Die äußere Seite des Rings
                uv.setXY(i + phiSegments + 1, i / phiSegments, 1);
            }

            ringGeometry.attributes.uv.needsUpdate = true; // Sehr wichtig, um zu sagen, dass die UVs aktualisiert wurden

            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringMesh.castShadow = true
            ringMesh.receiveShadow = true
            ringMesh.rotation.x = -Math.PI / 2;

            this.planetaryGroup.add(ringMesh);
        });


        this.planetaryGroup.rotateX(MathUtils.DEG2RAD * saturnData.planetaryTilt)
        this.group.rotateZ(MathUtils.DEG2RAD * 5)

        this.isInit = true
    }

    public render(delta: number, camera?: THREE.PerspectiveCamera) {
        super.render(delta);
    }
}
