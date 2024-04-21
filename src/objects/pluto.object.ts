import { plutoData } from "../../data/objects.data";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Pluto extends Astronomical {
    public name = plutoData.title
    public orbitalSpeed = plutoData.orbitalSpeed;
    public cameraPosition = new THREE.Vector3(1, 1, 1);
    public distance = plutoData.distanceToOrbiting;
    public rotationSpeed = plutoData.rotationSpeed;

    public semiMajorAxis = plutoData.semiMajorAxis;
    public semiMinorAxis = plutoData.semiMinorAxis;

    constructor() {
        super(["assets/textures/2k_pluto.jpg"], "assets/normals/2k_mars.png", plutoData, false);
    }

    public init() {
        super.init();
        this.generateMaterials()
        this.isInit = true;
    }


    public render(delta: number, camera?: THREE.PerspectiveCamera) {
        super.render(delta);
    }
}
