import { callistoData, ganymedData } from "../../data/objects.data";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Ganymede extends Astronomical {
    public isMoon = true;
    constructor() {
        super(["assets/textures/2k_ganymede.jpg"], "assets/normals/2k_moon.png", ganymedData, false);
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
