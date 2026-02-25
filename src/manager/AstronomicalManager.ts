import { AstronomicalEntry } from "../interfaces/entry.interfaces";
import { Earth } from "../objects/earth.object";
import { Jupiter } from "../objects/jupiter.object";
import { Mars } from "../objects/mars.object";
import { Neptun } from "../objects/neptun.object";
import { Pluto } from "../objects/pluto.object";
import { Saturn } from "../objects/saturn.object";
import { Sun } from "../objects/sun.object";
import { Uranus } from "../objects/uranus.object";
import { Venus } from "../objects/venus.object";
import type * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { ceresRawData, erisRawData, haumeaRawData, makemakeRawData, mercuryRawData } from "../../data/raw-object.data";
import { SimpleAstronomicalBody } from "../objects/simple-astronomical.object";

export class AstronomicalManager {
  private entrys: Array<AstronomicalEntry> = [
    { selector: "Sun", object: new Sun() },
    { selector: "Mercury", object: new SimpleAstronomicalBody("/assets/textures/2k_mercury.jpg", "/assets/normals/2k_mercury.png", mercuryRawData) },
    { selector: "Venus", object: new Venus() },
    { selector: "Earth", object: new Earth() },
    { selector: "Mars", object: new Mars() },
    { selector: "Ceres", object: new SimpleAstronomicalBody("/assets/textures/1k_ceres.png", "/assets/normals/2k_moon.png", ceresRawData) },
    { selector: "Jupiter", object: new Jupiter() },
    { selector: "Saturn", object: new Saturn() },
    { selector: "Uranus", object: new Uranus() },
    { selector: "Neptune", object: new Neptun() },
    { selector: "Pluto", object: new Pluto() },
    { selector: "Haumea", object: new SimpleAstronomicalBody("/assets/textures/1k_haumea.png", "/assets/normals/2k_moon.png", haumeaRawData) },
    { selector: "Makemake", object: new SimpleAstronomicalBody("/assets/textures/3k_makemake.jpg", "/assets/normals/2k_moon.png", makemakeRawData) },
    { selector: "Eris", object: new SimpleAstronomicalBody("/assets/textures/2k_eris.png", "/assets/normals/2k_moon.png", erisRawData) },
  ];

  constructor() { }

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

  public setOrbitLineResolution(width: number, height: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(width * dpr);
    const h = Math.floor(height * dpr);
    this.entrys.forEach((entry) => {
      const obj: any = entry.object as any;
      if (obj.marker && obj.marker.material) {
        const m = obj.marker.material as LineMaterial;
        if (m.resolution) m.resolution.set(w, h);
      }

      entry.object.moons.forEach((moon) => {
        const mo: any = moon as any;
        if (mo.marker && mo.marker.material) {
          const mm = mo.marker.material as LineMaterial;
          if (mm.resolution) mm.resolution.set(w, h);
        }
      });
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
