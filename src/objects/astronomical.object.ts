import { AstronomicalObject } from "../interfaces/astronomicalObject.interface";
import * as THREE from "three";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer";
import { simulationSpeed } from "../../data/settings.data";
import { SimpleControl } from "../controls/simple.control";
import { AstronomicalDataset } from "../interfaces/dataset.interface";
import { APP } from "..";
import { astronomicalShader } from "../shader/astronomical.shader";
import { earthShader } from "../shader/earth.shader";
import { PURE_BLACK_MATERIAL } from "../constant/pureBlackMaterial.constant";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

export class Astronomical implements AstronomicalObject {
  public data?: AstronomicalDataset;

  public texture: THREE.Texture;
  public texturePath: Array<string>
  public material: THREE.ShaderMaterial;
  public bloomMaterial: THREE.ShaderMaterial;
  public mesh: THREE.Mesh<THREE.SphereGeometry>;
  public camera: THREE.PerspectiveCamera;
  public group = new THREE.Group();
  public marker: THREE.Line<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.LineBasicMaterial
  >;

  public cssObject: CSS2DObject;
  public angle = 0;
  public planetaryGroup = new THREE.Group();
  public orbitalGroup = new THREE.Group();
  public atmosphereMesh?: THREE.Mesh;
  public atmosphereMaterial?: THREE.ShaderMaterial
  public control: SimpleControl
  public specMap: THREE.Texture
  public moons: Array<AstronomicalObject> = []
  public orbitingParent?: AstronomicalObject
  public isMoon = false;

  public materials: Array<THREE.ShaderMaterial> = []

  private initialOffset = 7000000 * 9

  public emissive = false

  public isInit = false

  public constructor(
    texturePath: Array<string>,
    normalPath: string,
    data: AstronomicalDataset,
    emissive = false,
  ) {
    this.data = data
    const textureLoader = new THREE.TextureLoader();
    this.texturePath = texturePath
    this.texture = textureLoader.load(texturePath[0]);
    this.specMap = textureLoader.load('/assets/spec/2k_earth_specular_map.png');
    this.emissive = emissive

    this.angle = this.data.orbitalSpeed * this.initialOffset
  }

