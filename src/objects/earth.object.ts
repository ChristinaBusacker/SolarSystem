import {
  earthData,
  mercuryData,
  moonData,
  venusData,
} from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { earthMaterial } from "../shader/earth";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";
import { Moon } from "./moon.object";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";
import { MathUtils } from "three";

export class Earth extends Astronomical {
  public orbitalSpeed = earthData.orbitalSpeed;
  public distance = earthData.distanceToOrbiting;
  public rotationSpeed = earthData.rotationSpeed;
  public moon?: Moon
  public cameraPosition = new THREE.Vector3(-4, 4, 4);


  public semiMajorAxis = earthData.semiMajorAxis;
  public semiMinorAxis = earthData.semiMinorAxis;

  constructor(domElement: HTMLCanvasElement) {
    super("assets/textures/2k_earth_daymap.jpg", earthData.size, false, true, domElement);
    this.moon = new Moon(domElement);


    this.group.position.set(
      earthData.initialPosition.x,
      earthData.initialPosition.y,
      earthData.initialPosition.z
    );

    this.mesh.material = earthMaterial;

    this.addAtmosphere("assets/textures/2k_earth_clouds.jpg", earthData.size);

    const orbitCurve = new THREE.EllipseCurve(
      0,
      0, // ax, aY
      moonData.distanceToOrbiting,
      moonData.distanceToOrbiting, // xRadius, yRadius
      0,
      2 * Math.PI, // aStartAngle, aEndAngle
      false, // aClockwise
      0 // aRotation
    );

    const points = orbitCurve.getPoints(2000);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xaeaeae });
    const ellipse = new THREE.Line(geometry, material);

    ellipse.rotateX(Math.PI / 2);

    const moonGrp = new THREE.Group();

    moonGrp.add(this.moon.group);
    moonGrp.add(ellipse);

    moonGrp.rotateX(MathUtils.DEG2RAD * -5.145);

    this.group.add(moonGrp);

    this.mesh.rotation.z = THREE.MathUtils.degToRad(-23.5);
    this.marker = this.addMarker(
      earthData.semiMajorAxis,
      earthData.semiMinorAxis
    );

    this.group.add(this.addInteractions());

    this.orbitalGroup.add(this.marker);
    this.orbitalGroup.rotateX(MathUtils.DEG2RAD * earthData.orbitalTilt);
    this.orbitalGroup.position.set(
      earthData.orbitCenter.x,
      earthData.orbitCenter.y,
      earthData.orbitCenter.z
    );
  }

  private adjustAxisTilt() {
    const moonPosition = this.moon.getCurrentPosition();
    const tiltAdjustment = moonPosition.x;

    this.mesh.rotation.z = THREE.MathUtils.degToRad(tiltAdjustment);
    this.atmosphereMesh.rotation.z = THREE.MathUtils.degToRad(tiltAdjustment);
  }

  public render(
    delta: number,
    camera?: THREE.PerspectiveCamera,
    scene?: THREE.Scene
  ) {
    this.atmosphereMesh.rotation.y +=
      this.rotationSpeed * 60 * delta * 0.8 * simulationSpeed;

    this.moon.camera.lookAt(this.moon.mesh.position);
    this.moon.group.lookAt(this.group.position);
    this.moon.render(delta);
    this.adjustAxisTilt();
    super.render(delta, camera);
  }
}
