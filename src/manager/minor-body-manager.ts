import type * as THREE from "three";
import { AsteroidBelt } from "../objects/asteroid-belt.object";

/**
 * Holds minor body visuals that should not be forced into AstronomicalObject.
 *
 * Includes:
 * - Main asteroid belt (Mars–Jupiter)
 * - Kuiper belt as two populations (cold + hot)
 * - Sparse ambient debris for a little motion in the wider system
 */
export class MinorBodyManager {
  private readonly mainAsteroidBelt = new AsteroidBelt();

  private readonly kuiperColdBelt = new AsteroidBelt({
    profile: "kuiperCold",
    groupName: "KuiperBeltCold",
    pointsName: "KuiperBeltColdPoints",
    count: 2048,
    innerRadius: 36000,
    outerRadius: 48000,
    maxEccentricity: 0.08,
    inclinationStdDeg: 3.5,
    minSpriteSize: 190,
    maxSpriteSize: 560,
    seed: 7331,
  });

  private readonly kuiperHotBelt = new AsteroidBelt({
    profile: "kuiperHot",
    groupName: "KuiperBeltHot",
    pointsName: "KuiperBeltHotPoints",
    count: 512,
    innerRadius: 33000,
    outerRadius: 54000,
    maxEccentricity: 0.22,
    inclinationStdDeg: 14.0,
    minSpriteSize: 150,
    maxSpriteSize: 460,
    seed: 7349,
  });

  private readonly ambientDebris = new AsteroidBelt({
    profile: "ambient",
    groupName: "AmbientDebrisField",
    pointsName: "AmbientDebrisFieldPoints",
    count: 256,
    // Very sparse cinematic filler across the planetary region (not a real belt).
    innerRadius: 1400,
    outerRadius: 32000,
    maxEccentricity: 0.16,
    inclinationStdDeg: 5.0,
    minSpriteSize: 8,
    maxSpriteSize: 34,
    seed: 9911,
  });

  private isInit = false;

  public init(scene: THREE.Scene): void {
    if (this.isInit) return;
    this.isInit = true;

    this.mainAsteroidBelt.init();
    this.kuiperColdBelt.init();
    this.kuiperHotBelt.init();
    this.ambientDebris.init();

    scene.add(this.mainAsteroidBelt.group);
    scene.add(this.kuiperColdBelt.group);
    scene.add(this.kuiperHotBelt.group);
    scene.add(this.ambientDebris.group);
  }

  public render(delta: number): void {
    if (!this.isInit) return;
    this.mainAsteroidBelt.render(delta);
    this.kuiperColdBelt.render(delta);
    this.kuiperHotBelt.render(delta);
    this.ambientDebris.render(delta);
  }

  public preBloom(): void {
    if (!this.isInit) return;
    this.mainAsteroidBelt.preBloom();
    this.kuiperColdBelt.preBloom();
    this.kuiperHotBelt.preBloom();
    this.ambientDebris.preBloom();
  }

  public postBloom(): void {
    if (!this.isInit) return;
    this.mainAsteroidBelt.postBloom();
    this.kuiperColdBelt.postBloom();
    this.kuiperHotBelt.postBloom();
    this.ambientDebris.postBloom();
  }
}
