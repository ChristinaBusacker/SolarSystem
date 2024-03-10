import { MathUtils } from "three";
import { mercuryData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Mercury extends Astronomical {
  public orbitalSpeed = mercuryData.orbitalSpeed;
  public cameraPosition = new THREE.Vector3(1, 1, 1);
  public distance = mercuryData.distanceToOrbiting;
  public rotationSpeed = mercuryData.rotationSpeed;

  public semiMajorAxis = mercuryData.semiMajorAxis;
  public semiMinorAxis = mercuryData.semiMinorAxis;

  constructor() {
    super("assets/textures/2k_mercury.jpg", mercuryData.size, false, true);
    this.group.position.set(
      mercuryData.initialPosition.x,
      mercuryData.initialPosition.y,
      mercuryData.initialPosition.z
    );

    this.group.position.set(this.distance, 0, 0); // Setzen Sie die anfängliche Position der Gruppe

    this.marker = this.addMarker(
      mercuryData.semiMajorAxis,
      mercuryData.semiMinorAxis
    );
    this.camera = this.addCamera(new THREE.Vector3(3, 3, 3));

    this.orbitalGroup.add(this.marker);

    this.orbitalGroup.rotateX(MathUtils.DEG2RAD * mercuryData.orbitalTilt);
    this.orbitalGroup.position.set(
      mercuryData.orbitCenter.x,
      mercuryData.orbitCenter.y,
      mercuryData.orbitCenter.z
    );
  }

  public render(delta: number, camera?: THREE.PerspectiveCamera) {
    super.render(delta);
  }
}
