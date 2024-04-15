import { MathUtils } from "three";
import { earthData, mercuryData, venusData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";
import { Moon } from "./moon.object";

export class Venus extends Astronomical {
  public name = venusData.title
  public orbitalSpeed = venusData.orbitalSpeed;
  public cameraPosition = new THREE.Vector3(1, 1, 1);
  public distance = venusData.distanceToOrbiting;
  public rotationSpeed = venusData.rotationSpeed;
  public atmosphereMesh: THREE.Mesh;
  public semiMajorAxis = venusData.semiMajorAxis;
  public semiMinorAxis = venusData.semiMinorAxis;

  constructor() {
    super("assets/textures/2k_venus_surface.jpg", venusData.size, false, true);

    this.group.position.set(
      venusData.initialPosition.x,
      venusData.initialPosition.y,
      venusData.initialPosition.z
    );

    this.addAtmosphere(
      "assets/textures/2k_venus_atmosphere.jpg",
      venusData.size
    );

    this.marker = this.addMarker(
      venusData.semiMajorAxis,
      venusData.semiMinorAxis
    );

    this.orbitalGroup.add(this.marker);
    this.orbitalGroup.rotateX(MathUtils.DEG2RAD * venusData.orbitalTilt);
    this.orbitalGroup.position.set(
      venusData.orbitCenter.x,
      venusData.orbitCenter.y,
      venusData.orbitCenter.z
    );
  }

  public render(delta: number, activeCamera?: THREE.PerspectiveCamera) {
    this.atmosphereMesh.rotation.y =
      this.rotationSpeed * delta * 60 * simulationSpeed * 1.25;
    super.render(delta, activeCamera);
  }
}
