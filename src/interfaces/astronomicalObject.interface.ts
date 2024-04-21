import * as THREE from "three";
import { AstronomicalDataset } from "./dataset.interface";

export interface AstronomicalObject {
  texture: THREE.Texture;
  specMap: THREE.Texture;
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh<THREE.SphereGeometry>;
  camera: THREE.PerspectiveCamera;
  group: THREE.Group;
  orbitalGroup: THREE.Group;
  moons: Array<AstronomicalObject>
  data?: AstronomicalDataset;
  isMoon: boolean;
  preBloom: () => void;
  postBloom: () => void;
  init: () => void;
  render: (delta: number, camera?: THREE.PerspectiveCamera, scene?: THREE.Scene) => void
}
