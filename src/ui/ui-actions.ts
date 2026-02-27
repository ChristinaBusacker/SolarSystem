import {
  getSceneVisibilityState,
  toggleDeclutterAuto,
  toggleMarkers,
  toggleOrbits,
} from "./scene-visibility-state";

export type ZoomDirection = "in" | "out";

/**
 * Typed action surface used by UI renderers.
 *
 * UI components call functions instead of broadcasting `window` CustomEvents.
 */
export type UiActions = {
  zoomStep: (direction: ZoomDirection) => void;
  setSimulationSpeed: (speed: number) => void;
  toggleMarkers: () => boolean;
  toggleOrbits: () => boolean;
  toggleDeclutterAuto: () => boolean;
};

export function createSceneToggleActions(): Pick<
  UiActions,
  "toggleMarkers" | "toggleOrbits" | "toggleDeclutterAuto"
> {
  return {
    toggleMarkers(): boolean {
      toggleMarkers();
      return getSceneVisibilityState().markersVisible;
    },
    toggleOrbits(): boolean {
      toggleOrbits();
      return getSceneVisibilityState().orbitsVisible;
    },
    toggleDeclutterAuto(): boolean {
      toggleDeclutterAuto();
      return getSceneVisibilityState().declutterAuto;
    },
  };
}
