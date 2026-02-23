import sceneTogglesTpl from "./templates/scene-toggles.tpl.html";
import { renderTemplate } from "./template";
import {
  getSceneVisibilityState,
  subscribeSceneVisibilityState,
  toggleMarkers,
  toggleOrbits,
} from "./scene-visibility-state";

export class SceneTogglesRenderer {
  private root: HTMLElement;
  private mounted = false;
  private unsubscribe?: () => void;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  public init(): void {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = subscribeSceneVisibilityState(() => this.render());

    if (!this.mounted) {
      this.bind();
      this.mounted = true;
    }

    this.render();
  }

  private render(): void {
    const s = getSceneVisibilityState();

    this.root.innerHTML = renderTemplate(sceneTogglesTpl, {
      markerOffClass: s.markersVisible ? "" : "is-off",
      orbitOffClass: s.orbitsVisible ? "" : "is-off",
      markerLabel: s.markersVisible ? "MARKER ON" : "MARKER OFF",
      orbitLabel: s.orbitsVisible ? "ORBITS ON" : "ORBITS OFF",
    });
  }

  private bind(): void {
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLElement>("[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      if (!action) return;

      // Keep camera controls from handling UI clicks.
      e.stopPropagation();

      if (action === "toggle-markers") {
        toggleMarkers();
      } else if (action === "toggle-orbits") {
        toggleOrbits();
      }
    });

    // Stop pointerdown from starting a camera drag.
    this.root.addEventListener(
      "pointerdown",
      (e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest("button")) e.stopPropagation();
      },
      true,
    );
  }
}
