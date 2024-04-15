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
    super("assets/textures/2k_mars.jpg", marsData.size, false, true);
    
    this.group.position.set(
      marsData.initialPosition.x,
      marsData.initialPosition.y,
      marsData.initialPosition.z
    );

    this.marker = this.addMarker(
      marsData.semiMajorAxis,
      marsData.semiMinorAxis
    );

    this.orbitalGroup.add(this.marker);

    this.orbitalGroup.rotateX(MathUtils.DEG2RAD * marsData.orbitalTilt);

    this.mesh.receiveShadow = true

    this.orbitalGroup.position.set(
      marsData.orbitCenter.x,
      marsData.orbitCenter.y,
      marsData.orbitCenter.z
    );
  }

  public render(delta: number, camera?: THREE.PerspectiveCamera) {
    super.render(delta);
  }
}
