import sidebarTpl from "./templates/sidebar.tpl.html";
import { renderTemplate } from "./template";
import { closeSidebar } from "./layout-state";

export interface UiState {
  hidePlanets: boolean;
  hideMoons: boolean;
  selectedPlanetName?: string;
}

/**
 * Right sidebar content renderer (information panel).
 * Open/close is handled by the layout state + CSS, not by inner markup.
 */
export class UiRenderer {
  private root: HTMLElement;
  private state: UiState;
  private mounted = false;

  constructor(root: HTMLElement, initial: UiState) {
    this.root = root;
    this.state = initial;
  }

  public init(): void {
    this.render();

    if (!this.mounted) {
      this.bindActions();
      this.mounted = true;
    }

    this.applyState();
  }

  public render(): void {
    const html = renderTemplate(sidebarTpl, {
      title: "Solar System",
      subtitle: "Frameworkless UI",
      hint: "Click a planet (soon™) to see details.",
      selectedPlanetName: this.state.selectedPlanetName ?? "None",
      checkedHidePlanets: this.state.hidePlanets ? "checked" : "",
      checkedHideMoons: this.state.hideMoons ? "checked" : "",
    });

    this.root.innerHTML = html;
  }

  private bindActions(): void {
    // Event delegation.
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-action]");
      const action = el?.getAttribute("data-action");
      if (!action) return;

      // Keep camera controls from receiving UI clicks.
      e.stopPropagation();

      if (action === "sidebar-close") {
        const side = el.getAttribute("data-side");
        if (side === "right") closeSidebar("right");
        return;
      }

      // Checkbox clicks handled in change.
      if (el instanceof HTMLInputElement && el.type === "checkbox") return;
    });

    this.root.addEventListener("change", (e) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-action]");
      const action = el?.getAttribute("data-action");
      if (!action) return;

      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        e.stopPropagation();
        const checked = el.checked;

        switch (action) {
          case "toggle-planets":
            this.state.hidePlanets = checked;
            break;
          case "toggle-moons":
            this.state.hideMoons = checked;
            break;
        }

        this.applyState();
      }
    });
  }

  private applyState(): void {
    const cssOverlay = document.querySelector<HTMLElement>(".css-renderer");
    if (cssOverlay) {
      cssOverlay.classList.toggle("hidePlanets", this.state.hidePlanets);
      cssOverlay.classList.toggle("hideMoons", this.state.hideMoons);
    }
  }
}
