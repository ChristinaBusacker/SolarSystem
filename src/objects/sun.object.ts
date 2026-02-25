import * as THREE from "three";
import { APP } from "..";
import { sunRawData } from "../../data/raw-object.data";
import { coronaShader } from "../shader/corona";
import { sunShader } from "../shader/sun.shader";
import { Astronomical } from "./astronomical.object";

export class Sun extends Astronomical {
  public cameraPosition = new THREE.Vector3(10, 10, 10);
  private coronaShaderMaterial: THREE.ShaderMaterial;

  constructor() {
    super(["/assets/textures/2k_sun.jpg"], "/assets/normals/2k_jupiter.png", sunRawData, true);
  }

  public init() {
    super.init()

    const { vertexShader, fragmentShader } = sunShader

    this.mesh.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunTexture: { value: this.texture },
        sunSpotsTexture: { value: this.texture },
        myCameraPosition: { value: APP.cameraManager.getActiveEntry().camera.position }, // Initialisiere mit einem Vektor
        cameraFar: { value: APP.cameraManager.getActiveEntry().camera.far } // Verwende die Far-Plane der Kamera
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });


    // Adding Corona to sun
    this.coronaShaderMaterial = new THREE.ShaderMaterial(coronaShader);
    const coronaGeometry = new THREE.SphereGeometry(this.data.size / 2, 64, 64); // Adjust the radius to fit around your sun
    const coronaMesh = new THREE.Mesh(
      coronaGeometry,
      this.coronaShaderMaterial
    );

    coronaMesh.position.set(0, 0, 0);
    this.group.add(coronaMesh);
  }

  public render(delta: number, camera?: THREE.PerspectiveCamera): void {
    this.mesh.rotation.y += this.data.rotationSpeed * delta * APP.simulationSpeed;
    this.coronaShaderMaterial.uniforms.time.value += delta * APP.simulationSpeed;
    super.render(delta);
  }
}
