import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import {
  ceresRawData,
  erisRawData,
  haumeaRawData,
  makemakeRawData,
  mercuryRawData,
} from "../../data/raw-object.data";
import { AstronomicalEntry } from "../interfaces/entry.interfaces";
import { Earth } from "../objects/earth.object";
import { Jupiter } from "../objects/jupiter.object";
import { Mars } from "../objects/mars.object";
import { Neptun } from "../objects/neptun.object";
import { Pluto } from "../objects/pluto.object";
import { Saturn } from "../objects/saturn.object";
import { SimpleAstronomicalBody } from "../objects/simple-astronomical.object";
import { Sun } from "../objects/sun.object";
import { Uranus } from "../objects/uranus.object";
import { Venus } from "../objects/venus.object";
import { router } from "../router/router";
import type { CameraRegistry } from "../core/camera-registry";
import type { UpdateContext } from "../core/update-context";
import { computeDeclutterVisibility } from "../labels/declutter";
import type { DeclutterBody } from "../labels/declutter";

type DeclutterOptions = {
  camera: THREE.PerspectiveCamera;
  markersVisible: boolean;
  orbitsVisible: boolean;
  declutterAuto: boolean;
};

export class AstronomicalManager {
  private entrys: Array<AstronomicalEntry> = [
    { selector: "Sun", object: new Sun() },
    {
      selector: "Mercury",
      object: new SimpleAstronomicalBody(
        "/assets/textures/2k_mercury.jpg",
        "/assets/normals/2k_mercury.png",
        mercuryRawData,
      ),
    },
    { selector: "Venus", object: new Venus() },
    { selector: "Earth", object: new Earth() },
    { selector: "Mars", object: new Mars() },
    {
      selector: "Ceres",
      object: new SimpleAstronomicalBody(
        "/assets/textures/1k_ceres.png",
        "/assets/normals/2k_moon.png",
        ceresRawData,
      ),
    },
    { selector: "Jupiter", object: new Jupiter() },
    { selector: "Saturn", object: new Saturn() },
    { selector: "Uranus", object: new Uranus() },
    { selector: "Neptune", object: new Neptun() },
    { selector: "Pluto", object: new Pluto() },
    {
      selector: "Haumea",
      object: new SimpleAstronomicalBody(
        "/assets/textures/1k_haumea.png",
        "/assets/normals/2k_moon.png",
        haumeaRawData,
      ),
    },
    {
      selector: "Makemake",
      object: new SimpleAstronomicalBody(
        "/assets/textures/3k_makemake.jpg",
        "/assets/normals/2k_moon.png",
        makemakeRawData,
      ),
    },
    {
      selector: "Eris",
      object: new SimpleAstronomicalBody(
        "/assets/textures/2k_eris.png",
        "/assets/normals/2k_moon.png",
        erisRawData,
      ),
    },
  ];

  public getAllEntries(): Array<AstronomicalEntry> {
    return this.entrys;
  }

  public initObjects(scene: THREE.Scene, cameraRegistry: CameraRegistry) {
    this.entrys.forEach(entry => {
      // Provide a registry so bodies can register their cameras without importing the app singleton.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyObj = entry.object as any;
      if (typeof anyObj.setCameraRegistry === "function") {
        anyObj.setCameraRegistry(cameraRegistry);
      }
      entry.object.init();
      scene.add(entry.object.orbitalGroup);
    });
  }

  public getEntry(selector: string): AstronomicalEntry | undefined {
    return this.entrys.find(entry => entry.selector === selector);
  }

  public preBloom() {
    this.entrys.forEach(entry => {
      entry.object.preBloom();
      entry.object.moons.forEach(moon => moon.preBloom());
    });
  }

  public postBloom() {
    this.entrys.forEach(entry => {
      entry.object.postBloom();
      entry.object.moons.forEach(moon => moon.postBloom());
    });
  }

  public render(ctx: UpdateContext) {
    this.entrys.forEach(entry => {
      entry.object.render(ctx);
    });
  }

