import * as THREE from "three";
import { titanRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";

export class Titania extends Astronomical {
    public isMoon = true;

    constructor() {
        super(["assets/textures/titania.jpg"], "assets/normals/2k_mars.png", titanRawData, false);
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