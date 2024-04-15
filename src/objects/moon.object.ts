import { moonData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Moon extends Astronomical {
  public orbitalSpeed = moonData.orbitalSpeed;
  public distance = moonData.distanceToOrbiting;
  public rotationSpeed = moonData.rotationSpeed;

  
  public semiMajorAxis = moonData.semiMajorAxis;
  public semiMinorAxis = moonData.semiMinorAxis;

  constructor() {
    super("assets/textures/2k_moon.jpg", moonData.size, false, true);

    this.group.position.set(
      moonData.initialPosition.x,
      moonData.initialPosition.y,
      moonData.initialPosition.z
    );

    this.mesh.receiveShadow = true;
    this.mesh.rotation.y = (-1 * Math.PI) / 2;
  }

  public getCurrentPosition() {
    return this.group.position.clone();
  }

  public render(delta: number, activeCamera: THREE.PerspectiveCamera) {
    super.render(delta, activeCamera);
  }
}
