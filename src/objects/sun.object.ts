import { sunData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";

export class Sun extends Astronomical {
  public cameraPosition = new THREE.Vector3(20, 20, 20);
  private coronaShaderMaterial: THREE.ShaderMaterial;

  constructor() {
    super("assets/textures/2k_sun.jpg", sunData, true);

    // Adding Corona to sun
    this.coronaShaderMaterial = new THREE.ShaderMaterial(coronaShader);
    const coronaGeometry = new THREE.SphereGeometry(92, 64, 64); // Adjust the radius to fit around your sun
    const coronaMesh = new THREE.Mesh(
      coronaGeometry,
      this.coronaShaderMaterial
    );

    this.mesh.receiveShadow = false
    this.mesh.castShadow = false

    coronaMesh.position.set(0, 0, 0);
    this.group.add(coronaMesh);
  }

  public render(delta: number, camera?: THREE.PerspectiveCamera): void {
    this.mesh.rotation.y += this.data.rotationSpeed * delta * simulationSpeed;
    this.coronaShaderMaterial.uniforms.time.value += delta;
    super.render(delta);
  }
}
