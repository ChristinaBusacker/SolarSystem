import { MathUtils } from "three";
import { mercuryData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Mercury extends Astronomical {
  public name = mercuryData.title
  public orbitalSpeed = mercuryData.orbitalSpeed;
  public cameraPosition = new THREE.Vector3(1, 1, 1);
  public distance = mercuryData.distanceToOrbiting;
  public rotationSpeed = mercuryData.rotationSpeed;

  public semiMajorAxis = mercuryData.semiMajorAxis;
  public semiMinorAxis = mercuryData.semiMinorAxis;

  constructor() {
    super("assets/textures/2k_mercury.jpg", mercuryData, false);
    this.mesh.receiveShadow = true
  }

  public render(delta: number, camera?: THREE.PerspectiveCamera) {
    super.render(delta);
  }
}
