import * as THREE from "three";
import { AstronomicalDataset } from "./dataset.interface";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import type { UpdateContext } from "../core/update-context";

export interface AstronomicalObject {
  texture: THREE.Texture;
  specMap: THREE.Texture;
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh<THREE.SphereGeometry>;
  camera: THREE.PerspectiveCamera;
  group: THREE.Group;
  orbitalGroup: THREE.Group;
  moons: Array<AstronomicalObject>;
  data?: AstronomicalDataset;
  isMoon: boolean;
  marker: Line2;
  cssObject: CSS2DObject;
  preBloom: () => void;
  postBloom: () => void;
  init: () => void;
  render: (ctx: UpdateContext) => void;
}
