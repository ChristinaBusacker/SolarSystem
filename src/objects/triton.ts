import { enceladusData, rheaData, titanData, tritonData } from "../../data/objects.data";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Triton extends Astronomical {
    public isMoon = true;

    constructor() {
        super(["assets/textures/2k_triton.jpg"], "assets/normals/2k_mars.png", tritonData, false);
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