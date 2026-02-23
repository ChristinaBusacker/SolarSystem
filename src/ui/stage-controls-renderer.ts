import stageControlsTpl from "./templates/stage-controls.tpl.html";
import { renderTemplate } from "./template";
import { getLayoutState, subscribeLayoutState, toggleSidebar } from "./layout-state";

export class StageControlsRenderer {
  private root: HTMLElement;
  private mounted = false;
  private unsubscribe?: () => void;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  public init(): void {
    if (this.unsubscribe) this.unsubscribe();

    this.unsubscribe = subscribeLayoutState(() => {
      this.render();
    });

    if (!this.mounted) {
      this.bind();
      this.mounted = true;
    }

    this.render();
  }

  private render(): void {
    const s = getLayoutState();

    this.root.innerHTML = renderTemplate(stageControlsTpl, {
      leftActiveClass: s.leftOpen ? "is-active" : "",
      rightActiveClass: s.rightOpen ? "is-active" : "",
    });
  }

  private bind(): void {
    // Delegated click handler.
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLElement>("[data-action='sidebar-toggle']");
      if (!btn) return;

      const side = btn.getAttribute("data-side") as "left" | "right" | null;
      if (!side) return;

      // Keep camera controls working when clicking outside actual buttons.
      e.stopPropagation();

      toggleSidebar(side);
    });

    // ESC closes any open sidebar.
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      // Let sidebars decide; we simply dispatch via DOM classes through state.
      // Close both so the stage becomes fully interactive.
      // (This is harmless if none are open.)
      //
      // Importing closeAllSidebars here would create another module dependency,
      // so we keep it minimal by toggling known open states.
      const s = getLayoutState();
      if (s.leftOpen) toggleSidebar("left");
      if (s.rightOpen) toggleSidebar("right");
    });
  }
}
