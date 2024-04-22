import { enceladusData, rheaData, titanData } from "../../data/objects.data";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Titan extends Astronomical {
    public isMoon = true;

    constructor() {
        super(["assets/textures/2k_titan.jpg"], "assets/normals/2k_mars.png", titanData, false);
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