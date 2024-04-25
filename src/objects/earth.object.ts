import {
  earthData,
  mercuryData,
  moonData,
  venusData,
} from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";
import { Moon } from "./moon.object";

import { MathUtils } from "three";
import { PURE_BLACK_MATERIAL } from "../constant/pureBlackMaterial.constant";
import { APP } from "..";


export class Earth extends Astronomical {
  public moon = new Moon();
  public moons = [this.moon]
  public cameraPosition = new THREE.Vector3(-4, 4, 4);

  constructor() {
    super(["assets/textures/2k_earth_daymap.jpg", "assets/textures/2k_earth_nightmap.jpg"], "assets/normals/2k_earth.png", earthData, false);
  }

  public init() {
    super.init();

    this.addAtmosphere("assets/textures/2k_earth_clouds_alpha.png", earthData.size);

    this.moon.orbitingParent = this;
    this.moon.init()

    const moonGrp = new THREE.Group();
    moonGrp.add(this.moon.orbitalGroup);
    moonGrp.rotateX(MathUtils.DEG2RAD * -5.145);

    this.group.add(moonGrp);

    this.generateMaterials()
    //this.planetaryGroup.rotation.z = THREE.MathUtils.degToRad(this.data.planetaryTilt);
    this.isInit = true
  }

  private adjustAxisTilt() {
    const moonPosition = this.moon.getCurrentPosition();

    if (moonPosition) {
      const tiltAdjustment = moonPosition.x;
      console.log(tiltAdjustment)

      this.mesh.rotation.z = THREE.MathUtils.degToRad(tiltAdjustment);
      this.atmosphereMesh.rotation.z = THREE.MathUtils.degToRad(tiltAdjustment);
    }

  }

  public preBloom(): void {
    super.preBloom()
    if (!this.moon.emissive) {
      this.moon.preBloom()
      //this.moon.marker.material.color = new THREE.Color(0x000000);
    }
  }

  public postBloom(): void {
    super.postBloom()
    if (!this.moon.emissive) {
      this.moon.postBloom()
      //this.moon.marker.material.color = new THREE.Color(0xffffff);
    }
  }

  public render(
    delta: number,
    camera?: THREE.PerspectiveCamera,
    scene?: THREE.Scene
  ) {
    if (!this.isInit) return

    if (this.atmosphereMesh) {
      this.atmosphereMesh.rotation.y +=
        this.data.rotationSpeed * 8 * delta * 0.8 * APP.simulationSpeed * -1;
    }


    super.render(delta, camera);
    this.moon.render(delta, camera);

    let wp = new THREE.Vector3();
    this.group.getWorldPosition(wp)
    this.moon?.group?.lookAt(wp);

  }
}
