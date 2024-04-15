import * as THREE from "three";

export class SimpleControl {
    public distanceMin: number;
    public distanceMax: number;
    public camera: THREE.PerspectiveCamera;
    public horizontal = new THREE.Group()
    public vertical = new THREE.Group()
    public group = new THREE.Group();
    public velocity = new THREE.Vector2(0.2,0)
    private isRotating = false
    public previousMousePosition = new THREE.Vector2(0,0)
    public dragspeed = 0.95;
    public verticleRotationLimit = 60;

    // TODO get Webgl renderer dom element for events
    constructor(distanceMin: number, distanceMax: number, camera: THREE.PerspectiveCamera) {
        this.distanceMin = distanceMin
        this.distanceMax = distanceMax
        this.camera = camera;
        this.vertical.add(camera);
        this.horizontal.add(this.vertical)
        this.group.add(this.horizontal)

        document.addEventListener("mousedown", this.onMouseDown);
        document.addEventListener("mousemove", this.onMouseMove);
        document.addEventListener("mouseup", this.onMouseUp);
    
        document.addEventListener("touchstart", this.onTouchStart);
        document.addEventListener("touchmove", this.onTouchMove);
        document.addEventListener("touchend", this.onTouchEnd);
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

      private rotateCamera(deltaMove: THREE.Vector2)  {
        this.velocity = deltaMove
      }
    

    update(delta: number) {
        this.camera.position.set(0,0, this.distanceMax);

        if(!this.isRotating) {
            this.velocity.set(this.velocity.x * this.dragspeed, this.velocity.y * this.dragspeed)

        } else {

            this.vertical.rotateX(this.velocity.y * Math.PI * -3 / window.innerHeight)

            if(this.vertical.rotation.x > this.verticleRotationLimit * Math.PI / 180) {
                this.vertical.rotation.set(this.verticleRotationLimit * Math.PI / 180, 0,0 )
            }

            if((this.vertical.rotation.x < -1 * this.verticleRotationLimit * Math.PI / 180)){
                this.vertical.rotation.set(-1 * this.verticleRotationLimit * Math.PI / 180, 0,0 )
            }

            this.horizontal.rotateY(this.velocity.x * Math.PI * -4 / window.innerWidth)
            this.velocity.set(0,0)
        }
    }
}