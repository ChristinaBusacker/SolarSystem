import { MathUtils } from "three";
import { jupiterData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Jupiter extends Astronomical {
  public name = jupiterData.title
  public orbitalSpeed = jupiterData.orbitalSpeed;
  public cameraPosition = new THREE.Vector3(1, 1, 1);
  public distance = jupiterData.distanceToOrbiting;
  public rotationSpeed = jupiterData.rotationSpeed;

  public semiMajorAxis = jupiterData.semiMajorAxis;
  public semiMinorAxis = jupiterData.semiMinorAxis;

  constructor() {
    super(["assets/textures/2k_jupiter.jpg"], "assets/normals/2k_jupiter.png", jupiterData, false);
  }

  public init() {
    super.init();
    this.isInit = true;
  }

  public render(delta: number, camera?: THREE.PerspectiveCamera) {
    super.render(delta);
  }
}
