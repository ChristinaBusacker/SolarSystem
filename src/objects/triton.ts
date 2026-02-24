import * as THREE from "three";
import { tritonRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";

export class Triton extends Astronomical {
    public isMoon = true;

    constructor() {
        super(["assets/textures/2k_triton.jpg"], "assets/normals/2k_mars.png", tritonRawData, false);
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