  public setOrbitLineResolution(width: number, height: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(width * dpr);
    const h = Math.floor(height * dpr);

    this.entrys.forEach(entry => {
      if (entry.object.marker && entry.object.marker.material) {
        const m = entry.object.marker.material as LineMaterial;
        if (m.resolution) m.resolution.set(w, h);
      }

      entry.object.moons.forEach(moon => {
        if (moon.marker && moon.marker.material) {
          const mm = moon.marker.material as LineMaterial;
          if (mm.resolution) mm.resolution.set(w, h);
        }
      });
    });
  }

  public setOrbitsVisible(visible: boolean): void {
    this.entrys.forEach(entry => {
      if (entry.object.marker) entry.object.marker.visible = visible;

      entry.object.moons.forEach(moon => {
        if (moon.marker) moon.marker.visible = visible;
      });
    });
  }

  /**
   * Cinematic declutter rules for orbits + CSS2D labels.
   *
   * Rules (Auto ON):
   * - No selection (home): labels + markers for Sun + planets, and planet orbits.
   * - Selected planet: show the planet + its moons; show only moon orbits (no planet orbit).
   * - Selected moon: treat its parent as the focus (show sibling moons + their orbits).
   */
  public applyDeclutterVisibility(opts: DeclutterOptions): void {
    const { camera, markersVisible, orbitsVisible, declutterAuto } = opts;

    const toSlug = (v: string): string => (v || "").toLowerCase();

    const route = router.getCurrent();
    const selectedKind = route.name === "planet" ? "planet" : route.name === "moon" ? "moon" : null;
    const selectedSlug =
      route.name === "planet"
        ? toSlug(route.planet)
        : route.name === "moon"
          ? toSlug(route.moon)
          : null;

    // Find selected moon + focus planet (for moon routes).
    let focusPlanetSlug: string | null = null;
    let selectedMoonSlug: string | null = null;

    if (selectedKind === "planet") {
      focusPlanetSlug = selectedSlug;
    } else if (selectedKind === "moon") {
      selectedMoonSlug = selectedSlug;

      // Find parent planet for the selected moon.
      for (const entry of this.entrys) {
        const moon = entry.object.moons.find(
          m => (m?.data?.slug ?? "").toLowerCase() === selectedSlug,
        );
        if (moon) {
          focusPlanetSlug = (entry.object?.data?.slug ?? "").toLowerCase();
          break;
        }
      }
    }

    // Camera world position
    const camWorld = new THREE.Vector3();
    camera.getWorldPosition(camWorld);

    const setElementHidden = (el: HTMLElement | undefined, hidden: boolean): void => {
      if (!el) return;
      el.classList.toggle("hide", hidden);
      el.classList.remove("hide-collide");
      el.classList.remove("hide-label");
    };

    const setLabelHidden = (el: HTMLElement | undefined, hidden: boolean): void => {
      if (!el) return;
      el.classList.toggle("hide-label", hidden);
    };

    // Determine moon label LOD (keep moon markers visible, but hide labels when far)
    const tmpPlanetPos = new THREE.Vector3();
    let focusPlanetPos: THREE.Vector3 | null = null;
    let focusPlanetSize = 0;

    // Build bodies list for declutter engine
    const bodies: DeclutterBody[] = [];
    const tmpBodyPos = new THREE.Vector3();
    const tmpMoonPos = new THREE.Vector3();

    const dwarfSelectors = new Set(["ceres", "pluto", "haumea", "makemake", "eris"]);

    for (const entry of this.entrys) {
      const body = entry.object;

      const slug = toSlug(body?.data?.slug ?? entry.selector);
      const selectorSlug = toSlug(entry.selector);

      // Determine kind
      const kind: DeclutterBody["kind"] =
        selectorSlug === "sun" ? "sun" : dwarfSelectors.has(selectorSlug) ? "dwarf" : "planet";

      // Approx radius (world units). data.size seems to represent a diameter in your project.
      const size = body?.data?.size ?? 0;
      const radius = Math.max(1, size * 0.5);

      body.mesh.getWorldPosition(tmpBodyPos);

      bodies.push({
        id: slug,
        kind,
        position: { x: tmpBodyPos.x, y: tmpBodyPos.y, z: tmpBodyPos.z },
        radius,
      });

      // Track focus planet position/size for label LOD decision
      if (focusPlanetSlug && slug === focusPlanetSlug) {
        focusPlanetPos = tmpBodyPos.clone();
        focusPlanetSize = size;
      }

      // Moons
      body.moons.forEach(m => {
        const mSlug = toSlug(m?.data?.slug ?? "");
        if (!mSlug) return;

        m.mesh.getWorldPosition(tmpMoonPos);

        bodies.push({
          id: mSlug,
          kind: "moon",
          parentId: slug,
          position: { x: tmpMoonPos.x, y: tmpMoonPos.y, z: tmpMoonPos.z },
          radius: 1, // not used for occluders (we ignore moon occlusion spheres)
        });
      });
    }

    const focusDist = focusPlanetPos ? camWorld.distanceTo(focusPlanetPos) : Infinity;

    // data.size is treated as diameter; this is a project-specific heuristic
    const moonLabelDistMax = Math.max(10, focusPlanetSize * 40);
    const showMoonLabels = focusPlanetSlug != null && focusDist < moonLabelDistMax;

    const isOverview = selectedKind === null;

    const selectedId =
      selectedKind === "planet"
        ? (focusPlanetSlug ?? undefined)
        : selectedKind === "moon"
          ? (selectedMoonSlug ?? undefined)
          : undefined;

    const selectedParentId = selectedKind === "moon" ? (focusPlanetSlug ?? undefined) : undefined;

    const declutter = declutterAuto
      ? computeDeclutterVisibility({
          bodies,
          state: {
            cameraPos: { x: camWorld.x, y: camWorld.y, z: camWorld.z },
            isOverview,
            selectedId,
            selectedParentId,
            // Important: keep moon markers visible in focus mode (labels handled separately via showMoonLabels)
            thresholds: {
              moonFocusLabelDistance: Number.POSITIVE_INFINITY,
            },
            occlusion: {
              enabled: true,
              radiusMultiplier: 1.05,
            },
          },
        })
      : null;

    // Apply results
    this.entrys.forEach(entry => {
      const planet = entry.object;
      const planetSlug = toSlug(planet?.data?.slug ?? entry.selector);

      const planetSelected = selectedId != null && planetSlug === selectedId;

      const planetVisible =
        markersVisible &&
        !planetSelected &&
        (declutterAuto ? (declutter?.labelVisibleById[planetSlug] ?? false) : true);

      setElementHidden(planet.cssObject?.element, !planetVisible);

      const planetOrbitVisible =
        orbitsVisible &&
        (declutterAuto ? (declutter?.orbitVisibleById[planetSlug] ?? false) : true);

      if (planet.marker) planet.marker.visible = planetOrbitVisible;

      planet.moons.forEach(moon => {
        const moonSlug = toSlug(moon?.data?.slug ?? "");
        if (!moonSlug) return;

        const moonSelected = selectedId != null && moonSlug === selectedId;

        const moonVisible =
          markersVisible &&
          !moonSelected &&
          (declutterAuto ? (declutter?.labelVisibleById[moonSlug] ?? false) : true);

        setElementHidden(moon.cssObject?.element, !moonVisible);

        // When the moon marker is visible, we can optionally hide only the label text (LOD)
        if (moonVisible) {
          const isFocus = selectedKind != null; // planet or moon route
          const sameSystem = focusPlanetSlug != null && planetSlug === focusPlanetSlug;
          const hideMoonLabel = declutterAuto && isFocus && sameSystem && !showMoonLabels;

          setLabelHidden(moon.cssObject?.element, hideMoonLabel);
        }

        const moonOrbitVisible =
          orbitsVisible &&
          (declutterAuto ? (declutter?.orbitVisibleById[moonSlug] ?? false) : true);

        if (moon.marker) moon.marker.visible = moonOrbitVisible;
      });
    });
  }
}
