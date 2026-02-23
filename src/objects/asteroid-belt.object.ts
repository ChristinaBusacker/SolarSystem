import * as THREE from "three";
import { PURE_BLACK_MATERIAL } from "../constant/pureBlackMaterial.constant";
import { APP } from "..";
import { earthData } from "../../data/objects.data";

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
  // Box–Muller transform
  const u = Math.max(1e-8, rng());
  const v = Math.max(1e-8, rng());
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export interface AsteroidBeltOptions {
  /** Total instance count across all shape variants. */
  count: number;
  /** Inner radius of the belt (in your scene units). */
  innerRadius: number;
  /** Outer radius of the belt (in your scene units). */
  outerRadius: number;
  /** Maximum eccentricity (0..1). */
  maxEccentricity: number;
  /** Inclination standard deviation in degrees. */
  inclinationStdDeg: number;
  /** Minimum asteroid radius (in your planet size units). */
  minSize: number;
  /** Maximum asteroid radius (in your planet size units). */
  maxSize: number;
  /** How many base shape variants to create (draw calls). */
  shapeVariants: number;
  /** Seed for stable generation. */
  seed: number;
}

interface AsteroidInstance {
  a: number;
  b: number;
  e: number;
  omega: number;
  inc: number;
  phase: number;
  speed: number;
  scale: number;
  spin: number;
  spinSpeed: number;
  color: THREE.Color;
}

/**
 * Main asteroid belt as a small set of InstancedMeshes.
 *
 * Design goals:
 * - performant (few draw calls)
 * - varied shapes (multiple base geometries)
 * - plausible orbits (Kepler-ish speed, small eccentricities & inclinations)
 * - reacts to sunlight (uses StandardMaterial + a point light in the scene)
 */
export class AsteroidBelt {
  public readonly group = new THREE.Group();

  private readonly meshes: THREE.InstancedMesh[] = [];
  private readonly instancesByMesh: AsteroidInstance[][] = [];

  private readonly material: THREE.MeshStandardMaterial;
  private readonly bloomMaterial = PURE_BLACK_MATERIAL;

  private readonly tmpMatrix = new THREE.Matrix4();
  private readonly tmpPos = new THREE.Vector3();
  private readonly tmpQuat = new THREE.Quaternion();
  private readonly tmpScale = new THREE.Vector3();
  private readonly tmpEuler = new THREE.Euler();

  private readonly opts: AsteroidBeltOptions;

