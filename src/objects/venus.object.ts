import * as THREE from "three";
import { APP } from "..";

import { venusRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";

export class Venus extends Astronomical {
  constructor() {
    super(
      ["/assets/textures/2k_venus_surface.jpg"],
      "/assets/normals/2k_venus.png",
      venusRawData,
      false,
    );
  }

  public init() {
    super.init();
    this.addAtmosphere("/assets/textures/2k_venus_atmosphere.jpg", this.data.size);
    this.generateMaterials();
    this.isInit = true;
  }

  public render(delta: number, activeCamera?: THREE.PerspectiveCamera) {
    this.atmosphereMesh.rotation.y =
      this.data.rotationSpeed * delta * 60 * APP.simulationSpeed * 1.25;
    super.render(delta, activeCamera);
  }
}
