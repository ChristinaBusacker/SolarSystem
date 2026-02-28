import * as THREE from "three";

import type { UpdateContext } from "../core/update-context";
import type { AstronomicalManager } from "./AstronomicalManager";
import type { CameraManager } from "./CameraManager";
import { SoundManager } from "./SoundManager";
import {
  closeAllSidebars,
  getLayoutState,
  openSidebar,
  type LayoutState,
} from "../ui/layout-state";
import {
  getSceneVisibilityState,
  setMarkersVisible,
  setOrbitsVisible,
  type SceneVisibilityState,
} from "../ui/scene-visibility-state";

type ShotKind = "orbit" | "flyby";

type CinematicShot = {
  kind: ShotKind;
  target: string;
  durationSec: number;
  /** Number of revolutions around the target in the shot (orbit only). */
  revolutions?: number;
  /** Optional: change flyby feel (e.g. ring sweep on Saturn). */
  flybyStyle?: "default" | "ringSweep";
};

export type CinematicDirectorDeps = {
  cameraManager: CameraManager;
  astronomicalManager: AstronomicalManager;
};

/**
 * Scripted camera mode.
 *
 * Scope:
 * - Owns camera movement while `active`.
 * - Enforces cinematic visibility (markers/orbits off) and restores previous state on stop.
 * - Attempts to start ambient sound when entering cinematic mode (must be triggered from a user gesture).
 */
export class CinematicDirector {
  private readonly deps: CinematicDirectorDeps;

  private active = false;

  // A curated playlist. Keep durations fairly long to let scenes breathe.
  private playlist: CinematicShot[] = [
    { kind: "flyby", target: "Titan", durationSec: 18 },
    { kind: "orbit", target: "Saturn", durationSec: 12, revolutions: 0.22 },

    { kind: "flyby", target: "Saturn", durationSec: 22, flybyStyle: "ringSweep" },

    { kind: "orbit", target: "Jupiter", durationSec: 24, revolutions: 0.26 },
    { kind: "flyby", target: "Europa", durationSec: 16 },
    { kind: "flyby", target: "Io", durationSec: 16 },

    { kind: "orbit", target: "Earth", durationSec: 22, revolutions: 0.32 },
    { kind: "flyby", target: "Moon", durationSec: 16 },

    { kind: "orbit", target: "Neptune", durationSec: 24, revolutions: 0.2 },
    { kind: "flyby", target: "Triton", durationSec: 18 },

    { kind: "orbit", target: "Uranus", durationSec: 24, revolutions: 0.22 },
    { kind: "flyby", target: "Miranda", durationSec: 16 },

    { kind: "flyby", target: "Mars", durationSec: 16 },
    { kind: "orbit", target: "Sun", durationSec: 26, revolutions: 0.12 },
  ];

  private shotIndex = 0;
  private shotTime = 0;

  private prevVisibility: SceneVisibilityState | null = null;
  private prevLayout: LayoutState | null = null;

  private tmpTarget = new THREE.Vector3();
  private tmpPos = new THREE.Vector3();
  private tmpStart = new THREE.Vector3();
  private tmpEnd = new THREE.Vector3();
  private tmpLead = new THREE.Vector3();
  private yAxis = new THREE.Vector3(0, 1, 0);

  public constructor(deps: CinematicDirectorDeps) {
    this.deps = deps;
  }

  public isActive(): boolean {
    return this.active;
  }

  /**
   * Start cinematic mode.
   *
   * IMPORTANT: Call this from a user gesture if you want sound to start.
   */
  public async start(): Promise<void> {
    if (this.active) return;

    this.prevVisibility = getSceneVisibilityState();
    this.prevLayout = getLayoutState();

    // Cinematic defaults: no UI clutter.
    setMarkersVisible(false);
    setOrbitsVisible(false);
    closeAllSidebars();

    this.active = true;
    this.shotIndex = 0;
    this.shotTime = 0;

    // Sound: best effort (will only work after a gesture).
    try {
      await SoundManager.unlock();
      await SoundManager.playAmbient();
    } catch {
      // Autoplay restrictions or missing buffer: ignore.
    }
  }

