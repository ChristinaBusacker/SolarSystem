import * as THREE from "three";
import { iapetusRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";

export class Iapetus extends Astronomical {
    public isMoon = true;

    constructor() {
        super(["assets/textures/2k_iapetus.jpg"], "assets/normals/2k_mars.png", iapetusRawData, false);
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