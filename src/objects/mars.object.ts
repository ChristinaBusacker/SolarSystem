import * as THREE from "three";
import { marsRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";

export class Mars extends Astronomical {
  public cameraPosition = new THREE.Vector3(1, 1, 1);

  constructor() {
    super(["assets/textures/2k_mars.jpg"], "assets/normals/2k_mars.png", marsRawData, false);
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
