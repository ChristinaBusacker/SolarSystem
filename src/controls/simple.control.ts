import * as THREE from "three";

export class SimpleControl {
    public distanceMin: number;
    public distanceMax: number;
    public camera: THREE.PerspectiveCamera;
    public horizontal = new THREE.Group()
    public vertical = new THREE.Group()
    public group = new THREE.Group();
    public velocity = new THREE.Vector2(0.2,1)

    constructor(distanceMin: number, distanceMax: number, camera: THREE.PerspectiveCamera) {
        this.distanceMin = distanceMin
        this.distanceMax = distanceMax
        this.camera = camera;
        this.horizontal.add(camera);
        this.vertical.add(this.horizontal)
        this.group.add(this.vertical)
    }

    update(delta: number) {
        this.camera.position.set(0,0, this.distanceMax);
        this.horizontal.rotateY(this.velocity.x * delta * Math.PI)
        this.vertical.rotateX(this.velocity.y * delta * Math.PI)
    }
}