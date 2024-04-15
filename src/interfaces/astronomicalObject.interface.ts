import * as THREE from "three";

export interface AstronomicalObject {
  texture: THREE.Texture;
  material: THREE.MeshStandardMaterial;
  mesh: THREE.Mesh<THREE.SphereGeometry>;
  camera: THREE.PerspectiveCamera;
  group: THREE.Group;
  orbitalGroup: THREE.Group;
  render: (delta: number, camera?: THREE.PerspectiveCamera, scene?: THREE.Scene) => void
}
