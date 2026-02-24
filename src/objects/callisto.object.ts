
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";
import { callistoRawData } from '../../data/raw-object.data'

export class Callisto extends Astronomical {
    public isMoon = true;
    constructor() {
        super(["assets/textures/2k_callisto.jpg"], "assets/normals/2k_moon.png", callistoRawData, false);
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
