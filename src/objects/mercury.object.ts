import * as THREE from "three";
import { mercuryRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";

export class Mercury extends Astronomical {

  public cameraPosition = new THREE.Vector3(1, 1, 1);

  constructor() {
    super(["assets/textures/2k_mercury.jpg"], "assets/normals/2k_mercury.png", mercuryRawData, false);
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
