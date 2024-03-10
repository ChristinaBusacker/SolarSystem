import * as THREE from "three";
import { Sun } from "./objects/sun.object";
import { Mercury } from "./objects/mercury.object";
import Stats from "stats.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PMREMGenerator } from "three";
import { Venus } from "./objects/venus.object";
import { Earth } from "./objects/earth.object";
import CustomControl from "./controls/custom.control";
import { CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer";

const scene = new THREE.Scene();
const clock = new THREE.Clock();
const cssRenderer = new CSS3DRenderer();
const stats = new Stats();
document.body.appendChild(stats.dom);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

let defaultCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
defaultCamera.position.set(1000, 1000, 500);

let activeCamera: THREE.PerspectiveCamera = defaultCamera;

window.addEventListener("resize", function () {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  cssRenderer.setSize(window.innerWidth, window.innerHeight);
  activeCamera.aspect = width / height;
  activeCamera.updateProjectionMatrix();
});

const light = new THREE.PointLight(0xffffcc, 100000, 5000000);
light.position.set(0, 0, 0);

scene.add(light);

loadBackground(scene);

const sun = new Sun();
const mercury = new Mercury();
const venus = new Venus();
const earth = new Earth();

const objects = [sun, mercury, venus, earth];
objects.forEach((obj) => {
  scene.add(obj.orbitalGroup);
});

const controls = new CustomControl(
  defaultCamera,
  sun.mesh,
  renderer.domElement
);

cssRenderer.domElement.classList.add("css-renderer");
document.body.appendChild(cssRenderer.domElement);

function animate() {
  stats.begin();
  const deltaTime = clock.getDelta();

  objects.forEach((obj) => obj.render(deltaTime, activeCamera, scene));

  renderer.render(scene, activeCamera);
  cssRenderer.render(scene, activeCamera);
  stats.end();

  requestAnimationFrame(animate);
}

animate();

const cameraSelector = document.getElementById("cameraSelector");

cameraSelector.addEventListener("change", function (event) {
  const selectedCamera = (event.target as HTMLSelectElement).value;
  updateCamera(selectedCamera);
});

function updateCamera(selectedCamera: string) {
  let targetObject;
  cssRenderer.domElement.classList.add("hide");
  switch (selectedCamera) {
    case "sun":
      activeCamera = sun.camera;
      controls.setCamera(sun.camera);
      controls.setMesh(sun.mesh);
      break;
    case "mercury":
      activeCamera = mercury.camera;
      controls.setCamera(mercury.camera);
      controls.setMesh(mercury.mesh);
      break;
    case "venus":
      activeCamera = venus.camera;
      controls.setCamera(venus.camera);
      controls.setMesh(venus.mesh);
      break;
    case "earth":
      activeCamera = earth.camera;
      controls.setCamera(earth.camera);
      controls.setMesh(earth.mesh);
      break;
    case "moon":
      activeCamera = earth.moon.camera;
      controls.setCamera(earth.moon.camera);
      controls.setMesh(earth.moon.mesh);
      break;
    default:
      activeCamera = defaultCamera;
      controls.setCamera(defaultCamera);
      controls.setMesh(sun.mesh);
      cssRenderer.domElement.classList.remove("hide");
      break;
  }
  controls.update();
  // Aktualisieren der Aspect-Ratio und der Projektionsmatrix
  activeCamera.aspect = window.innerWidth / window.innerHeight;
  activeCamera.updateProjectionMatrix();
}

async function loadBackground(scene: THREE.Scene) {
  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const loader = new THREE.TextureLoader();
  const backgroundImage = await loader.loadAsync(
    "assets/backgrounds/background4.jpg"
  );

  scene.background =
    pmremGenerator.fromEquirectangular(backgroundImage).texture;

  pmremGenerator.dispose();
}

updateCamera("default");

console.log(scene);
