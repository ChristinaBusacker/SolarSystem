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
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { ceresRawData, erisRawData, haumeaRawData, makemakeRawData, mercuryRawData } from "../../data/raw-object.data";
import { SimpleAstronomicalBody } from "../objects/simple-astronomical.object";
import { router } from "../router/router";

type DeclutterOptions = {
  camera: THREE.PerspectiveCamera;
  markersVisible: boolean;
  orbitsVisible: boolean;
  declutterAuto: boolean;
};

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

  // Expose entries for UI-only declutter/layout logic (read-only usage).
  public getAllEntries(): Array<AstronomicalEntry> {
    return this.entrys;
  }

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

  /**
   * Cinematic declutter rules for orbits + CSS2D labels.
   *
   * Rules (Auto ON):
   * - No selection (home): labels + markers for Sun + 8 planets, and planet orbits.
   * - Selected planet: show the planet + its moons; show only moon orbits (no planet orbit).
   * - Selected moon: treat its parent as the focus (show sibling moons + their orbits).
   */
  public applyDeclutterVisibility(opts: DeclutterOptions): void {
    const { camera, markersVisible, orbitsVisible, declutterAuto } = opts;

    const majorSlugs = new Set([
      "sun",
      "mercury",
      "venus",
      "earth",
      "mars",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
    ]);

    const dwarfSlugs = new Set([
      "ceres",
      "pluto",
      "haumea",
      "makemake",
      "eris",
    ]);

    const toSlug = (v: string): string => (v || "").toLowerCase();

    const route = router.getCurrent();
    const selectedKind = route.name === "planet" ? "planet" : route.name === "moon" ? "moon" : null;
    const selectedSlug =
      route.name === "planet" ? toSlug(route.planet) : route.name === "moon" ? toSlug(route.moon) : null;

    // Find selected moon + focus planet (for moon routes).
    let focusPlanetSlug: string | null = null;
    let selectedMoonSlug: string | null = null;

    if (selectedKind === "planet") {
      focusPlanetSlug = selectedSlug;
    } else if (selectedKind === "moon") {
      selectedMoonSlug = selectedSlug;
      for (const entry of this.entrys) {
        const parent = entry.object as any;
        const moon = (entry.object.moons as any[]).find((m) => (m?.data?.slug ?? "").toLowerCase() === selectedSlug);
        if (moon) {
          focusPlanetSlug = (parent?.data?.slug ?? "").toLowerCase();
          break;
        }
      }
    }

    // Compute camera distance to focus planet for moon label LOD.
    const camWorld = new THREE.Vector3();
    camera.getWorldPosition(camWorld);

    let focusPlanetPos: THREE.Vector3 | null = null;
    let focusPlanetSize = 0;
    if (focusPlanetSlug) {
      for (const entry of this.entrys) {
        const planet = entry.object as any;
        if ((planet?.data?.slug ?? "").toLowerCase() === focusPlanetSlug) {
          focusPlanetPos = new THREE.Vector3();
          planet.mesh.getWorldPosition(focusPlanetPos);
          focusPlanetSize = planet.data?.size ?? 0;
          break;
        }
      }
    }

    const focusDist = focusPlanetPos ? camWorld.distanceTo(focusPlanetPos) : Infinity;
    // LOD threshold for showing moon labels when focused.
    // data.size is *diameter* in Finn; this roughly equals radius*80.
    const moonLabelDistMax = Math.max(10, focusPlanetSize * 40);
    const showMoonLabels = focusPlanetSlug != null && focusDist < moonLabelDistMax;

    const setElementHidden = (el: HTMLElement | undefined, hidden: boolean): void => {
      if (!el) return;
      el.classList.toggle("hide", hidden);
      // Collision hiding is applied separately.
      el.classList.remove("hide-collide");
      el.classList.remove("hide-label");
    };

    const setLabelHidden = (el: HTMLElement | undefined, hidden: boolean): void => {
      if (!el) return;
      // Keep the dot visible but hide only the text label.
      el.classList.toggle("hide-label", hidden);
    };

    // When auto declutter is OFF, revert to the old behavior (all bodies follow the global toggles).
    if (!declutterAuto) {
      this.entrys.forEach((entry) => {
        const planet: any = entry.object as any;
        setElementHidden(planet.cssObject?.element, !markersVisible);
        if (planet.marker) planet.marker.visible = orbitsVisible;

        entry.object.moons.forEach((moon: any) => {
          setElementHidden(moon.cssObject?.element, !markersVisible);
          if (moon.marker) moon.marker.visible = orbitsVisible;
        });
      });
      return;
    }

    // Auto declutter ON.
    const hasSelection = !!focusPlanetSlug;

    // Precompute camera world position for overview-range rules.
    const camPos = camWorld;

    this.entrys.forEach((entry) => {
      const planet: any = entry.object as any;
      const planetSlug = (planet?.data?.slug ?? "").toLowerCase();
      const isMajor = majorSlugs.has(planetSlug);
      const isDwarf = dwarfSlugs.has(planetSlug);
      const isFocusPlanet = hasSelection && planetSlug === focusPlanetSlug;

      // ===== Labels / markers (CSS2D) =====
      if (!markersVisible) {
        setElementHidden(planet.cssObject?.element, true);
      } else if (!hasSelection) {
        // Home / overview: show major bodies + dwarf planets.
        setElementHidden(planet.cssObject?.element, !(isMajor || isDwarf));
      } else {
        // Selected: show only focus planet.
        setElementHidden(planet.cssObject?.element, !isFocusPlanet);
      }

      // ===== Planet orbit line =====
      if (planet.marker) {
        if (!orbitsVisible) {
          planet.marker.visible = false;
        } else if (!hasSelection) {
          // Overview: show planet and dwarf-planet orbits (Sun is excluded).
          planet.marker.visible = !!planet.data?.isOrbiting && (isMajor || isDwarf);
        } else {
          // Focus mode: hide planet orbits (moons only).
          planet.marker.visible = false;
        }
      }

      // ===== Moons =====
      entry.object.moons.forEach((moon: any) => {
        const moonSlug = (moon?.data?.slug ?? "").toLowerCase();
        const moonIsSelected = selectedMoonSlug != null && moonSlug === selectedMoonSlug;

        // In overview mode, allow moon markers (dots) when the camera is close to their parent planet,
        // but hide moon labels by default to avoid clumping.
        let showMoonMarkerInOverview = false;
        let showMoonLabelInOverview = false;
        if (!hasSelection && markersVisible) {
          // Distance-based reveal around the nearest planet the user is looking at.
          if (planet?.mesh) {
            const pPos = new THREE.Vector3();
            planet.mesh.getWorldPosition(pPos);
            const d = camPos.distanceTo(pPos);
            // If the user zooms close to a planet (even without selecting it), reveal its moons.
            const revealDist = Math.max(15, (planet.data?.size ?? 0) * 35);
            if (d < revealDist) {
              showMoonMarkerInOverview = true;
              // Labels only when even closer.
              showMoonLabelInOverview = d < revealDist * 0.6;
            }
          }
        }

        // Labels
        if (!markersVisible) {
          setElementHidden(moon.cssObject?.element, true);
        } else if (!hasSelection) {
          // Overview: show moon marker dots only near a planet; hide text label unless very close.
          setElementHidden(moon.cssObject?.element, !showMoonMarkerInOverview);
          if (showMoonMarkerInOverview) {
            setLabelHidden(moon.cssObject?.element, !showMoonLabelInOverview);
          }
        } else if (isFocusPlanet) {
          // Focus planet: show moon labels only when zoomed close enough.
          // Keep the selected moon label visible even when zoomed out.
          setElementHidden(moon.cssObject?.element, !(showMoonLabels || moonIsSelected));
        } else {
          setElementHidden(moon.cssObject?.element, true);
        }

        // Orbits (moon markers)
        if (moon.marker) {
          if (!orbitsVisible) {
            moon.marker.visible = false;
          } else if (!hasSelection) {
            moon.marker.visible = false;
          } else if (isFocusPlanet) {
            // Focus mode: show only orbits for moons of the focus planet.
            moon.marker.visible = true;
          } else {
            moon.marker.visible = false;
          }
        }
      });
    });
  }
}
