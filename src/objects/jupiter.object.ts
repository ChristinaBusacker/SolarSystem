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
    super("assets/textures/2k_jupiter.jpg", jupiterData.size, false, true);
    
    this.group.position.set(
      jupiterData.initialPosition.x,
      jupiterData.initialPosition.y,
      jupiterData.initialPosition.z
    );

    this.marker = this.addMarker(
      jupiterData.semiMajorAxis,
      jupiterData.semiMinorAxis
    );

    this.orbitalGroup.add(this.marker);

    this.orbitalGroup.rotateX(MathUtils.DEG2RAD * jupiterData.orbitalTilt);

    this.mesh.receiveShadow = true

    this.orbitalGroup.position.set(
      jupiterData.orbitCenter.x,
      jupiterData.orbitCenter.y,
      jupiterData.orbitCenter.z
    );
  }

  public render(delta: number, camera?: THREE.PerspectiveCamera) {
    super.render(delta);
  }
}