  public stop(): void {
    if (!this.active) return;
    this.active = false;

    // Restore scene visibility.
    if (this.prevVisibility) {
      setMarkersVisible(this.prevVisibility.markersVisible);
      setOrbitsVisible(this.prevVisibility.orbitsVisible);
    }

    // Restore layout state.
    if (this.prevLayout) {
      if (this.prevLayout.leftOpen) openSidebar("left");
      else if (this.prevLayout.rightOpen) openSidebar("right");
      else closeAllSidebars();
    }

    this.prevVisibility = null;
    this.prevLayout = null;
  }

  public update(ctx: UpdateContext): void {
    if (!this.active) return;

    // Enforce cinematic visibility (in case UI toggles fight back).
    const vis = getSceneVisibilityState();
    if (vis.markersVisible) setMarkersVisible(false);
    if (vis.orbitsVisible) setOrbitsVisible(false);

    const entry = this.deps.cameraManager.getActiveEntry();
    if (!entry || entry.selector !== "Cinematic") return;

    const cam = entry.camera;

    const shot = this.playlist[this.shotIndex % this.playlist.length];
    this.shotTime += ctx.delta;

    const t = THREE.MathUtils.clamp(this.shotTime / Math.max(0.001, shot.durationSec), 0, 1);
    const eased = t * t * (3 - 2 * t); // smoothstep

    const targetPos = this.resolveTargetWorldPos(shot.target, this.tmpTarget);

    // Determine a "nice" radius based on the target camera control (planet OR moon).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetObj: any = this.deps.astronomicalManager.findBody(shot.target);
    const control = targetObj?.control;

    const distMin = Number.isFinite(control?.distanceMin) ? (control.distanceMin as number) : 0.02;
    const distMax = Number.isFinite(control?.distanceMax) ? (control.distanceMax as number) : 0.35;

    const orbitRadius = THREE.MathUtils.clamp(distMax * 0.58, distMin * 1.25, distMax * 0.78);
    const flyRadius = THREE.MathUtils.clamp(distMax * 0.4, distMin * 1.1, distMax * 0.68);

    const baseAngle = this.shotIndex * 1.35;

    if (shot.kind === "orbit") {
      const rev = shot.revolutions ?? 0.35;
      const ang = baseAngle + eased * Math.PI * 2 * rev;
      const y = Math.sin(eased * Math.PI * 2 * 0.55) * orbitRadius * 0.16;

      this.tmpPos.set(Math.cos(ang) * orbitRadius, y, Math.sin(ang) * orbitRadius);
      cam.position.copy(targetPos).add(this.tmpPos);
      cam.lookAt(targetPos);
    } else {
      // Flyby: pass the planet on a tangential path with a gentle vertical drift.
      const style = shot.flybyStyle ?? "default";
      if (style === "ringSweep") {
        // Saturn ring sweep: very low elevation, more lateral motion.
        this.tmpStart.set(-flyRadius * 1.55, flyRadius * 0.04, flyRadius * 1.05);
        this.tmpEnd.set(flyRadius * 1.45, flyRadius * 0.02, -flyRadius * 0.95);
      } else {
        this.tmpStart.set(-flyRadius * 1.35, flyRadius * 0.16, flyRadius * 0.85);
        this.tmpEnd.set(flyRadius * 1.2, flyRadius * 0.05, -flyRadius * 0.65);
      }

      // Rotate path around Y for variety.
      this.tmpStart.applyAxisAngle(this.yAxis, baseAngle);
      this.tmpEnd.applyAxisAngle(this.yAxis, baseAngle);

      this.tmpPos.copy(this.tmpStart).lerp(this.tmpEnd, eased);
      cam.position.copy(targetPos).add(this.tmpPos);

      // Lead the lookAt slightly for a more cinematic feel.
      this.tmpLead
        .copy(this.tmpEnd)
        .sub(this.tmpStart)
        .normalize()
        .multiplyScalar(flyRadius * 0.065);
      this.tmpEnd.copy(this.tmpTarget).add(this.tmpLead);
      cam.lookAt(this.tmpEnd);
    }

    cam.updateMatrixWorld();

    if (this.shotTime >= shot.durationSec) {
      this.shotIndex++;
      this.shotTime = 0;
    }
  }

  private resolveTargetWorldPos(target: string, out: THREE.Vector3): THREE.Vector3 {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = this.deps.astronomicalManager.findBody(target);
    const mesh: THREE.Object3D | undefined = obj?.mesh ?? obj?.group ?? obj?.orbitalGroup;

    if (mesh) {
      mesh.getWorldPosition(out);
      return out;
    }

    // Fallback: sun center-ish
    out.set(0, 0, 0);
    return out;
  }
}
