import { MathUtils } from "three";
import { neptuneData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Neptun extends Astronomical {
    public name = neptuneData.title
    public orbitalSpeed = neptuneData.orbitalSpeed;
    public cameraPosition = new THREE.Vector3(1, 1, 1);
    public distance = neptuneData.distanceToOrbiting;
    public rotationSpeed = neptuneData.rotationSpeed;

    public semiMajorAxis = neptuneData.semiMajorAxis;
    public semiMinorAxis = neptuneData.semiMinorAxis;

    constructor() {
        super(["assets/textures/2k_neptune.jpg"], "assets/normals/2k_neptune.png", neptuneData, false);
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
