import { iapetusData, marsData } from "../../data/objects.data";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Iapetus extends Astronomical {
    public isMoon = true;

    constructor() {
        super(["assets/textures/2k_iapetus.jpg"], "assets/normals/2k_mars.png", iapetusData, false);
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