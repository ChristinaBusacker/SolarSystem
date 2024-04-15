import { AstronomicalObject } from "../interfaces/astronomicalObject.interface";
import * as THREE from "three";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer";
import { simulationSpeed } from "../../data/settings.data";
import { SimpleControl } from "../controls/simple.control";

export class Astronomical implements AstronomicalObject {
  public boundTo?: AstronomicalObject;
  public distance: number;
  public orbitalSpeed = 0;
  public size: number = 1;
  public rotationSpeed: number = 0;
  public texture: THREE.Texture;
  public material: THREE.MeshStandardMaterial;
  public mesh: THREE.Mesh<THREE.SphereGeometry>;
  public camera: THREE.PerspectiveCamera;
  public group: THREE.Group;
  public marker: THREE.Line<
    THREE.BufferGeometry<THREE.NormalBufferAttributes>,
    THREE.LineBasicMaterial
  >;
  public boundingBox?: THREE.BoxHelper;
  public cssObject: CSS3DObject;
  public angle = 0;
  public planetaryGroup = new THREE.Group();
  public orbitalGroup = new THREE.Group();
  public atmosphereMesh?: THREE.Mesh;
  public control: SimpleControl

  public semiMajorAxis = 0;
  public semiMinorAxis = 0;

  public constructor(
    texturePath: string,
    size: number,
    emissive = false,
    debug = false,
  ) {
    const textureLoader = new THREE.TextureLoader();
    this.texture = textureLoader.load(texturePath);

    if (emissive) {
      this.material = new THREE.MeshStandardMaterial({
        map: this.texture,
        emissive: 0xffffff,
        emissiveMap: this.texture,
        emissiveIntensity: 1,
      });
    } else {
      this.material = new THREE.MeshStandardMaterial({
        map: this.texture,
        emissiveMap: this.texture,
        emissiveIntensity: 0.1,
        emissive: 0x222222,
        color: 0xffffff
      });
    }

    const geometry = new THREE.SphereGeometry(size, 64, 32);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.group = new THREE.Group();

    this.planetaryGroup.add(this.mesh);

    if (debug) {
      this.boundingBox = new THREE.BoxHelper(this.mesh, 0xff0000);
      this.planetaryGroup.add(this.boundingBox);
    }

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );

    this.group.add(this.addInteractions());

    this.control = new SimpleControl(size * 10, size * 10, this.camera)
    this.group.add(this.control.group)

    this.group.add(this.planetaryGroup);

    this.orbitalGroup.add(this.group);
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
    const material = new THREE.LineBasicMaterial({ color: 0xaeaeae });
    const ellipse = new THREE.Line(geometry, material);
    ellipse.rotateX(Math.PI / 2);

    return ellipse;
  }

  public addAtmosphere(texturePath: string, size: number) {
    const atmosphereTexture = new THREE.TextureLoader().load(texturePath);
    const atmosphereMaterial = new THREE.MeshStandardMaterial({
      map: atmosphereTexture,
      transparent: true,
      opacity: 1, // Stellen Sie die Opazität entsprechend ein
      blending: THREE.AdditiveBlending,
    });


    const atmosphereGeometry = new THREE.SphereGeometry(size + 0.01, 32, 32); // Atmosphäre leicht größer als die Oberfläche
    this.atmosphereMesh = new THREE.Mesh(
      atmosphereGeometry,
      atmosphereMaterial
    );

    this.atmosphereMesh.castShadow = true
    this.planetaryGroup.add(this.atmosphereMesh);
  }

  public addInteractions() {
    let div = document.createElement("div");
    div.style.width = "25px";
    div.style.height = "25px";
    div.style.borderRadius = "50%";
    div.style.border = "5px solid red";

    document.body.appendChild(div);

    this.cssObject = new CSS3DObject(div);
    return this.cssObject;
  }

  public render(delta: number, activeCamera?: THREE.PerspectiveCamera) {
    if (this.distance > 0) {
      this.angle -= this.orbitalSpeed * delta * 60 * simulationSpeed;
      this.group.position.x = this.semiMajorAxis * Math.cos(this.angle);
      this.group.position.z = this.semiMinorAxis * Math.sin(this.angle);
    }

    this.planetaryGroup.rotation.y += this.rotationSpeed * 60 * delta * simulationSpeed;

    if (activeCamera && this.cssObject) {
      this.cssObject.lookAt(activeCamera.position);
    }

    this.control.update(delta)
  }
}
