import * as THREE from "three";
import { MathUtils } from "three";
import {
  dioneRawData,
  enceladusRawData,
  iapetusRawData,
  mimasRawData,
  rheaRawData,
  saturnRawData,
  tethysRawData,
  titanRawData,
} from "../../data/raw-object.data";
import { PURE_BLACK_MATERIAL } from "../constant/pureBlackMaterial.constant";
import { ringShader } from "../shader/ring.shader";
import { Astronomical } from "./astronomical.object";
import { SimpleAstronomicalBody } from "./simple-astronomical.object";
import type { UpdateContext } from "../core/update-context";

export class Saturn extends Astronomical {
  public cameraPosition = new THREE.Vector3(1, 1, 1);

  public ringMaterial?: THREE.ShaderMaterial;
  public ringMesh?: THREE.Mesh;

  public moons = [
    new SimpleAstronomicalBody(
      "/assets/textures/1k_mimas.png",
      "/assets/normals/2k_moon.png",
      mimasRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/2k_enceladus.jpg",
      "/assets/normals/2k_mars.png",
      enceladusRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/1k_tethys.png",
      "/assets/normals/2k_moon.png",
      tethysRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/1k_dione.png",
      "/assets/normals/2k_moon.png",
      dioneRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/2k_rhea.jpg",
      "/assets/normals/2k_mars.png",
      rheaRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/2k_titan.jpg",
      "/assets/normals/2k_mars.png",
      titanRawData,
      { isMoon: true },
    ),
    new SimpleAstronomicalBody(
      "/assets/textures/2k_iapetus.jpg",
      "/assets/normals/2k_mars.png",
      iapetusRawData,
      { isMoon: true },
    ),
  ];

  constructor() {
    super(
      ["/assets/textures/2k_saturn.jpg"],
      "/assets/normals/2k_saturn.png",
      saturnRawData,
      false,
    );
  }

  init() {
    super.init();

    const ringInnerRadius = this.data.ringInnerRadius;
    const ringOuterRadius = this.data.ringOuterRadius;

    const { vertexShader, fragmentShader } = ringShader;

    const planetWorldPosition = new THREE.Vector3();
    this.mesh.getWorldPosition(planetWorldPosition);

    this.ringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        planetWorldPosition: { value: planetWorldPosition },
        sunWorldPosition: { value: new THREE.Vector3(0, 0, 0) },
        planetRadius: { value: this.data.size / 2 },
        ringTexture: {
          value: new THREE.TextureLoader().load("/assets/textures/2k_saturn_ring_alpha.png"),
        },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
    });

    const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 256);

    const phiSegments = 256;

    const uv = ringGeometry.attributes.uv;
    for (let i = 0; i < phiSegments + 1; i++) {
      uv.setXY(i, i / phiSegments, 0);
      uv.setXY(i + phiSegments + 1, i / phiSegments, 1);
    }

    ringGeometry.attributes.uv.needsUpdate = true;

    this.ringMesh = new THREE.Mesh(ringGeometry, this.ringMaterial);
    this.ringMesh.rotation.x = -Math.PI / 2;

    this.planetaryGroup.add(this.ringMesh);

    this.planetaryGroup.rotateX(MathUtils.DEG2RAD * this.data.planetaryTilt);

    this.moons.forEach(moon => {
      moon.orbitingParent = this;
      moon.init();

      const moonGrp = new THREE.Group();
      moonGrp.add(moon.orbitalGroup);
      moonGrp.rotateX(MathUtils.DEG2RAD * moon.data.orbitalTilt);

      this.group.add(moonGrp);
    });

    this.generateMaterials();
    this.isInit = true;
  }

  public preBloom(): void {
    super.preBloom();
    this.ringMesh.material = PURE_BLACK_MATERIAL;
  }

  public postBloom(): void {
    super.postBloom();
    this.ringMesh.material = this.ringMaterial;
  }

  public render(ctx: UpdateContext) {
    super.render(ctx);

    const planetWorldPosition = new THREE.Vector3();
    this.mesh.getWorldPosition(planetWorldPosition);

    this.moons.forEach(moon => {
      moon.render(ctx);
    });

    if (this.ringMaterial) {
      this.ringMaterial.uniforms.planetWorldPosition.value.copy(planetWorldPosition);
    }
  }
}
