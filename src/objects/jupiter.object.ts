import { MathUtils } from "three";
import { jupiterData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";
import { Io } from "./io.object";
import { Europa } from "./europa.object";
import { Ganymede } from "./ganymede.object";
import { Callisto } from "./callisto.object";

export class Jupiter extends Astronomical {

  public moons = [
    new Io(), new Europa(), new Ganymede(), new Callisto()
  ]

  public io = new Io();
  public europa = new Europa();
  public ganymede = new Ganymede();
  public callisto = new Callisto();

  constructor() {
    super(["assets/textures/2k_jupiter.jpg"], "assets/normals/2k_jupiter.png", jupiterData, false);
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
