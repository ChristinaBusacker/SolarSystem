import { toggleSidebar } from "./layout-state";
import {
  subscribeSceneVisibilityState
} from "./scene-visibility-state";
import { renderTemplate } from "./template";
import mobileTogglesTpl from "./templates/mobile.toggles.tpl.html";

export class MobileTogglesRenderer {
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
    this.root.innerHTML = renderTemplate(mobileTogglesTpl, {});
  }

  private bind(): void {
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLElement>("[data-action]");
      if (!btn) return;

      const action = btn.getAttribute("data-action");
      if (!action) return;

      e.stopPropagation();

      if (action === "toggle-info") {
        toggleSidebar('right')
        window.dispatchEvent(new CustomEvent("ui:request-toggle-sidebar"));
        return;
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
