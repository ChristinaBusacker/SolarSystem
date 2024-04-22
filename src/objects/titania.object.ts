import { enceladusData, rheaData, titanData, titaniaData } from "../../data/objects.data";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Titania extends Astronomical {
    public isMoon = true;

    constructor() {
        super(["assets/textures/titania.jpg"], "assets/normals/2k_mars.png", titaniaData, false);
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