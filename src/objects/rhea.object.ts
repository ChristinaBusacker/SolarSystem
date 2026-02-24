import * as THREE from "three";
import { rheaRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";

export class Rhea extends Astronomical {
    public isMoon = true;

    constructor() {
        super(["assets/textures/2k_rhea.jpg"], "assets/normals/2k_mars.png", rheaRawData, false);
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