import * as THREE from "three";
import { europaRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";

export class Europa extends Astronomical {
    public isMoon = true;
    constructor() {
        super(["assets/textures/2k_europa.jpg"], "assets/normals/2k_moon.png", europaRawData, false);
    }

    public init() {
        super.init();
        this.mesh.rotation.y = (-1 * Math.PI) / 2;
        this.generateMaterials()
        this.isInit = true
    }

    public getCurrentPosition() {
        return this.group?.position?.clone() ?? null;
    }

    public render(delta: number, activeCamera: THREE.PerspectiveCamera) {
        super.render(delta, activeCamera);
    }
}
