import * as THREE from "three";
import { MathUtils } from "three";
import { deimosRawData, marsRawData, phobosRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";
import { SimpleAstronomicalBody } from "./simple-astronomical.object";
import type { UpdateContext } from "../core/update-context";

export class Mars extends Astronomical {
  public cameraPosition = new THREE.Vector3(1, 1, 1);

  public moons = [
    new SimpleAstronomicalBody(
      "/assets/textures/1k_phobos.jpg",
      "/assets/normals/2k_moon.png",
      phobosRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/1k_deimos.png",
      "/assets/normals/2k_moon.png",
      deimosRawData,
      { isMoon: true },
    ),
  ];

  constructor() {
    super(["/assets/textures/2k_mars.jpg"], "/assets/normals/2k_mars.png", marsRawData, false);
  }

  public init() {
    super.init();

    this.moons.forEach(moon => {
      moon.orbitingParent = this;

      if (moon.data.slug === "phobos") {
        moon.initDisplacement("/assets/displacement/phobos4.jpg", 0.0004);
      }

      if (moon.data.slug === "deimos") {
        moon.initDisplacement("/assets/displacement/deimos3.jpg", 0.0002);
      }

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
