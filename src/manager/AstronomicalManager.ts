import { AstronomicalEntry } from "../interfaces/entry.interfaces";
import { Earth } from "../objects/earth.object";
import { Jupiter } from "../objects/jupiter.object";
import { Mars } from "../objects/mars.object";
import { Mercury } from "../objects/mercury.object";
import { Neptun } from "../objects/neptun.object";
import { Pluto } from "../objects/pluto.object";
import { Saturn } from "../objects/saturn.object";
import { Sun } from "../objects/sun.object";
import { Uranus } from "../objects/uranus.object";
import { Venus } from "../objects/venus.object";
import type * as THREE from "three";

export class AstronomicalManager {
  private entrys: Array<AstronomicalEntry> = [
    { selector: "Sun", object: new Sun() },
    { selector: "Mercury", object: new Mercury() },
    { selector: "Venus", object: new Venus() },
    { selector: "Earth", object: new Earth() },
    { selector: "Mars", object: new Mars() },
    { selector: "Jupiter", object: new Jupiter() },
    { selector: "Saturn", object: new Saturn() },
    { selector: "Uranus", object: new Uranus() },
    { selector: "Neptune", object: new Neptun() },
    { selector: "Pluto", object: new Pluto() },
  ];

  constructor() {}

  public initObjects(scene: THREE.Scene) {
    this.entrys.forEach((entry) => {
      entry.object.init();
      scene.add(entry.object.orbitalGroup);
    });
  }

  public getEntry(selector: string): AstronomicalEntry | undefined {
    return this.entrys.find((entry) => entry.selector === selector);
  }

  public preBloom() {
    this.entrys.forEach((entry) => {
      entry.object.preBloom();
      entry.object.moons.forEach((moon) => moon.preBloom());
    });
  }

  public postBloom() {
    this.entrys.forEach((entry) => {
      entry.object.postBloom();
      entry.object.moons.forEach((moon) => moon.postBloom());
    });
  }

  public render(
    delta: number,
    camera?: THREE.PerspectiveCamera,
    scene?: THREE.Scene,
  ) {
    this.entrys.forEach((entry) => {
      entry.object.render(delta, camera, scene);
    });
  }


  public setOrbitsVisible(visible: boolean): void {
    this.entrys.forEach((entry) => {
      const obj: any = entry.object as any;
      if (obj.marker) obj.marker.visible = visible;

      entry.object.moons.forEach((moon) => {
        const m: any = moon as any;
        if (m.marker) m.marker.visible = visible;
      });
    });
  }

}
