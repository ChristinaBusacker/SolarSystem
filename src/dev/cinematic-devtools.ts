/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CinematicDirector } from "../manager/CinematicDirector";
import { router } from "../router/router";

/**
 * Lightweight devtools for iterating on cinematic shots without reloads.
 *
 * Exposes `window.cine` in development builds.
 *
 * Usage examples:
 * - cine.help()
 * - cine.list()
 * - cine.go(3) / cine.next() / cine.prev() / cine.restart()
 * - cine.pause() / cine.resume()
 * - cine.log(true)
 * - cine.tweak({ durationSec: 40, distanceRel: 0.55 })
 */
export function registerCinematicDevtools(director: CinematicDirector): void {
  const w = window as any;
  if (w.cine) return;

  const api = {
    help: () => {
      // eslint-disable-next-line no-console
      console.info(
        [
          "Cinematic devtools:",
          "- cine.start() / cine.stop()",
          "- cine.list()",
          "- cine.go(i) / cine.next() / cine.prev() / cine.restart()",
          "- cine.pause() / cine.resume()",
          "- cine.log(true|false)",
          "- cine.tweak({ target, kind, durationSec, distance, distanceRel, blendSec, revolutions, flybyStyle })",
          "- cine.state()",
        ].join("\n"),
      );
      return api.state();
    },

    start: async () => {
      router.goCinematic();
      await director.start();
      return api.state();
    },

    stop: () => {
      director.stop();
      router.goHome();
      return api.state();
    },

    state: () => ({
      active: director.isActive(),
      paused: director.isPaused(),
      index: director.getShotIndex(),
      current: director.getCurrentShot(),
      playlistLength: director.getPlaylist().length,
      logging: director.isDebugLogging(),
    }),

    list: () => {
      const shots = director.getPlaylist();
      const rows = shots.map((s, i) => ({
        i,
        kind: s.kind,
        target: s.target,
        durationSec: s.durationSec,
        distance: s.distance ?? null,
        distanceRel: s.distanceRel ?? null,
        blendSec: s.blendSec ?? null,
        revolutions: s.revolutions ?? null,
        flybyStyle: s.flybyStyle ?? null,
      }));
      // eslint-disable-next-line no-console
      console.table(rows);
      return rows;
    },

    go: (index: number) => {
      director.setShotIndex(index);
      return api.state();
    },

    next: () => {
      director.nextShot();
      return api.state();
    },

    prev: () => {
      director.prevShot();
      return api.state();
    },

    restart: () => {
      director.restartShot();
      return api.state();
    },

    pause: () => {
      director.setPaused(true);
      return api.state();
    },

    resume: () => {
      director.setPaused(false);
      return api.state();
    },

    log: (enabled?: boolean) => {
      director.setDebugLogging(enabled);
      return api.state();
    },

    tweak: (patch: Record<string, unknown>) => {
      director.updateCurrentShot(patch);
      return api.state();
    },
  };

  w.cine = api;

  // keyboard helpers (dev only):
  // - Shift+ArrowRight: next
  // - Shift+ArrowLeft: prev
  // - Shift+Space: pause/resume
  window.addEventListener("keydown", e => {
    if (!e.shiftKey) return;
    if (e.key === "ArrowRight") api.next();
    if (e.key === "ArrowLeft") api.prev();
    if (e.key === " ") director.setPaused(!director.isPaused());
  });
}
