import { moonData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Moon extends Astronomical {
  public isMoon = true;
  constructor() {
    super(["assets/textures/2k_moon.jpg"], "assets/normals/2k_moon.png", moonData, false);
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
