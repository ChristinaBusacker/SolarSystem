import { MathUtils } from "three";
import { uranusData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Uranus extends Astronomical {
    public name = uranusData.title
    public orbitalSpeed = uranusData.orbitalSpeed;
    public cameraPosition = new THREE.Vector3(1, 1, 1);
    public distance = uranusData.distanceToOrbiting;
    public rotationSpeed = uranusData.rotationSpeed;

    public semiMajorAxis = uranusData.semiMajorAxis;
    public semiMinorAxis = uranusData.semiMinorAxis;

    constructor() {
        super(["assets/textures/2k_uranus.jpg"], "assets/normals/2k_uranus.png", uranusData, false);
    }

    public init() {
        super.init();
        this.isInit = true;
    }

    public render(delta: number, camera?: THREE.PerspectiveCamera) {
        super.render(delta);
    }
}
