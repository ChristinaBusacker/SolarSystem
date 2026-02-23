import type * as THREE from "three";
import { AsteroidBelt } from "../objects/asteroid-belt.object";

/**
 * Holds minor body visuals that should not be forced into AstronomicalObject.
 *
 * First step: main asteroid belt (Mars–Jupiter).
 * Later: Kuiper belt, comets, etc.
 */
export class MinorBodyManager {
  private readonly asteroidBelt = new AsteroidBelt();
  private isInit = false;

  public init(scene: THREE.Scene): void {
    if (this.isInit) return;
    this.isInit = true;

    this.asteroidBelt.init();
    scene.add(this.asteroidBelt.group);
  }

  public render(delta: number): void {
    if (!this.isInit) return;
    this.asteroidBelt.render(delta);
  }

  public preBloom(): void {
    if (!this.isInit) return;
    this.asteroidBelt.preBloom();
  }

  public postBloom(): void {
    if (!this.isInit) return;
    this.asteroidBelt.postBloom();
  }
}
