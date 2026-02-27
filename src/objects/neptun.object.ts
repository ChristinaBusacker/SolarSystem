import * as THREE from "three";
import { MathUtils } from "three";
import {
  neptuneRawData,
  nereidRawData,
  proteusRawData,
  tritonRawData,
} from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";
import { SimpleAstronomicalBody } from "./simple-astronomical.object";
import type { UpdateContext } from "../core/update-context";

export class Neptun extends Astronomical {
  public moons = [
    new SimpleAstronomicalBody(
      "/assets/textures/1k_proteus.png",
      "/assets/normals/2k_moon.png",
      proteusRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/2k_triton.jpg",
      "/assets/normals/2k_mars.png",
      tritonRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/1k_nereid.png",
      "/assets/normals/2k_moon.png",
      nereidRawData,
      { isMoon: true },
    ),
  ];

  constructor() {
    super(
      ["/assets/textures/2k_neptune.jpg"],
      "/assets/normals/2k_mars.png",
      neptuneRawData,
      false,
    );
  }

  public init() {
    super.init();

    this.moons.forEach(moon => {
      moon.orbitingParent = this;
      moon.init();

      const moonGrp = new THREE.Group();
      moonGrp.add(moon.orbitalGroup);
      moonGrp.rotateX(MathUtils.DEG2RAD * moon.data.orbitalTilt);

      this.group.add(moonGrp);
    });

    this.generateMaterials();
    this.isInit = true;
  }

  public render(ctx: UpdateContext) {
    super.render(ctx);

    this.moons.forEach(moon => {
      moon.render(ctx);
    });
  }
}
