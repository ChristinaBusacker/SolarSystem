import * as THREE from "three";
import { APP } from "..";
import { sunRawData } from "../../data/raw-object.data";
import { coronaShader } from "../shader/corona";
import { sunShader } from "../shader/sun.shader";
import { Astronomical } from "./astronomical.object";

export class Sun extends Astronomical {
  public cameraPosition = new THREE.Vector3(10, 10, 10);
  private coronaShaderMaterial: THREE.ShaderMaterial;

  // Ensures the Sun stays visible as a small glowing disc even when far away.
  private minVisibleSprite?: THREE.Sprite;
  private readonly tmpCamPos = new THREE.Vector3();
  private readonly tmpSunPos = new THREE.Vector3();
  private readonly tmpViewport = new THREE.Vector2();


  private static createGlowTexture(): THREE.Texture {
    const size = 96;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      // Fallback: 1x1 white
      const tex = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
      tex.needsUpdate = true
      return tex;
    }

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.0, 'rgba(255, 235, 180, 1.0)');
    g.addColorStop(0.25, 'rgba(255, 210, 120, 0.85)');
    g.addColorStop(0.55, 'rgba(255, 170, 60, 0.25)');
    g.addColorStop(1.0, 'rgba(255, 140, 20, 0.0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  constructor() {
    super(["/assets/textures/2k_sun.jpg"], "/assets/normals/2k_jupiter.png", sunRawData, true);
  }

  public init() {
    super.init()

    const { vertexShader, fragmentShader } = sunShader

    this.mesh.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunTexture: { value: this.texture },
        sunSpotsTexture: { value: this.texture },
        // Keep this independent from the actual camera.position to avoid accidental mutation.
        myCameraPosition: { value: new THREE.Vector3() },
        cameraFar: { value: APP.cameraManager.getActiveEntry().camera.far } // Verwende die Far-Plane der Kamera
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });


    // Adding Corona to sun
    this.coronaShaderMaterial = new THREE.ShaderMaterial(coronaShader);
    // Corona as a slightly larger shell to avoid z-fighting with the Sun surface at huge distances.
    this.coronaShaderMaterial.depthWrite = false;
    this.coronaShaderMaterial.depthTest = true;

    const coronaGeometry = new THREE.SphereGeometry(this.data.size / 2 * 1.02, 64, 64);
    const coronaMesh = new THREE.Mesh(
      coronaGeometry,
      this.coronaShaderMaterial
    );

    coronaMesh.position.set(0, 0, 0);
    coronaMesh.renderOrder = 1;
    this.group.add(coronaMesh);


    // Small additive glow sprite so the Sun stays visible in wide shots.
    const glowTex = Sun.createGlowTexture();
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      color: 0xffffff,
    });
    glowMat.toneMapped = false;

    this.minVisibleSprite = new THREE.Sprite(glowMat);
    this.minVisibleSprite.position.set(0, 0, 0);
    // Render early so planets can still occlude it via depth.
    this.minVisibleSprite.renderOrder = -10;
    this.group.add(this.minVisibleSprite);
  }


  public render(delta: number, camera?: THREE.PerspectiveCamera): void {
    const activeCamera = camera ?? APP.cameraManager.getActiveEntry().camera;

    this.mesh.rotation.y += this.data.rotationSpeed * delta * APP.simulationSpeed;
    this.coronaShaderMaterial.uniforms.time.value += delta * APP.simulationSpeed;

    // Keep Sun shader uniforms in sync.
    const mat = this.mesh.material as THREE.ShaderMaterial;

    if (mat?.uniforms?.myCameraPosition) {
      activeCamera.getWorldPosition(this.tmpCamPos);
      mat.uniforms.myCameraPosition.value.copy(this.tmpCamPos);
    }

    if (mat?.uniforms?.cameraFar) {
      mat.uniforms.cameraFar.value = activeCamera.far;
    }

    // Enforce a minimum on-screen size for the glow sprite.
    if (this.minVisibleSprite) {
      // tmpCamPos is already updated above (shader uniform sync), but keep this safe.
      activeCamera.getWorldPosition(this.tmpCamPos);
      this.group.getWorldPosition(this.tmpSunPos);
      const dist = Math.max(0.001, this.tmpCamPos.distanceTo(this.tmpSunPos));

      APP.webglRenderer.getSize(this.tmpViewport);
      const viewportH = Math.max(1, this.tmpViewport.y);
      const fovRad = THREE.MathUtils.degToRad(activeCamera.fov);
      const focalPx = 0.5 * viewportH / Math.tan(fovRad * 0.5);

      const minPx = 14; // minimum diameter in CSS pixels
      const requiredWorld = (minPx * dist) / Math.max(1e-6, focalPx);

      // Base diameter is the physical sphere diameter.
      const baseWorld = this.data.size;
      // Only grow when the Sun becomes too small, and cap to avoid giant quads.
      const finalWorld = Math.min(dist * 0.06, Math.max(baseWorld, requiredWorld));
      this.minVisibleSprite.scale.set(finalWorld, finalWorld, 1);
    }

    super.render(delta, activeCamera);
  }
}
