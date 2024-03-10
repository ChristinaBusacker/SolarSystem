import * as THREE from "three";

export interface AstronomicalObject {
  boundTo?: AstronomicalObject;
  distance: number;
  size: number;
  rotationSpeed: number;
  orbitalSpeed: number;
  texture: THREE.Texture;
  material: THREE.MeshStandardMaterial;
  mesh: THREE.Mesh<THREE.SphereGeometry>;
  camera: THREE.PerspectiveCamera;
  group: THREE.Group;
  cameraPosition: THREE.Vector3;
}
