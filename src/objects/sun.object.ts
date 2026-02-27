import * as THREE from "three";
import { Lensflare, LensflareElement } from "three/examples/jsm/objects/Lensflare";
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

  private lensflare?: Lensflare;
  private smearElement?: LensflareElement;

  private flareParts: Array<{
    el: LensflareElement;
    baseColor: THREE.Color;
    baseSize: number;
    baseOpacity: number;
    opacity?: number;
  }> = [];

  // Number of flare elements that are anchored on the sun itself (distance=0).
  // These should stay visible more often than the ghost chain.
  private flareCoreCount = 0;

  private lensflareFinalVisible = true;
  private readonly tmpSunNdc = new THREE.Vector3();

  private static createGlowTexture(): THREE.Texture {
    const size = 96;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      // Fallback: 1x1 white
      const tex = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
      tex.needsUpdate = true;
      return tex;
    }

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0.0, "rgba(255, 235, 180, 1.0)");
    g.addColorStop(0.25, "rgba(255, 210, 120, 0.85)");
    g.addColorStop(0.55, "rgba(255, 170, 60, 0.25)");
    g.addColorStop(1.0, "rgba(255, 140, 20, 0.0)");

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
    super.init();

    const { vertexShader, fragmentShader } = sunShader;

    this.mesh.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        sunTexture: { value: this.texture },
        sunSpotsTexture: { value: this.texture },
        // Keep this independent from the actual camera.position to avoid accidental mutation.
        myCameraPosition: { value: new THREE.Vector3() },
        cameraFar: { value: APP.cameraManager.getActiveEntry().camera.far }, // Verwende die Far-Plane der Kamera
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });

    // Adding Corona to sun
    this.coronaShaderMaterial = new THREE.ShaderMaterial(coronaShader);
    // Corona as a slightly larger shell to avoid z-fighting with the Sun surface at huge distances.
    this.coronaShaderMaterial.depthWrite = false;
    this.coronaShaderMaterial.depthTest = true;

    const coronaGeometry = new THREE.SphereGeometry((this.data.size / 2) * 1.02, 64, 64);
    const coronaMesh = new THREE.Mesh(coronaGeometry, this.coronaShaderMaterial);

    coronaMesh.position.set(0, 0, 0);
    coronaMesh.renderOrder = 1;
    this.group.add(coronaMesh);

    this.initLensflare();

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

  public initLensflare() {
    const loader = new THREE.TextureLoader();

    const loadFlare = (path: string): THREE.Texture => {
      const t = loader.load(path);
      t.colorSpace = THREE.SRGBColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      return t;
    };

    const texCore = loadFlare("/assets/lensflare/flare_core_tight.png");
    const texSmear = loadFlare("/assets/lensflare/flare_smear.png");
    const texGhost = loadFlare("/assets/lensflare/flare_ghost.png");
    const texRing = loadFlare("/assets/lensflare/flare_ring.png");

    this.lensflare = new Lensflare();
    this.lensflare.renderOrder = 999;
    this.lensflare.frustumCulled = false;

    const add = (
      tex: THREE.Texture,
      size: number,
      distance: number,
      colorHex: number,
      opacity: number,
    ): LensflareElement => {
      const el = new LensflareElement(tex, size, distance, new THREE.Color(colorHex));

      this.lensflare!.addElement(el);
      this.flareParts.push({
        el,
        baseColor: new THREE.Color(colorHex),
        baseSize: size,
        baseOpacity: opacity,
      });
      return el;
    };

    // Core right on the sun (tight and warm)
    add(texCore, 240, 0.0, 0xfff2d0, 1.0);

    // A faint halo ring around the sun itself (helps "there is something" even near center)
    add(texRing, 420, 0.0, 0xffe6b8, 0.16);

    // Smear/streak (rotated each frame toward screen center)
    this.smearElement = add(texSmear, 820, 0.0, 0xfff2d0, 0.28);

    // Ghost chain toward screen center (warm + subtle, not milky overlays)
    add(texGhost, 120, 0.18, 0xfff7ea, 0.1);
    add(texRing, 220, 0.3, 0xffe9c6, 0.1);
    add(texGhost, 210, 0.42, 0xffd9a6, 0.08);
    add(texRing, 340, 0.58, 0xfff1d6, 0.07);
    add(texGhost, 280, 0.72, 0xffffff, 0.05);
    add(texGhost, 520, 0.92, 0xffffff, 0.03);

    // Remember how many elements belong to the "core" group (core + halo + smear).
    // Everything after that is considered part of the ghost chain.
    this.flareCoreCount = 3;

    this.group.add(this.lensflare);
  }

  public override preBloom(): void {
    if (this.lensflare) this.lensflare.visible = false;
    // The additive "always visible" glow can massively boost bloom and make the sun look like a flashbang.
    if (this.minVisibleSprite) this.minVisibleSprite.visible = false;
  }

  public override postBloom(): void {
    if (this.lensflare) this.lensflare.visible = this.lensflareFinalVisible;
    if (this.minVisibleSprite) this.minVisibleSprite.visible = true;
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
      const focalPx = (0.5 * viewportH) / Math.tan(fovRad * 0.5);

      const minPx = 14; // minimum diameter in CSS pixels
      const requiredWorld = (minPx * dist) / Math.max(1e-6, focalPx);

      // Base diameter is the physical sphere diameter.
      const baseWorld = this.data.size;
      // Only grow when the Sun becomes too small, and cap to avoid giant quads.
      const finalWorld = Math.min(dist * 0.06, Math.max(baseWorld, requiredWorld));
      this.minVisibleSprite.scale.set(finalWorld, finalWorld, 1);
    }

    if (this.lensflare) {
      // Sun position in NDC (-1..1)
      this.group.getWorldPosition(this.tmpSunPos);
      this.tmpSunNdc.copy(this.tmpSunPos).project(activeCamera);

      const inFront = this.tmpSunNdc.z > 0 && this.tmpSunNdc.z < 1;
      const distFromCenter = Math.sqrt(
        this.tmpSunNdc.x * this.tmpSunNdc.x + this.tmpSunNdc.y * this.tmpSunNdc.y,
      );

      // Fade out when near edges / off-screen
      const onScreen =
        inFront && Math.abs(this.tmpSunNdc.x) < 1.35 && Math.abs(this.tmpSunNdc.y) < 1.35;

      // NOTE: MathUtils.smoothstep signature is smoothstep(x, min, max)
      // We want:
      // - a small but always-present core glint (even near screen center)
      // - ghosts/rings become stronger toward the edges, but start earlier than before
      const edgeFade = THREE.MathUtils.smoothstep(distFromCenter, 0.05, 1.1); // 0 center -> 1 edges
      const ghostGate = THREE.MathUtils.smoothstep(distFromCenter, 0.03, 0.18); // allow ghosts closer to center

      const coreIntensity = onScreen ? THREE.MathUtils.clamp(0.22 + 0.78 * edgeFade, 0, 1) : 0;
      const ghostIntensity = onScreen ? edgeFade * ghostGate : 0;

      // Rotate smear to align with "sun -> screen center"
      if (this.smearElement) {
        const ang = Math.atan2(-this.tmpSunNdc.y, -this.tmpSunNdc.x);
        // on Purpose cause of a threejs types bug
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.smearElement as any).rotation = ang;
      }

      const globalStrength = 0.65; // master knob (cinematic, not a supernova)

      for (let i = 0; i < this.flareParts.length; i++) {
        const p = this.flareParts[i];

        const isCore = i < this.flareCoreCount;
        const t = isCore ? coreIntensity : ghostIntensity;
        const sizeScale = isCore ? 0.85 + 0.15 * t : 0.25 + 0.75 * t;

        p.el.size = p.baseSize * sizeScale;
        p.el.color.copy(p.baseColor).multiplyScalar(globalStrength * t);
      }

      // Keep lensflare alive as long as the core is visible.
      this.lensflareFinalVisible = coreIntensity > 0.01;
      this.lensflare.visible = this.lensflareFinalVisible;
    }

    super.render(delta, activeCamera);
  }
}
