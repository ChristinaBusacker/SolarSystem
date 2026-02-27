import * as THREE from "three";
import type { UpdateContext } from "../core/update-context";

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

  public render(ctx: UpdateContext) {
    if (this.atmosphereMesh) {
      this.atmosphereMesh.rotation.y =
        this.data.rotationSpeed * ctx.delta * 60 * ctx.simSpeed * 1.25;
    }
    super.render(ctx);
  }
}
