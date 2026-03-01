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
import { clearFocusTitleOverride, setFocusTitleOverride } from "../ui/focus-title-state";

type ShotKind = "orbit" | "flyby";

type CinematicShot = {
  kind: ShotKind;
  target: string;
  durationSec: number;
  /** Optional distance control: absolute world units for this shot. */
  distance?: number;
  /** Optional distance control: 0..1 relative in [distanceMin..distanceMax]. */
  distanceRel?: number;
  /** Blend duration (seconds) when entering this shot (softens cuts). */
  blendSec?: number;
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

  private paused = false;

  private debugLogging = false;

  // A curated playlist. Keep durations fairly long to let scenes breathe.
  private playlist: CinematicShot[] = [
    // Sun overview.
    { kind: "orbit", target: "Io", durationSec: 20, distanceRel: 0.2 },
    { kind: "orbit", target: "Jupiter", durationSec: 16, revolutions: 0.15, distanceRel: 0.2 },
    { kind: "flyby", target: "Mars", durationSec: 10, revolutions: 0.16, distanceRel: 0.2 },
    { kind: "orbit", target: "Mars", durationSec: 10, revolutions: -0.42, distanceRel: 0.1 },
    {
      kind: "orbit",
      target: "Earth",
      durationSec: 12,
      revolutions: 0.72,
      distanceRel: 0.06,
      flybyStyle: "ringSweep",
    },
    { kind: "orbit", target: "Mimas", durationSec: 22, revolutions: 0.42, distanceRel: 0.45 },
    {
      kind: "orbit",
      target: "Saturn",
      durationSec: 28,
      flybyStyle: "ringSweep",
      distanceRel: 0.38,
    },
    { kind: "orbit", target: "Iapetus", durationSec: 16, revolutions: 0.52, distanceRel: 0.15 },
    { kind: "orbit", target: "Neptune", durationSec: 36, revolutions: 0.34, distanceRel: 0.11 },
    { kind: "flyby", target: "Triton", durationSec: 24, distanceRel: 0.44 },

    { kind: "orbit", target: "Uranus", durationSec: 34, revolutions: 0.15, distanceRel: 0.6 },
    { kind: "flyby", target: "Miranda", durationSec: 22, distanceRel: 0.44 },
    { kind: "orbit", target: "Pluto", durationSec: 36, revolutions: 0.34, distanceRel: 0.2 },
    { kind: "orbit", target: "Ceres", durationSec: 36, revolutions: 0.44, distanceRel: 0.4 },
    { kind: "flyby", target: "Eris", durationSec: 36, revolutions: 0.14, distanceRel: 0.2 },
    { kind: "flyby", target: "Haumea", durationSec: 16, revolutions: 0.44, distanceRel: 0.2 },

    { kind: "orbit", target: "Venus", durationSec: 24, revolutions: 0.84, distanceRel: 0.2 },
    { kind: "flyby", target: "Mercury", durationSec: 12, distanceRel: 0.26 },

    { kind: "orbit", target: "Phobos", durationSec: 12, distanceRel: 0.16 },
    { kind: "flyby", target: "Callisto", durationSec: 12, distanceRel: 0.16 },
  ];

  private shotIndex = 0;
  private shotTime = 0;

  private transitionTime = 999;
  private readonly transitionFromPos = new THREE.Vector3();
  private readonly transitionFromLookAt = new THREE.Vector3();
  private readonly desiredPos = new THREE.Vector3();
  private readonly desiredLookAt = new THREE.Vector3();
  private readonly blendedLookAt = new THREE.Vector3();

  private lastFocusTitle: string | null = null;

  private prevVisibility: SceneVisibilityState | null = null;
  private prevLayout: LayoutState | null = null;

  private tmpTarget = new THREE.Vector3();
  private smoothedTarget = new THREE.Vector3();
  private hasSmoothedTarget = false;
  private smoothedTargetKey: string | null = null;
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

  public isPaused(): boolean {
    return this.paused;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
  }

  public isDebugLogging(): boolean {
    return this.debugLogging;
  }

  public setDebugLogging(enabled?: boolean): void {
    this.debugLogging = enabled == null ? !this.debugLogging : !!enabled;
    // eslint-disable-next-line no-console
    if (this.debugLogging) console.info("[cinematic] debug logging enabled");
  }

  public getPlaylist(): CinematicShot[] {
    return this.playlist;
  }

  public getShotIndex(): number {
    return this.shotIndex;
  }

  public getCurrentShot(): CinematicShot | null {
    return this.playlist.length ? this.playlist[this.shotIndex % this.playlist.length] : null;
  }

  /** Jump to a shot (devtools-friendly). */
  public setShotIndex(index: number): void {
    if (!Number.isFinite(index) || this.playlist.length === 0) return;
    const i = ((index % this.playlist.length) + this.playlist.length) % this.playlist.length;
    this.prepareTransitionTo(i);
    this.shotIndex = i;
    this.shotTime = 0;
    this.transitionTime = 0;
  }

  public nextShot(): void {
    if (this.playlist.length === 0) return;
    this.setShotIndex(this.shotIndex + 1);
  }

  public prevShot(): void {
    if (this.playlist.length === 0) return;
    this.setShotIndex(this.shotIndex - 1);
  }

  public restartShot(): void {
    this.setShotIndex(this.shotIndex);
  }

  /** Update the current shot in-place (intended for devtools). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public updateCurrentShot(patch: any): void {
    if (!patch || this.playlist.length === 0) return;
    const i = this.shotIndex % this.playlist.length;
    const cur = this.playlist[i];
    this.playlist[i] = { ...cur, ...patch };
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
    this.paused = false;
    this.shotIndex = 0;
    this.shotTime = 0;

    this.hasSmoothedTarget = false;
    this.smoothedTargetKey = null;
    this.transitionTime = 0;

    // Prime title for UI.
    const firstShot = this.playlist[0];
    if (firstShot) {
      setFocusTitleOverride(firstShot.target);
      this.lastFocusTitle = firstShot.target;
    }

    // Start with a soft transition from the current camera state.
    const entry = this.deps.cameraManager.getActiveEntry();
    if (entry?.camera) {
      this.transitionFromPos.copy(entry.camera.position);
      this.resolveTargetWorldPos(firstShot?.target ?? "Sun", this.transitionFromLookAt);
    }

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

    this.lastFocusTitle = null;
    clearFocusTitleOverride();

    this.hasSmoothedTarget = false;
    this.smoothedTargetKey = null;
  }

  public update(ctx: UpdateContext): void {
    if (!this.active) return;

    if (this.paused) return;

    // Mobile browsers can produce very spiky frame times.
    // Clamping dt keeps camera motion and target tracking stable and reduces jitter.
    const dt = Math.min(ctx.delta, 1 / 20);

    // Enforce cinematic visibility (in case UI toggles fight back).
    const vis = getSceneVisibilityState();
    if (vis.markersVisible) setMarkersVisible(false);
    if (vis.orbitsVisible) setOrbitsVisible(false);

    const entry = this.deps.cameraManager.getActiveEntry();
    if (!entry || entry.selector !== "Cinematic") return;

    const cam = entry.camera;

    const shot = this.playlist[this.shotIndex % this.playlist.length];

    if (this.debugLogging && this.shotTime === 0) {
      // eslint-disable-next-line no-console
      console.info("[cinematic] start shot", {
        index: this.shotIndex,
        kind: shot.kind,
        target: shot.target,
        durationSec: shot.durationSec,
        distance: shot.distance,
        distanceRel: shot.distanceRel,
      });
    }

    // Update the stage title only when it changes (avoid spamming renders).
    if (shot && shot.target !== this.lastFocusTitle) {
      this.lastFocusTitle = shot.target;
      setFocusTitleOverride(shot.target);
    }

    this.shotTime += dt;

    const t = THREE.MathUtils.clamp(this.shotTime / Math.max(0.001, shot.durationSec), 0, 1);
    const eased = t * t * (3 - 2 * t); // smoothstep

    // Target smoothing: on mobile, large simulation steps can make bodies "jump" between frames.
    // Smooth the world position a bit so the camera doesn't visibly shake while tracking.
    const rawTargetPos = this.resolveTargetWorldPos(shot.target, this.tmpTarget);
    if (!this.hasSmoothedTarget || this.smoothedTargetKey !== shot.target) {
      this.hasSmoothedTarget = true;
      this.smoothedTargetKey = shot.target;
      this.smoothedTarget.copy(rawTargetPos);
    } else {
      // Critically-damped style smoothing.
      const alpha = 1 - Math.exp(-dt / 0.15);
      this.smoothedTarget.lerp(rawTargetPos, alpha);
    }

    const targetPos = this.smoothedTarget;

    // Determine a "nice" radius based on the target camera control (planet OR moon).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const targetObj: any = this.deps.astronomicalManager.findBody(shot.target);
    const control = targetObj?.control;

    const distMin = Number.isFinite(control?.distanceMin) ? (control.distanceMin as number) : 0.02;
    const distMax = Number.isFinite(control?.distanceMax) ? (control.distanceMax as number) : 0.35;

    const orbitRadiusDefault = THREE.MathUtils.clamp(
      distMax * 0.58,
      distMin * 1.25,
      distMax * 0.78,
    );
    const flyRadiusDefault = THREE.MathUtils.clamp(distMax * 0.4, distMin * 1.1, distMax * 0.68);

    const orbitRadius = this.resolveShotDistance(shot, distMin, distMax, orbitRadiusDefault);
    const flyRadius = this.resolveShotDistance(shot, distMin, distMax, flyRadiusDefault);

    const baseAngle = this.shotIndex * 1.35;

    if (shot.kind === "orbit") {
      const rev = shot.revolutions ?? 0.35;
      const ang = baseAngle + eased * Math.PI * 2 * rev;
      const y = Math.sin(eased * Math.PI * 2 * 0.55) * orbitRadius * 0.16;

      this.tmpPos.set(Math.cos(ang) * orbitRadius, y, Math.sin(ang) * orbitRadius);
      this.desiredPos.copy(targetPos).add(this.tmpPos);
      this.desiredLookAt.copy(targetPos);
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
      this.desiredPos.copy(targetPos).add(this.tmpPos);

      // Lead the lookAt slightly for a more cinematic feel.
      this.tmpLead
        .copy(this.tmpEnd)
        .sub(this.tmpStart)
        .normalize()
        .multiplyScalar(flyRadius * 0.065);
      this.tmpEnd.copy(this.tmpTarget).add(this.tmpLead);
      this.desiredLookAt.copy(this.tmpEnd);
    }

    // Blend-in on shot boundaries to avoid hard cuts.
    const blendSec = shot.blendSec ?? 1.8;
    if (this.transitionTime < blendSec) {
      const a = THREE.MathUtils.clamp(this.transitionTime / Math.max(0.001, blendSec), 0, 1);
      const alpha = a * a * (3 - 2 * a);

      cam.position.copy(this.transitionFromPos).lerp(this.desiredPos, alpha);
      this.blendedLookAt.copy(this.transitionFromLookAt).lerp(this.desiredLookAt, alpha);
      cam.lookAt(this.blendedLookAt);

      this.transitionTime += dt;
    } else {
      cam.position.copy(this.desiredPos);
      cam.lookAt(this.desiredLookAt);
    }

    cam.updateMatrixWorld();

    if (this.shotTime >= shot.durationSec) {
      // Prepare a soft transition into the next shot.
      this.transitionFromPos.copy(cam.position);
      this.transitionFromLookAt.copy(this.desiredLookAt);
      this.transitionTime = 0;

      this.shotIndex++;
      this.shotTime = 0;
    }
  }

  private prepareTransitionTo(nextIndex: number): void {
    const entry = this.deps.cameraManager.getActiveEntry();
    const cam = entry?.camera;
    if (!cam) return;

    this.transitionFromPos.copy(cam.position);
    const next = this.playlist.length ? this.playlist[nextIndex % this.playlist.length] : null;
    this.resolveTargetWorldPos(next?.target ?? "Sun", this.transitionFromLookAt);
  }

  private resolveShotDistance(
    shot: CinematicShot,
    distMin: number,
    distMax: number,
    fallback: number,
  ): number {
    // Keep a small safety margin so we never end up inside the body surface.
    const min = distMin * 1.05;
    const max = distMax * 0.92;

    if (Number.isFinite(shot.distance)) {
      return THREE.MathUtils.clamp(shot.distance as number, min, max);
    }

    if (Number.isFinite(shot.distanceRel)) {
      const t = THREE.MathUtils.clamp(shot.distanceRel as number, 0, 1);
      return THREE.MathUtils.lerp(min, max, t);
    }

    return THREE.MathUtils.clamp(fallback, min, max);
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
