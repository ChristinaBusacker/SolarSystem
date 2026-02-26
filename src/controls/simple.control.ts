import * as THREE from "three";

export class SimpleControl {
  public zoom: number = 0.01;
  public horizontal = new THREE.Group()
  public vertical = new THREE.Group()
  public group = new THREE.Group();
  // Smoothed camera rotation velocity.
  // IMPORTANT: start at 0 to avoid cameras drifting when not active.
  public velocity = new THREE.Vector2(0, 0)
  private isRotating = false
  public previousMousePosition = new THREE.Vector2(0, 0)
  public dragspeed = 0.90;
  public verticleRotationLimit = 60;

  constructor(private distanceMin: number, private distanceMax: number, private camera: THREE.PerspectiveCamera) {
    this.vertical.add(camera);
    this.horizontal.add(this.vertical);
    this.group.add(this.horizontal);
  }

  /** Begin a rotate gesture (mouse down / touch start). */
  public startRotate(clientX: number, clientY: number): void {
    this.isRotating = true;
    this.previousMousePosition.set(clientX, clientY);
  }

  /** Continue rotate gesture. */
  public moveRotate(clientX: number, clientY: number, scale: number = 0.8): void {
    if (!this.isRotating) return;

    const deltaMove = new THREE.Vector2(
      (clientX - this.previousMousePosition.x) * scale,
      (clientY - this.previousMousePosition.y) * scale,
    );

    this.rotateCamera(deltaMove);
    this.previousMousePosition.set(clientX, clientY);
  }

  /** End a rotate gesture. */
  public endRotate(): void {
    this.isRotating = false;
  }

  private rotateCamera(deltaMove: THREE.Vector2) {
    this.velocity = deltaMove
  }

  public applyWheel(deltaY: number): void {
    // Positive deltaY usually means "scroll down" => zoom out.
    this.applyZoomDelta(deltaY * 0.002 * Math.max(this.zoom, 0.0005));
  }

  public applyZoomDelta(delta: number): void {
    this.zoom = THREE.MathUtils.clamp(this.zoom + delta, 0, 1);
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