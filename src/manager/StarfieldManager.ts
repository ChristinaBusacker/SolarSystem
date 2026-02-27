import * as THREE from "three";
import { starfieldPointsShader } from "../shader/starfield-points.shader";

/**
 * Procedural starfield rendered as THREE.Points.
 *
 * Notes:
 * - Kept out of bloom pass for a clean look.
 * - Re-centered on the active camera each frame to avoid clipping.
 */
export class StarfieldManager {
  private starfield?: THREE.Points;
  private starfieldMaterial?: THREE.ShaderMaterial;

  private readonly tmpWorldPos = new THREE.Vector3();

  public init(scene: THREE.Scene): void {
    // Replace large HDR/EXR env maps with a lightweight procedural starfield.
    // Using THREE.Points keeps stars crisp (no blocky artifacts) and is stable on mobile.

    const uniforms = THREE.UniformsUtils.clone(starfieldPointsShader.uniforms || {});
    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: starfieldPointsShader.vertexShader,
      fragmentShader: starfieldPointsShader.fragmentShader,
      // Important: keep the starfield out of the "transparent" render list.
      // Otherwise it gets drawn *after* planets/orbits and can look like it shines through.
      transparent: false,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    mat.toneMapped = false;

    // Deterministic RNG so the sky doesn't "change" per reload.
    const mulberry32 = (seed: number) => {
      return () => {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    const rng = mulberry32(1337);

    // Star budget: dense enough to feel "NASA-like" but still cheap.
    const isCoarsePointer =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches;
    const smallCount = isCoarsePointer ? 22000 : 42000;
    const bigCount = isCoarsePointer ? 800 : 1400;
    const total = smallCount + bigCount;

    const positions = new Float32Array(total * 3);
    const colors = new Float32Array(total * 3);
    const sizes = new Float32Array(total);
    const alphas = new Float32Array(total);

    const galaxyAxis = new THREE.Vector3(0.0, 0.35, 0.94).normalize();
    const galaxySigma = 0.22; // lower = tighter band

    const sampleDirection = (): THREE.Vector3 => {
      // Uniform direction on sphere
      const u = rng();
      const v = rng();
      const z = 2.0 * u - 1.0;
      const t = 2.0 * Math.PI * v;
      const r = Math.sqrt(Math.max(0, 1.0 - z * z));
      return new THREE.Vector3(r * Math.cos(t), z, r * Math.sin(t));
    };

    const sampleColor = (r: number): THREE.Color => {
      if (r < 0.06) return new THREE.Color(0.55, 0.7, 1.0);
      if (r < 0.16) return new THREE.Color(0.7, 0.82, 1.0);
      if (r < 0.62) return new THREE.Color(1.0, 1.0, 1.0);
      if (r < 0.88) return new THREE.Color(1.0, 0.92, 0.76);
      return new THREE.Color(1.0, 0.75, 0.52);
    };

    let i = 0;
    const writeStar = (dir: THREE.Vector3, sizePx: number, alpha: number, color: THREE.Color) => {
      positions[i * 3 + 0] = dir.x;
      positions[i * 3 + 1] = dir.y;
      positions[i * 3 + 2] = dir.z;

      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = sizePx;
      alphas[i] = alpha;
      i += 1;
    };

    while (i < smallCount) {
      const dir = sampleDirection();

      const dot = Math.abs(dir.dot(galaxyAxis));
      const band = Math.exp(-(dot * dot) / (2 * galaxySigma * galaxySigma));
      const accept = 0.22 + 0.78 * band;
      if (rng() > accept) continue;

      const base = 0.85 + 0.15 * rng();
      const alpha = (0.18 + 0.82 * Math.pow(rng(), 2.2)) * base;
      const size = 0.9 + 1.6 * Math.pow(rng(), 1.8);
      const c = sampleColor(rng());

      c.lerp(new THREE.Color(1, 1, 1), 0.35);

      writeStar(dir, size, alpha, c);
    }

    while (i < total) {
      const dir = sampleDirection();
      const dot = Math.abs(dir.dot(galaxyAxis));
      const band = Math.exp(-(dot * dot) / (2 * (galaxySigma * 1.15) * (galaxySigma * 1.15)));
      const accept = 0.35 + 0.65 * band;
      if (rng() > accept) continue;

      const alpha = 0.65 + 0.55 * Math.pow(rng(), 0.8);
      const size = 2.2 + 4.8 * Math.pow(rng(), 1.4);
      const c = sampleColor(rng());
      writeStar(dir, size, alpha, c);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

    const stars = new THREE.Points(geo, mat);
    stars.frustumCulled = false;
    stars.renderOrder = -1000;

    // Initial size; gets adjusted each frame to avoid precision issues.
    stars.scale.setScalar(5000);

    scene.add(stars);

    this.starfield = stars;
    this.starfieldMaterial = mat;

    scene.background = null;
    scene.environment = null;
  }

  public update(deltaTime: number, camera: THREE.PerspectiveCamera, devicePixelRatio: number): void {
    if (!this.starfield) return;

    // Keep starfield centered on the *render camera* and always inside the frustum.
    camera.getWorldPosition(this.tmpWorldPos);
    this.starfield.position.copy(this.tmpWorldPos);

    // Don't scale the starfield with huge far planes (some cameras go up to ~90M).
    // Extremely large radii hurt precision and can cause artifacts.
    const far = camera.far ?? 5000;
    const desiredRadius = Math.min(5000, Math.max(200, far * 0.95));
    this.starfield.scale.setScalar(desiredRadius);

    if (this.starfieldMaterial?.uniforms?.uTime) {
      this.starfieldMaterial.uniforms.uTime.value += deltaTime;
    }
    if (this.starfieldMaterial?.uniforms?.uPixelRatio) {
      this.starfieldMaterial.uniforms.uPixelRatio.value = devicePixelRatio;
    }
  }

  /** Hide starfield during bloom pass. */
  public preBloom(): void {
    if (this.starfield) this.starfield.visible = false;
  }

  /** Restore starfield for final pass. */
  public postBloom(): void {
    if (this.starfield) this.starfield.visible = true;
  }
}
