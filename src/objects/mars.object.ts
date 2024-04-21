import { MathUtils } from "three";
import { marsData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Mars extends Astronomical {
  public name = marsData.title
  public orbitalSpeed = marsData.orbitalSpeed;
  public cameraPosition = new THREE.Vector3(1, 1, 1);
  public distance = marsData.distanceToOrbiting;
  public rotationSpeed = marsData.rotationSpeed;

  public semiMajorAxis = marsData.semiMajorAxis;
  public semiMinorAxis = marsData.semiMinorAxis;

  constructor() {
    super(["assets/textures/2k_mars.jpg"], "assets/normals/2k_mars.png", marsData, false);
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
