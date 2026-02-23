import * as THREE from "three";
import { APP } from "..";
import { earthData } from "../../data/objects.data";
import { asteroidBeltImpostorShader } from "../shader/asteroid-belt-impostor.shader";

type Rng = () => number;
type BeltProfile = "main" | "kuiper";

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
  profile: BeltProfile;
  groupName: string;
  pointsName: string;
}

/**
 * Belt rendered as procedural point-sprite impostors.
 *
 * Why this approach:
 * - stable visibility for many tiny bodies (screen-space point size)
 * - very cheap (single draw call per belt)
 * - custom shader can fake rocky/icy silhouettes + lighting without heavy meshes
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
      // Main belt defaults (Mars–Jupiter) tuned for readability.
      count: 1900,
      innerRadius: 2250,
      outerRadius: 3150,
      maxEccentricity: 0.075,
      inclinationStdDeg: 3.0,
      minSpriteSize: 6,
      maxSpriteSize: 28,
      seed: 1337,
      profile: "main",
      groupName: "MainAsteroidBelt",
      pointsName: "MainAsteroidBeltPoints",
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

      // Three-tier sprite-size distribution: mostly small, some medium, few larger.
      const u = rng();
      let t: number;
      if (u < 0.8) {
        t = Math.pow(rng(), 2.6) * 0.35;
      } else if (u < 0.97) {
        t = 0.25 + Math.pow(rng(), 1.4) * 0.45;
      } else {
        t = 0.6 + Math.pow(rng(), 0.65) * 0.4;
      }
      aSize[i] =
        this.opts.minSpriteSize +
        (this.opts.maxSpriteSize - this.opts.minSpriteSize) * THREE.MathUtils.clamp(t, 0, 1);
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
      name: this.opts.profile === "kuiper" ? "KuiperBeltImpostorMaterial" : "AsteroidBeltImpostorMaterial",
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
    this.points.name = this.opts.pointsName;

    this.group.name = this.opts.groupName;
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
    if (this.opts.profile === "kuiper") {
      // Broad, clumpy trans-Neptunian distribution. Cinematic, not a strict MPC model.
      const t = (radius - this.opts.innerRadius) / (this.opts.outerRadius - this.opts.innerRadius);
      const broad = 0.68 + Math.exp(-Math.pow((t - 0.45) / 0.36, 2.0)) * 0.24;
      const outerFalloff = 1.0 - smooth01((t - 0.9) / 0.14) * 0.35;
      const innerFalloff = 0.72 + smooth01((t - 0.04) / 0.14) * 0.28;

      const cluster = (center: number, width: number, boost: number) => {
        const x = (radius - center) / width;
        return 1.0 + Math.exp(-x * x) * boost;
      };
      const dip = (center: number, width: number, depth: number) => {
        const x = (radius - center) / width;
        return 1.0 - Math.exp(-x * x) * depth;
      };

      let w = broad * outerFalloff * innerFalloff;
      w *= cluster(38200, 1600, 0.14);
      w *= cluster(43800, 1900, 0.1);
      w *= dip(47200, 1400, 0.18);
      return THREE.MathUtils.clamp(w, 0.05, 1.0);
    }

    // Main belt: gentle cinematic density shaping + subtle Kirkwood-like dips.
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
    w *= dip(3270, 95, 0.28);

    return THREE.MathUtils.clamp(w, 0.08, 1.0);
  }

  private sampleColor(rng: Rng): THREE.Color {
    // Main belt is darker rock. Kuiper gets colder, slightly icier tones.
    const palette = this.opts.profile === "kuiper"
      ? [
          new THREE.Color("#666a72"),
          new THREE.Color("#707985"),
          new THREE.Color("#5f6670"),
          new THREE.Color("#7b7f86"),
          new THREE.Color("#6f7480"),
          new THREE.Color("#8a867d"),
        ]
      : [
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
    const satFactor = this.opts.profile === "kuiper" ? (0.75 + rng() * 0.28) : (0.85 + rng() * 0.35);
    const lightFactor = this.opts.profile === "kuiper" ? (0.78 + rng() * 0.46) : (0.82 + rng() * 0.38);
    const lightMin = this.opts.profile === "kuiper" ? 0.22 : 0.2;
    const lightMax = this.opts.profile === "kuiper" ? 0.78 : 0.72;
    c.setHSL(
      hsl.h,
      THREE.MathUtils.clamp(hsl.s * satFactor, 0, 1),
      THREE.MathUtils.clamp(hsl.l * lightFactor, lightMin, lightMax),
    );
    return c;
  }
}

function smooth01(x: number): number {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}
