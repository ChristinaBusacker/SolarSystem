import * as THREE from "three";
import { APP } from "..";

export class SimpleControl {
  public distanceMin: number;
  public distanceMax: number;
  public zoom: number = 0.01;
  public camera: THREE.PerspectiveCamera;
  public horizontal = new THREE.Group()
  public vertical = new THREE.Group()
  public group = new THREE.Group();
  public velocity = new THREE.Vector2(0.2, 0)
  private isRotating = false
  public previousMousePosition = new THREE.Vector2(0, 0)
  public dragspeed = 0.90;
  public verticleRotationLimit = 60;

  constructor(distanceMin: number, distanceMax: number, camera: THREE.PerspectiveCamera) {
    this.distanceMin = distanceMin
    this.distanceMax = distanceMax
    this.camera = camera;
    this.vertical.add(camera);
    this.horizontal.add(this.vertical);
    this.group.add(this.horizontal);

    window.addEventListener("wheel", this.onWheel)
  }

  public initEventListener() {
    document.getElementById('app').addEventListener("mousedown", this.onMouseDown);
    document.getElementById('app').addEventListener("mousemove", this.onMouseMove);
    document.getElementById('app').addEventListener("mouseup", this.onMouseUp);

    document.getElementById('app').addEventListener("touchstart", this.onTouchStart);
    document.getElementById('app').addEventListener("touchmove", this.onTouchMove);
    document.getElementById('app').addEventListener("touchend", this.onTouchEnd);
  }

  private onTouchStart = (event: TouchEvent) => {
    event.preventDefault();
    if (event.touches.length === 1) {
      this.isRotating = true;
      this.previousMousePosition.x = event.touches[0].clientX;
      this.previousMousePosition.y = event.touches[0].clientY;
    }
  };

  private onTouchMove = (event: TouchEvent) => {
    event.preventDefault();
    if (this.isRotating && event.touches.length === 1) {
      const deltaMove = new THREE.Vector2(
        event.touches[0].clientX - this.previousMousePosition.x,
        event.touches[0].clientY - this.previousMousePosition.y
      );

      this.rotateCamera(deltaMove);

      this.previousMousePosition.x = event.touches[0].clientX;
      this.previousMousePosition.y = event.touches[0].clientY;
    }
  };

  private onTouchEnd = (event: TouchEvent) => {
    event.preventDefault();
    this.isRotating = false;
  };

  private onMouseDown = (event: MouseEvent) => {
    this.isRotating = true;
    this.previousMousePosition.x = event.clientX;
    this.previousMousePosition.y = event.clientY;
  };

  private onMouseMove = (event: MouseEvent) => {
    if (this.isRotating) {
      const deltaMove = new THREE.Vector2(
        event.clientX - this.previousMousePosition.x,
        event.clientY - this.previousMousePosition.y
      );

      this.rotateCamera(deltaMove);

      this.previousMousePosition.x = event.clientX;
      this.previousMousePosition.y = event.clientY;
    }
  };

  private onMouseUp = () => {
    this.isRotating = false;

  };

  private rotateCamera(deltaMove: THREE.Vector2) {
    this.velocity = deltaMove
  }

  private onWheel = (event: WheelEvent) => {
    this.zoom = Math.min(1, Math.max(0, this.zoom + event.deltaY * 0.002 * Math.max(this.zoom, 0.0005)))
  }

  private lerp = (start: number, end: number, t: number) => {
    return (1 - t) * start + t * end;
  }


  update(delta: number) {
    let dist = this.lerp(this.distanceMin, this.distanceMax, this.zoom)
    dist = this.lerp(this.camera.position.z, dist, delta * 5)
    this.camera.position.set(0, 0, dist);

    if (!this.isRotating) {
      this.velocity.set(this.velocity.x * this.dragspeed, this.velocity.y * this.dragspeed)
      this.vertical.rotateX(this.velocity.y * Math.PI * -3 / window.innerHeight)

      if (this.vertical.rotation.x > this.verticleRotationLimit * Math.PI / 180) {
        this.vertical.rotation.set(this.verticleRotationLimit * Math.PI / 180, 0, 0)
      }

      if ((this.vertical.rotation.x < -1 * this.verticleRotationLimit * Math.PI / 180)) {
        this.vertical.rotation.set(-1 * this.verticleRotationLimit * Math.PI / 180, 0, 0)
      }

      this.horizontal.rotateY(this.velocity.x * Math.PI * -4 / window.innerWidth)

    } else {

      this.vertical.rotateX(this.velocity.y * Math.PI * -3 / window.innerHeight)

      if (this.vertical.rotation.x > this.verticleRotationLimit * Math.PI / 180) {
        this.vertical.rotation.set(this.verticleRotationLimit * Math.PI / 180, 0, 0)
      }

      if ((this.vertical.rotation.x < -1 * this.verticleRotationLimit * Math.PI / 180)) {
        this.vertical.rotation.set(-1 * this.verticleRotationLimit * Math.PI / 180, 0, 0)
      }

      this.horizontal.rotateY(this.velocity.x * Math.PI * -4 / window.innerWidth)
      this.velocity.set(0, 0)
    }


  }
}