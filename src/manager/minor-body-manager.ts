import type * as THREE from "three";
import {
  asteroidBeltZone,
  kuiperBeltInnerZone,
  kuiperBeltOuterZone,
} from "../../data/raw-object.data";
import { AsteroidBelt } from "../objects/asteroid-belt.object";
import { AstronomicalDataParser } from "../parser/astronomical-data.parser";
import type { UpdateContext } from "../core/update-context";

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
    count: 4096,
    innerRadius: kuiperBeltInnerZone.innerRadiusKm / AstronomicalDataParser.FINN_TO_KM,
    outerRadius: kuiperBeltInnerZone.outerRadiusKm / AstronomicalDataParser.FINN_TO_KM,
    maxEccentricity: 0.08,
    inclinationStdDeg: 3.5,
    minSpriteSize: 180,
    maxSpriteSize: 360,
    seed: 7331,
  });

  private readonly kuiperHotBelt = new AsteroidBelt({
    profile: "kuiperHot",
    groupName: "KuiperBeltHot",
    pointsName: "KuiperBeltHotPoints",
    count: 1024,
    innerRadius: kuiperBeltOuterZone.innerRadiusKm / AstronomicalDataParser.FINN_TO_KM,
    outerRadius: kuiperBeltOuterZone.outerRadiusKm / AstronomicalDataParser.FINN_TO_KM,
    maxEccentricity: 0.22,
    inclinationStdDeg: 14.0,
    minSpriteSize: 60,
    maxSpriteSize: 240,
    seed: 7349,
  });

  private readonly ambientDebris = new AsteroidBelt({
    profile: "ambient",
    groupName: "AmbientDebrisField",
    pointsName: "AmbientDebrisFieldPoints",
    count: 1024,
    innerRadius: asteroidBeltZone.innerRadiusKm / AstronomicalDataParser.FINN_TO_KM,
    outerRadius: kuiperBeltOuterZone.outerRadiusKm / AstronomicalDataParser.FINN_TO_KM,
    maxEccentricity: 0.55,
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

  public render(ctx: UpdateContext): void {
    if (!this.isInit) return;
    this.mainAsteroidBelt.render(ctx);
    this.kuiperColdBelt.render(ctx);
    this.kuiperHotBelt.render(ctx);
    this.ambientDebris.render(ctx);
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
