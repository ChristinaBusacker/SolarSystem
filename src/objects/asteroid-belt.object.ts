import * as THREE from "three";
import { APP } from "..";
import { earthData } from "../../data/objects.data";
import { asteroidBeltImpostorShader } from "../shader/asteroid-belt-impostor.shader";

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randNormal(rng: Rng): number {
  const u = Math.max(1e-8, rng());
  const v = Math.max(1e-8, rng());
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export interface AsteroidBeltOptions {
  count: number;
  innerRadius: number;
  outerRadius: number;
  maxEccentricity: number;
  inclinationStdDeg: number;
  minSpriteSize: number;
  maxSpriteSize: number;
  seed: number;
}

/**
 * Main belt rendered as procedural point-sprite impostors.
 *
 * Why this approach:
 * - stable visibility for many tiny bodies (screen-space point size)
 * - very cheap (single draw call)
 * - custom shader can fake rocky silhouettes + lighting without heavy meshes
 */
export class AsteroidBelt {
  public readonly group = new THREE.Group();

  private geometry?: THREE.BufferGeometry;
  private points?: THREE.Points;
  private material?: THREE.ShaderMaterial;

  private readonly opts: AsteroidBeltOptions;
  private time = 0;

  private readonly sunWorldPosition = new THREE.Vector3(0, 0, 0);

  public constructor(opts?: Partial<AsteroidBeltOptions>) {
    this.opts = {
      count: 1900,
      innerRadius: 2250,
      outerRadius: 3150,
      maxEccentricity: 0.075,
      inclinationStdDeg: 3.0,
      minSpriteSize: 6,
      maxSpriteSize: 28,
      seed: 1337,
      ...opts,
    };
  }

  public init(): void {
    const rng = mulberry32(this.opts.seed);

    const count = this.opts.count;
    const aSemiMajor = new Float32Array(count);
    const aSemiMinor = new Float32Array(count);
    const aEcc = new Float32Array(count);
    const aArgPeri = new Float32Array(count);
    const aInclination = new Float32Array(count);
    const aPhase0 = new Float32Array(count);
    const aAngularSpeed = new Float32Array(count);
    const aSize = new Float32Array(count);
    const aShapeSeed = new Float32Array(count);
    const aColor = new Float32Array(count * 3);

    const incStd = THREE.MathUtils.degToRad(this.opts.inclinationStdDeg);

    for (let i = 0; i < count; i++) {
      const a = this.sampleRadius(rng);
      const e = Math.pow(rng(), 2.2) * this.opts.maxEccentricity;
      const b = a * Math.sqrt(1 - e * e);

      aSemiMajor[i] = a;
      aSemiMinor[i] = b;
      aEcc[i] = e;
      aArgPeri[i] = rng() * Math.PI * 2;
      aInclination[i] = randNormal(rng) * incStd;
      aPhase0[i] = rng() * Math.PI * 2;
      aAngularSpeed[i] =
        earthData.orbitalSpeed * Math.pow(earthData.distanceToOrbiting / a, 1.5);

      // Many small, some medium, very few larger chunks.
      const t = Math.pow(rng(), 1.9);
      aSize[i] = this.opts.minSpriteSize + (this.opts.maxSpriteSize - this.opts.minSpriteSize) * t;
      aShapeSeed[i] = rng();

      const color = this.sampleColor(rng);
      aColor[i * 3 + 0] = color.r;
      aColor[i * 3 + 1] = color.g;
      aColor[i * 3 + 2] = color.b;
    }

    this.geometry = new THREE.BufferGeometry();
    // Base position is unused but required for Points.
    this.geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3));
    this.geometry.setAttribute("aSemiMajor", new THREE.Float32BufferAttribute(aSemiMajor, 1));
    this.geometry.setAttribute("aSemiMinor", new THREE.Float32BufferAttribute(aSemiMinor, 1));
    this.geometry.setAttribute("aEcc", new THREE.Float32BufferAttribute(aEcc, 1));
    this.geometry.setAttribute("aArgPeri", new THREE.Float32BufferAttribute(aArgPeri, 1));
    this.geometry.setAttribute("aInclination", new THREE.Float32BufferAttribute(aInclination, 1));
    this.geometry.setAttribute("aPhase0", new THREE.Float32BufferAttribute(aPhase0, 1));
    this.geometry.setAttribute("aAngularSpeed", new THREE.Float32BufferAttribute(aAngularSpeed, 1));
    this.geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(aSize, 1));
    this.geometry.setAttribute("aShapeSeed", new THREE.Float32BufferAttribute(aShapeSeed, 1));
    this.geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(aColor, 3));
    this.geometry.computeBoundingSphere();

    const { vertexShader, fragmentShader } = asteroidBeltImpostorShader;
    this.material = new THREE.ShaderMaterial({
      name: "AsteroidBeltImpostorMaterial",
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uViewportScale: { value: APP.webglRenderer.getPixelRatio?.() ?? 1 },
        uSunWorldPosition: { value: this.sunWorldPosition.clone() },
        uBloomMode: { value: 0 },
      },
      transparent: true,
      depthTest: true,
      depthWrite: true,
      blending: THREE.NormalBlending,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
    this.points.name = "MainAsteroidBeltPoints";

    this.group.name = "MainAsteroidBelt";
    this.group.add(this.points);
  }

  public preBloom(): void {
    if (!this.material) return;
    this.material.uniforms.uBloomMode.value = 1;
  }

  public postBloom(): void {
    if (!this.material) return;
    this.material.uniforms.uBloomMode.value = 0;
  }

  public render(delta: number): void {
    if (!this.material || delta <= 0) return;

    this.time += delta * 60 * APP.simulationSpeed;
    this.material.uniforms.uTime.value = this.time;
    this.material.uniforms.uViewportScale.value = APP.webglRenderer.getPixelRatio?.() ?? 1;

    // Sun is currently at system origin in this app. Keep this as a uniform for future flexibility.
    const sun = this.material.uniforms.uSunWorldPosition.value as THREE.Vector3;
    sun.copy(this.sunWorldPosition);
  }

  private sampleRadius(rng: Rng): number {
    const r2Min = this.opts.innerRadius * this.opts.innerRadius;
    const r2Max = this.opts.outerRadius * this.opts.outerRadius;

    for (let tries = 0; tries < 12; tries++) {
      const a = Math.sqrt(r2Min + (r2Max - r2Min) * rng());
      if (rng() <= this.radialDensityWeight(a)) return a;
    }

    // Fallback if rejection was unlucky.
    return Math.sqrt(r2Min + (r2Max - r2Min) * rng());
  }

  private radialDensityWeight(radius: number): number {
    // Gentle cinematic density shaping + subtle Kirkwood-like dips.
    const t = (radius - this.opts.innerRadius) / (this.opts.outerRadius - this.opts.innerRadius);
    const centerBias = 0.82 + Math.exp(-Math.pow((t - 0.52) / 0.34, 2.0)) * 0.22;

    const dip = (center: number, width: number, depth: number) => {
      const x = (radius - center) / width;
      return 1.0 - Math.exp(-x * x) * depth;
    };

    let w = centerBias;
    w *= dip(2500, 65, 0.45);
    w *= dip(2820, 70, 0.35);
    w *= dip(2960, 65, 0.28);
    w *= dip(3270, 80, 0.52);

    return THREE.MathUtils.clamp(w, 0.08, 1.0);
  }

  private sampleColor(rng: Rng): THREE.Color {
    // Darker, mineral palette so it reads like rock, not snow.
    const palette = [
      new THREE.Color("#6f665d"),
      new THREE.Color("#7f7365"),
      new THREE.Color("#5f5c57"),
      new THREE.Color("#71695f"),
      new THREE.Color("#857864"),
      new THREE.Color("#6a6f75"),
    ];

    const i0 = Math.floor(rng() * palette.length) % palette.length;
    const i1 = (i0 + 1 + Math.floor(rng() * (palette.length - 1))) % palette.length;
    const c = palette[i0].clone().lerp(palette[i1], rng() * 0.55);

    // Small value variation.
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    c.setHSL(hsl.h, THREE.MathUtils.clamp(hsl.s * (0.85 + rng() * 0.35), 0, 1), THREE.MathUtils.clamp(hsl.l * (0.82 + rng() * 0.38), 0.2, 0.72));
    return c;
  }
}
