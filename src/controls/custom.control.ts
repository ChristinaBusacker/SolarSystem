import * as THREE from "three";

class CustomControl {
  private camera: THREE.Camera;
  private mesh: THREE.Mesh | THREE.Group;
  private domElement: HTMLElement;

  private isRotating: boolean = false;
  private previousMousePosition: THREE.Vector2;
  private spherical: THREE.Spherical = new THREE.Spherical();
  private target: THREE.Vector3 = new THREE.Vector3();

  constructor(
    camera: THREE.Camera,
    mesh: THREE.Mesh | THREE.Group,
    domElement: HTMLElement
  ) {
    this.camera = camera;
    this.mesh = mesh;
    this.domElement = domElement;

    this.previousMousePosition = new THREE.Vector2();

    this.addEventListeners();

    this.target.copy(mesh.position);
    this.spherical.setFromVector3(this.camera.position.sub(this.target));
  }

  private addEventListeners() {
    this.domElement.addEventListener("mousedown", this.onMouseDown);
    this.domElement.addEventListener("mousemove", this.onMouseMove);
    this.domElement.addEventListener("mouseup", this.onMouseUp);

    this.domElement.addEventListener("touchstart", this.onTouchStart);
    this.domElement.addEventListener("touchmove", this.onTouchMove);
    this.domElement.addEventListener("touchend", this.onTouchEnd);
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

  public destroy() {
    this.domElement.removeEventListener("mousedown", this.onMouseDown);
    this.domElement.removeEventListener("mousemove", this.onMouseMove);
    this.domElement.removeEventListener("mouseup", this.onMouseUp);
    // Führen Sie hier zusätzliche Bereinigungen durch, falls erforderlich
  }

  // Methode zum Austauschen der Kamera
  public setCamera(newCamera: THREE.Camera) {
    this.camera = newCamera;
    this.updateSphericalAndTarget(); // Aktualisiert die sphärischen Koordinaten und das Ziel
  }

  // Methode zum Austauschen des Meshes
  public setMesh(newMesh: THREE.Mesh | THREE.Group) {
    this.mesh = newMesh;
    this.updateSphericalAndTarget(); // Aktualisiert die sphärischen Koordinaten und das Ziel
  }

  // Hilfsmethode, um sphärische Koordinaten und das Ziel zu aktualisieren
  public updateSphericalAndTarget() {
    this.target.copy(this.mesh.position);
    this.spherical.setFromVector3(this.camera.position.sub(this.target));
  }

  public update() {
    this.rotateCamera(new THREE.Vector2(0, 0));
  }

  private rotateCamera(deltaMove: THREE.Vector2) {
    const rotationalSpeed = 0.005;

    // Update Spherical Coordinates
    this.spherical.theta -= deltaMove.x * rotationalSpeed; // Azimuthal Angle
    this.spherical.phi -= deltaMove.y * rotationalSpeed; // Polar Angle

    // Restrict phi to be between EPS and PI-EPS
    this.spherical.phi = Math.max(
      0.1,
      Math.min(Math.PI - 0.1, this.spherical.phi)
    );

    // Convert Spherical to Cartesian coordinates
    const newCameraPosition = new THREE.Vector3()
      .setFromSpherical(this.spherical)
      .add(this.target);

    // Update Camera Position
    this.camera.position.copy(newCameraPosition);

    // Look at the mesh
    const v3 = new THREE.Vector3();
    this.mesh.getWorldPosition(v3);
  }
}

export default CustomControl;
