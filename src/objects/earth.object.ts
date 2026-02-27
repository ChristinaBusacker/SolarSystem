import * as THREE from "three";
import { Astronomical } from "./astronomical.object";
import { SimpleAstronomicalBody } from "./simple-astronomical.object";

import { MathUtils } from "three";
import type { UpdateContext } from "../core/update-context";
import { earthRawData, moonRawData } from "../../data/raw-object.data";

export class Earth extends Astronomical {
  public moon = new SimpleAstronomicalBody(
    "/assets/textures/2k_moon.jpg",
    "/assets/normals/2k_moon.png",
    moonRawData,
    { isMoon: true, rotateTextureHalfTurn: false },
  );
  public moons = [this.moon];
  public cameraPosition = new THREE.Vector3(-4, 4, 4);

  constructor() {
    super(
      ["/assets/textures/2k_earth_daymap.jpg", "/assets/textures/2k_earth_nightmap.jpg"],
      "/assets/normals/2k_earth.png",
      earthRawData,
      false,
    );
  }

  public init() {
    super.init();

    this.addAtmosphere("/assets/textures/2k_earth_clouds_alpha.png", this.data.size);

    const textureLoader = new THREE.TextureLoader();
    this.specMap = textureLoader.load("/assets/spec/2k_earth_specular_map.png");

    this.moon.orbitingParent = this;
    this.moon.init();

    const moonGrp = new THREE.Group();
    moonGrp.add(this.moon.orbitalGroup);
    moonGrp.rotateX(MathUtils.DEG2RAD * this.moon.data.orbitalTilt);

    this.group.add(moonGrp);

    this.generateMaterials();
    //this.planetaryGroup.rotation.z = THREE.MathUtils.degToRad(this.data.planetaryTilt);
    this.isInit = true;
  }

  private adjustAxisTilt() {
    const moonPosition = this.moon.getCurrentPosition();

    if (moonPosition) {
      const tiltAdjustment = moonPosition.x;

      this.mesh.rotation.z = THREE.MathUtils.degToRad(tiltAdjustment);
      this.atmosphereMesh.rotation.z = THREE.MathUtils.degToRad(tiltAdjustment);
    }
  }

  public preBloom(): void {
    super.preBloom();
    if (!this.moon.emissive) {
      this.moon.preBloom();
      //this.moon.marker.material.color = new THREE.Color(0x000000);
    }
  }

  public postBloom(): void {
    super.postBloom();
    if (!this.moon.emissive) {
      this.moon.postBloom();
      //this.moon.marker.material.color = new THREE.Color(0xffffff);
    }
  }

  public render(ctx: UpdateContext) {
    if (!this.isInit) return;

    if (this.atmosphereMesh) {
      this.atmosphereMesh.rotation.y +=
        this.data.rotationSpeed * 8 * ctx.delta * 0.8 * ctx.simSpeed * -1;
    }

    super.render(ctx);
    this.moon.render(ctx);
  }
}
