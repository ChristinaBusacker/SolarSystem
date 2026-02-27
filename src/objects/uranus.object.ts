import * as THREE from "three";
import { MathUtils } from "three";
import {
  arielRawData,
  mirandaRawData,
  oberonRawData,
  titaniaRawData,
  umbrielRawData,
  uranusRawData,
} from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";
import { SimpleAstronomicalBody } from "./simple-astronomical.object";
import type { UpdateContext } from "../core/update-context";

export class Uranus extends Astronomical {
  public moons = [
    new SimpleAstronomicalBody(
      "/assets/textures/1k_miranda-0.png",
      "/assets/normals/2k_moon.png",
      mirandaRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/1k_ariel.png",
      "/assets/normals/2k_moon.png",
      arielRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/1k_umbriel.png",
      "/assets/normals/2k_moon.png",
      umbrielRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/titania.jpg",
      "/assets/normals/2k_moon.png",
      titaniaRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/1k_oberonmap1.png",
      "/assets/normals/2k_moon.png",
      oberonRawData,
      { isMoon: true },
    ),
  ];

  constructor() {
    super(
      ["/assets/textures/2k_uranus.jpg"],
      "/assets/normals/2k_uranus.png",
      uranusRawData,
      false,
    );
  }

  public init() {
    super.init();
    this.generateMaterials();

    this.moons.forEach(moon => {
      moon.orbitingParent = this;
      moon.init();

      const moonGrp = new THREE.Group();
      moonGrp.add(moon.orbitalGroup);
      moonGrp.rotateX(MathUtils.DEG2RAD * moon.data.orbitalTilt);

      this.group.add(moonGrp);
    });

    this.isInit = true;
  }

  public render(ctx: UpdateContext) {
    super.render(ctx);

    this.moons.forEach(moon => {
      moon.render(ctx);
    });
  }
}