  public constructor(opts?: Partial<AsteroidBeltOptions>) {
    // Defaults tuned for your cinematic-but-compressed scale.
    this.opts = {
      count: 6000,
      innerRadius: 2100,
      outerRadius: 3300,
      maxEccentricity: 0.12,
      inclinationStdDeg: 5,
      minSize: 0.02,
      maxSize: 0.18,
      shapeVariants: 6,
      seed: 1337,
      ...opts,
    };

    this.material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
      vertexColors: true,
    });
  }

  public init(): void {
    const rng = mulberry32(this.opts.seed);

    // Create a handful of lowpoly base geometries and "dent" them for variety.
    const geometries: THREE.BufferGeometry[] = [];
    for (let i = 0; i < this.opts.shapeVariants; i++) {
      const base = new THREE.IcosahedronGeometry(1, 0);
      const pos = base.attributes.position as THREE.BufferAttribute;
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v);
        const y = pos.getY(v);
        const z = pos.getZ(v);
        // Small vertex jitter.
        const j = 1 + (rng() - 0.5) * 0.35;
        pos.setXYZ(v, x * j, y * j, z * j);
      }
      base.computeVertexNormals();
      geometries.push(base);
    }

    const perMesh = Math.ceil(this.opts.count / this.opts.shapeVariants);

    for (let gi = 0; gi < geometries.length; gi++) {
      const mesh = new THREE.InstancedMesh(
        geometries[gi],
        this.material,
        perMesh,
      );
      mesh.frustumCulled = false;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(perMesh * 3),
        3,
      );

      this.meshes.push(mesh);
      this.instancesByMesh.push([]);
      this.group.add(mesh);
    }

    // Distribute instances across variants.
    for (let i = 0; i < this.opts.count; i++) {
      const mi = i % this.meshes.length;
      const inst = this.createInstance(rng);
      this.instancesByMesh[mi].push(inst);
    }

    // Ensure we only draw initialized instances (some variants may have fewer than perMesh).
    for (let mi = 0; mi < this.meshes.length; mi++) {
      this.meshes[mi].count = this.instancesByMesh[mi].length;
    }

    // Initial placement.
    this.updateMatrices(0, true);
  }

  public preBloom(): void {
    // Do not contribute to bloom by default.
    for (const m of this.meshes) m.material = this.bloomMaterial;
  }

  public postBloom(): void {
    for (const m of this.meshes) m.material = this.material;
  }

  public render(delta: number): void {
    if (delta <= 0) return;
    this.updateMatrices(delta, false);
  }

  private createInstance(rng: Rng): AsteroidInstance {
    // Uniform in area for ring-like distribution.
    const r2Min = this.opts.innerRadius * this.opts.innerRadius;
    const r2Max = this.opts.outerRadius * this.opts.outerRadius;
    const a = Math.sqrt(r2Min + (r2Max - r2Min) * rng());

    // Small eccentricities, biased towards near-circular.
    const e = Math.pow(rng(), 2.2) * this.opts.maxEccentricity;
    const b = a * Math.sqrt(1 - e * e);

    const omega = rng() * Math.PI * 2;
    const phase = rng() * Math.PI * 2;

    const incStd = THREE.MathUtils.degToRad(this.opts.inclinationStdDeg);
    const inc = randNormal(rng) * incStd;

    // Kepler-ish scaling based on your Earth reference.
    const speed =
      earthData.orbitalSpeed * Math.pow(earthData.distanceToOrbiting / a, 1.5);

    // Size distribution: lots of small, few large.
    const t = Math.pow(rng(), 6.0);
    const scale =
      this.opts.minSize + (this.opts.maxSize - this.opts.minSize) * (1 - t);

    const spin = rng() * Math.PI * 2;
    const spinSpeed = (rng() - 0.5) * 0.9;

    // Slight color variation.
    const base = new THREE.Color(0x9e9a93);
    const warm = new THREE.Color(0xb09a7a);
    const cool = new THREE.Color(0x8a949e);
    const mix1 = rng();
    const mix2 = rng();
    const c = base
      .clone()
      .lerp(warm, mix1 * 0.55)
      .lerp(cool, mix2 * 0.45);

    return {
      a,
      b,
      e,
      omega,
      inc,
      phase,
      speed,
      scale,
      spin,
      spinSpeed,
      color: c,
    };
  }

  private updateMatrices(delta: number, updateColors: boolean): void {
    const timeFactor = delta * 60 * APP.simulationSpeed;

    for (let mi = 0; mi < this.meshes.length; mi++) {
      const mesh = this.meshes[mi];
      const instances = this.instancesByMesh[mi];

      for (let i = 0; i < instances.length; i++) {
        const it = instances[i];

        // Advance orbit.
        it.phase = THREE.MathUtils.euclideanModulo(
          it.phase - it.speed * timeFactor,
          Math.PI * 2,
        );

        // Ellipse in XZ with an offset for eccentricity.
        const x0 = it.a * Math.cos(it.phase) - it.a * it.e;
        const z0 = it.b * Math.sin(it.phase);

        // Rotate orbit within plane by omega.
        const cosO = Math.cos(it.omega);
        const sinO = Math.sin(it.omega);
        let x = x0 * cosO - z0 * sinO;
        let z = x0 * sinO + z0 * cosO;
        let y = 0;

        // Inclination (rotate around X).
        const cosI = Math.cos(it.inc);
        const sinI = Math.sin(it.inc);
        const z2 = z * cosI - y * sinI;
        const y2 = z * sinI + y * cosI;
        z = z2;
        y = y2;

        this.tmpPos.set(x, y, z);

        // Spin for a bit of life.
        it.spin += it.spinSpeed * timeFactor * 0.002;
        this.tmpEuler.set(it.spin, it.spin * 0.7, it.spin * 1.1);
        this.tmpQuat.setFromEuler(this.tmpEuler);

        this.tmpScale.setScalar(it.scale);
        this.tmpMatrix.compose(this.tmpPos, this.tmpQuat, this.tmpScale);
        mesh.setMatrixAt(i, this.tmpMatrix);
        if (updateColors) mesh.setColorAt(i, it.color);
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (updateColors && mesh.instanceColor)
        mesh.instanceColor.needsUpdate = true;
    }
  }
}
