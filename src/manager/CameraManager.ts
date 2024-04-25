import { APP } from "..";
import { SimpleControl } from "../controls/simple.control";
import { CameraEntry } from "../interfaces/entry.interfaces";
import * as THREE from "three";

export class CameraManager {
    public collection: Array<CameraEntry> = []
    private activeCamera: CameraEntry

    constructor(scene: THREE.Scene) {
        let defaultCamera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000000
        );

        defaultCamera.position.set(0, 0, 0);
        const defaultControl = new SimpleControl(100, 100000, defaultCamera)

        scene.add(defaultControl.group)

        this.addCamera('Default', defaultCamera, defaultControl)
    }

    public addCamera(selector: string, camera: THREE.PerspectiveCamera, control: SimpleControl): CameraManager {
        const entry: CameraEntry = { selector, camera, control }
        this.collection.push(entry);

        const option = document.createElement('option')
        option.innerText = selector + ' Camera'
        option.value = selector

        document.getElementById('cameraSelector').appendChild(option)

        return this
    }

    public removeCamera(selector: string): CameraManager {
        this.collection = this.collection.filter(entry => entry.selector !== selector)
        return this
    }

    public switchCamera(selector: string): CameraManager {

        APP.cssRenderer.domElement.querySelectorAll(`.object`).forEach((elem) => {
            elem.classList.remove('hide')
        })

        if (selector !== 'Default') {
            APP.cssRenderer.domElement.classList.remove("hideMoons");
            const marker = APP.cssRenderer.domElement.querySelector(`.object.${selector}`)
            marker.classList.add('hide')
        } else {
            APP.cssRenderer.domElement.classList.add('hideMoons')
        }

        const entry = this.collection.find(entry => entry.selector === selector)


        if (!entry) {
            console.error(`Cant find camera with selector ${selector}`)
        } else {
            const select = document.getElementById('cameraSelector') as HTMLSelectElement
            for (var i = 0; i < select.options.length; i++) {
                if (select.options[i].value === selector) {
                    select.selectedIndex = i;
                    break;
                }
            }

            this.activeCamera = entry
            APP.updateComposer(entry.camera)
        }

        this.activeCamera.camera.aspect = window.innerWidth / window.innerHeight;
        this.activeCamera.camera.updateProjectionMatrix();

        return this
    }

    public getActiveEntry(): CameraEntry {
        return this.activeCamera
    }

    public initEventControls(): CameraManager {
        this.activeCamera.control.initEventListener()
        return this
    }

    public updateControls(delta: number) {
        this.collection.forEach(entry => entry.control.update(delta))
    }
}