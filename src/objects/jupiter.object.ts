import * as THREE from "three";
import { MathUtils } from "three";
import { callistoRawData, europaRawData, ganymedeRawData, ioRawData, jupiterRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";
import { SimpleAstronomicalBody } from "./simple-astronomical.object";

export class Jupiter extends Astronomical {
  public moons = [
    new SimpleAstronomicalBody("/assets/textures/2k_io.jpg", "/assets/normals/2k_moon.png", ioRawData, { isMoon: true, rotateTextureHalfTurn: true }),
    new SimpleAstronomicalBody("/assets/textures/2k_europa.jpg", "/assets/normals/2k_moon.png", europaRawData, { isMoon: true, rotateTextureHalfTurn: true }),
    new SimpleAstronomicalBody("/assets/textures/2k_ganymede.jpg", "/assets/normals/2k_moon.png", ganymedeRawData, { isMoon: true, rotateTextureHalfTurn: true }),
    new SimpleAstronomicalBody("/assets/textures/2k_callisto.jpg", "/assets/normals/2k_moon.png", callistoRawData, { isMoon: true, rotateTextureHalfTurn: true }),
  ];

  constructor() {
    super(["/assets/textures/2k_jupiter.jpg"], "/assets/normals/2k_jupiter.png", jupiterRawData, false);
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
    })

    this.generateMaterials()
    this.isInit = true;
  }

  public render(delta: number, camera?: THREE.PerspectiveCamera) {
    super.render(delta);
    this.moons.forEach(moon => {
      moon.render(delta, camera);
    })
  }
}
