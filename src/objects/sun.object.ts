import { APP } from "..";
import { sunData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { sunShader } from "../shader/sun.shader";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Sun extends Astronomical {
  public cameraPosition = new THREE.Vector3(20, 20, 20);
  private coronaShaderMaterial: THREE.ShaderMaterial;

  constructor() {
    super(["assets/textures/2k_sun.jpg"], sunData, true);
  }

  public init() {
    super.init()

    const { vertexShader, fragmentShader } = sunShader

    console.log('cameraPosition', APP.cameraManager.getActiveEntry().camera.position)

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
    const coronaGeometry = new THREE.SphereGeometry(92, 64, 64); // Adjust the radius to fit around your sun
    const coronaMesh = new THREE.Mesh(
      coronaGeometry,
      this.coronaShaderMaterial
    );

    coronaMesh.position.set(0, 0, 0);
    this.group.add(coronaMesh);
  }

  public render(delta: number, camera?: THREE.PerspectiveCamera): void {
    this.mesh.rotation.y += this.data.rotationSpeed * delta * simulationSpeed;
    this.coronaShaderMaterial.uniforms.time.value += delta * simulationSpeed;
    super.render(delta);
  }
}
