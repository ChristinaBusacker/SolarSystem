import * as THREE from "three";

export class SimpleControl {
    public distanceMin: number;
    public distanceMax: number;
    public camera: THREE.PerspectiveCamera;
    public group = new THREE.Group()

    constructor(distanceMin: number, distanceMax: number, camera: THREE.PerspectiveCamera) {
        this.distanceMin = distanceMin
        this.distanceMax = distanceMax
        this.camera = camera;
        this.group.add(camera);
    }

    update() {
        this.camera.position.set(0,0, this.distanceMax);
    }
}