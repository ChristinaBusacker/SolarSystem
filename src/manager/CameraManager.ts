import { APP } from "..";
import { SimpleControl } from "../controls/simple.control";
import { CameraEntry } from "../interfaces/entry.interfaces";
import * as THREE from "three";

export class CameraManager {
  public collection: Array<CameraEntry> = [];
  private activeCamera: CameraEntry;

  constructor(scene: THREE.Scene) {
    let defaultCamera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000000,
    );

    defaultCamera.position.set(0, 0, 50);
    const defaultControl = new SimpleControl(1000, 950000, defaultCamera);

    scene.add(defaultControl.group);

    this.addCamera("Default", defaultCamera, defaultControl);
  }

  public addCamera(
    selector: string,
    camera: THREE.PerspectiveCamera,
    control: SimpleControl,
  ): CameraManager {
    const entry: CameraEntry = { selector, camera, control };
    this.collection.push(entry);

    return this;
  }

  public removeCamera(selector: string): CameraManager {
    this.collection = this.collection.filter(
      (entry) => entry.selector !== selector,
    );
    return this;
  }

  public switchCamera(selector: string): CameraManager {
    APP.cssRenderer.domElement.querySelectorAll(`.object`).forEach((elem) => {
      elem.classList.remove("hide");
    });

    if (selector !== "Default") {
      APP.cssRenderer.domElement.classList.remove("hideMoons");
      const marker = APP.cssRenderer.domElement.querySelector(
        `.object.${selector}`,
      );
      marker.classList.add("hide");
    } else {
      APP.cssRenderer.domElement.classList.add("hideMoons");
    }

    const entry = this.collection.find((entry) => entry.selector === selector);

    if (!entry) {
      console.error(`Cant find camera with selector ${selector}`);
    } else {
      this.activeCamera = entry;
      APP.updateComposer(entry.camera);
    }

    // Keep aspect in sync with the stage size (not the window).
    const viewport = document.getElementById("scene-root");
    if (viewport) {
      const rect = viewport.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      this.activeCamera.camera.aspect = w / h;
      this.activeCamera.camera.updateProjectionMatrix();
    }

    return this;
  }

  public getActiveEntry(): CameraEntry {
    return this.activeCamera;
  }

  public initEventControls(): CameraManager {
    this.activeCamera.control.initEventListener();
    return this;
  }

  public updateControls(delta: number) {
    this.collection.forEach((entry) => entry.control.update(delta));
  }
}
