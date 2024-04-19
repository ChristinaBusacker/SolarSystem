import * as THREE from "three";

export interface AstronomicalObject {
  texture: THREE.Texture;
  specMap: THREE.Texture;
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh<THREE.SphereGeometry>;
  camera: THREE.PerspectiveCamera;
  group: THREE.Group;
  orbitalGroup: THREE.Group;
  preBloom: () => void;
  postBloom: () => void;
  init: () => void;
  render: (delta: number, camera?: THREE.PerspectiveCamera, scene?: THREE.Scene) => void
}
