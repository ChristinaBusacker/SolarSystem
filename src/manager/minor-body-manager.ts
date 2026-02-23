import type * as THREE from "three";
import { AsteroidBelt } from "../objects/asteroid-belt.object";

/**
 * Holds minor body visuals that should not be forced into AstronomicalObject.
 *
 * Includes:
 * - Main asteroid belt (Mars–Jupiter)
 * - Kuiper belt (beyond Neptune, cinematic/compressed scale)
 */
export class MinorBodyManager {
  private readonly mainAsteroidBelt = new AsteroidBelt();

  private readonly kuiperBelt = new AsteroidBelt({
    profile: "kuiper",
    groupName: "KuiperBelt",
    pointsName: "KuiperBeltPoints",
    count: 1300,
    // Cinematic but still beyond Neptune (~30050 in this project scale)
    innerRadius: 34000,
    outerRadius: 52000,
    maxEccentricity: 0.12,
    inclinationStdDeg: 9.0,
    // Screen-space sprite sizes must be much larger at these distances
    // so the impostors stay visible and don't collapse to star pixels.
    minSpriteSize: 180,
    maxSpriteSize: 540,
    seed: 7331,
  });

  private isInit = false;

  public init(scene: THREE.Scene): void {
    if (this.isInit) return;
    this.isInit = true;

    this.mainAsteroidBelt.init();
    this.kuiperBelt.init();

    scene.add(this.mainAsteroidBelt.group);
    scene.add(this.kuiperBelt.group);
  }

  public render(delta: number): void {
    if (!this.isInit) return;
    this.mainAsteroidBelt.render(delta);
    this.kuiperBelt.render(delta);
  }

  public preBloom(): void {
    if (!this.isInit) return;
    this.mainAsteroidBelt.preBloom();
    this.kuiperBelt.preBloom();
  }

  public postBloom(): void {
    if (!this.isInit) return;
    this.mainAsteroidBelt.postBloom();
    this.kuiperBelt.postBloom();
  }
}
