export interface SceneVisibilityState {
  markersVisible: boolean;
  orbitsVisible: boolean;
  /** Automatically reduce orbit/label clutter based on selection + zoom. */
  declutterAuto: boolean;
}

let state: SceneVisibilityState = {
  markersVisible: true,
  orbitsVisible: true,
  // Cinematic default.
  declutterAuto: true,
};

const listeners = new Set<(s: SceneVisibilityState) => void>();

export function getSceneVisibilityState(): SceneVisibilityState {
  return { ...state };
}

export function subscribeSceneVisibilityState(
  listener: (s: SceneVisibilityState) => void,
): () => void {
  listeners.add(listener);
  listener(getSceneVisibilityState());
  return () => listeners.delete(listener);
}

function commit(next: SceneVisibilityState): void {
  if (
    next.markersVisible === state.markersVisible &&
    next.orbitsVisible === state.orbitsVisible &&
    next.declutterAuto === state.declutterAuto
  ) {
    return;
  }

  state = next;
  const snapshot = getSceneVisibilityState();
  listeners.forEach((l) => l(snapshot));
}

export function setMarkersVisible(visible: boolean): void {
  commit({ ...state, markersVisible: visible });
}

export function toggleMarkers(): void {
  setMarkersVisible(!state.markersVisible);
}

export function setOrbitsVisible(visible: boolean): void {
  commit({ ...state, orbitsVisible: visible });
}

export function toggleOrbits(): void {
  setOrbitsVisible(!state.orbitsVisible);
}

export function setDeclutterAuto(enabled: boolean): void {
  commit({ ...state, declutterAuto: enabled });
}

export function toggleDeclutterAuto(): void {
  setDeclutterAuto(!state.declutterAuto);
}