  public addMarker(
    minDistance: number,
    maxDistance: number
  ): THREE.Line<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.LineBasicMaterial
  > {
    const orbitCurve = new THREE.EllipseCurve(
      0,
      0, // ax, aY
      minDistance,
      maxDistance, // xRadius, yRadius
      0,
      2 * Math.PI, // aStartAngle, aEndAngle
      false, // aClockwise
      0 // aRotation
    );

    const points = orbitCurve.getPoints(2000);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(this.data.color)
    });


    const ellipse = new THREE.Line(geometry, material);

    ellipse.rotateX(Math.PI / 2);

    return ellipse;
  }

  private setInitialPosition() {
    this.group.position.set(
      this.data.initialPosition.x,
      this.data.initialPosition.y,
      this.data.initialPosition.z
    );
  }

  private initOrbit() {
    this.marker = this.addMarker(
      this.data.semiMajorAxis,
      this.data.semiMinorAxis
    );

    this.orbitalGroup.add(this.marker);
    this.orbitalGroup.rotateX(THREE.MathUtils.DEG2RAD * this.data.orbitalTilt);
    this.orbitalGroup.position.set(
      this.data.orbitCenter.x,
      this.data.orbitCenter.y,
      this.data.orbitCenter.z
    );
  }

  public initCameraAndControl() {
    if (!this.data.denyCamera) {
      this.camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        9000000
      );

      this.control = new SimpleControl(this.data.size * 6, this.data.size * 12, this.camera)
      this.control.initEventListener();
      this.group.add(this.control.group)

      APP.cameraManager.addCamera(this.data.name, this.camera, this.control)
    }
  }

  public addAtmosphere(texturePath: string, size: number) {
    const atmosphereTexture = new THREE.TextureLoader().load(texturePath);

    const { vertexShader, fragmentShader } = astronomicalShader

    const casterOptions: any = {
      casterPosition1: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius1: { value: 0.0 },
      casterPosition2: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius2: { value: 0.0 },
      casterPosition3: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius3: { value: 0.0 },
      casterPosition4: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius4: { value: 0.0 }
    }

    const options = {
      dayTexture: { value: atmosphereTexture },
      sunPosition: { value: new THREE.Vector3(0, 0, 0) },
      lightIntensity: { value: 1.0 },
      shininess: { value: 16 },
      ...casterOptions
    }

    this.atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ...options,
        lightColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });


    const atmosphereGeometry = new THREE.SphereGeometry(size + 0.0001, 128, 128); // Atmosphäre leicht größer als die Oberfläche
    this.atmosphereMesh = new THREE.Mesh(
      atmosphereGeometry,
      this.atmosphereMaterial
    );

    this.materials.push(this.atmosphereMaterial)
    this.atmosphereMesh.name = this.data.name + " Atmo"

    this.planetaryGroup.add(this.atmosphereMesh);
  }

  public addInteractions() {

    let div = document.createElement("div");
    div.style.width = "5px";
    div.style.height = "5px";
    div.style.backgroundColor = this.data.color
    div.style.border = "2px solid " + this.data.color
    div.style.borderRadius = "50%";
    div.style.cursor = "pointer"

    div.dataset.body = this.data.name;
    div.dataset.kind = this.isMoon ? 'moon' : 'planet';

    div.classList.add('object', this.isMoon ? 'moon' : 'planet', this.isMoon ? this.orbitingParent.data.name : this.data.name, this.data.name)


    let p = document.createElement('p')
    p.style.color = 'white'
    p.innerText = this.data.name
    div.appendChild(p)

    div.onclick = (ev) => {
      ev.stopPropagation();
      window.dispatchEvent(
        new CustomEvent("ui:select-body", {
          detail: {
            name: this.data.name,
            kind: this.isMoon ? "moon" : "planet",
          },
        }),
      );
    }

    document.body.appendChild(div);

    this.cssObject = new CSS2DObject(div);
    return this.cssObject;
  }

  public getShadowCasters() {
    const shadowCasters = this.isMoon ? [this.orbitingParent, ...this.orbitingParent.moons.filter((moon) => moon !== this)] : this.moons

    return shadowCasters.map((caster) => {
      const position = new THREE.Vector3();
      caster.mesh.getWorldPosition(position);

      return {
        radius: caster.data.size,
        name: caster.data.name,
        position: [position.x, position.y, position.z]
      }
    })
  }

  public generateMaterials() {
    const { vertexShader, fragmentShader } = this.texturePath.length < 2 ? astronomicalShader : earthShader

    const casterOptions: any = {
      casterPosition1: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius1: { value: 0.0 },
      casterPosition2: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius2: { value: 0.0 },
      casterPosition3: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius3: { value: 0.0 },
      casterPosition4: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius4: { value: 0.0 }
    }

    const options = {
      dayTexture: { value: this.texturePath[0] ? this.texture : null },
      nightTexture: { value: this.texturePath[1] ? new THREE.TextureLoader().load(this.texturePath[1]) : this.texturePath[0] ? this.texture : null },
      sunPosition: { value: new THREE.Vector3(0, 0, 0) },
      lightIntensity: { value: 1.0 },
      specMap: { value: this.specMap },
      shininess: { value: 16 },
      ...casterOptions
    }

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        ...options,
        lightColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide
    });

    this.bloomMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ...options,
        lightColor: { value: new THREE.Color(0xaaaaaa) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide
    });

    this.materials.push(this.material)
    this.materials.push(this.bloomMaterial)
    this.mesh.material = this.material
  }

  public init() {
    const geometry = new THREE.SphereGeometry(this.data.size, 64, 32);

    this.mesh = new THREE.Mesh(geometry);
    this.mesh.name = this.data.name;
    this.group.name = this.data.name + " Gruppe"
    this.planetaryGroup.name = this.data.name + " planetaryGroup"
    this.orbitalGroup.name = this.data.name + " orbitalGroup"

    this.planetaryGroup.add(this.mesh);
    this.planetaryGroup.rotateX(this.data.planetaryTilt * THREE.MathUtils.DEG2RAD * 0.5)

    this.group.add(this.addInteractions());

    this.setInitialPosition();
    this.initOrbit();
    this.initCameraAndControl();

    this.group.add(this.planetaryGroup);

    this.orbitalGroup.add(this.group);
  }

  public preBloom(): void {
    if (!this.emissive) {
      this.mesh.material = this.bloomMaterial
      this.marker.material.color = new THREE.Color(0x000000);
      if (this.atmosphereMesh) {
        this.atmosphereMesh.material = PURE_BLACK_MATERIAL
      }

    }
  }

  public postBloom(): void {
    if (!this.emissive) {
      this.mesh.material = this.material
      this.marker.material.color = new THREE.Color(this.data.color)

      if (this.atmosphereMesh) {
        this.atmosphereMesh.material = this.atmosphereMaterial
      }
    }
  }

  public render(delta: number, activeCamera?: THREE.PerspectiveCamera) {
    if (!this.isInit) return

    if ((this.orbitingParent || this.moons.length > 0) && this.material) {

      const shadowCasters = this.getShadowCasters();

      this.materials.forEach((material) => {
        const params: any = {}

        shadowCasters.forEach((caster, i) => {
          params[`casterPosition${i + 1}`] = { value: caster.position };
          params[`casterRadius${i + 1}`] = { value: caster.radius };
        })

        Object.assign(material.uniforms, params)
      })

    }

    if (this.data.distanceToOrbiting > 0) {
      this.angle -= this.data.orbitalSpeed * delta * 60 * APP.simulationSpeed;
      this.group.position.x = this.data.semiMajorAxis * Math.cos(this.angle);
      this.group.position.z = this.data.semiMinorAxis * Math.sin(this.angle);
    }

    this.planetaryGroup.rotation.y += this.data.rotationSpeed * 60 * delta * APP.simulationSpeed;

    if (activeCamera && this.cssObject) {
      this.cssObject.lookAt(activeCamera.position);
    }
  }
}
