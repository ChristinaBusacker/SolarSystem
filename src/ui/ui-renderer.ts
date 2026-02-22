import sidebarTpl from "./templates/sidebar.tpl.html";
import { renderTemplate } from "./template";

export interface UiState {
  hidePlanets: boolean;
  hideMoons: boolean;
  selectedPlanetName?: string;
}

export class UiRenderer {
  private root: HTMLElement;
  private state: UiState;

  constructor(root: HTMLElement, initial: UiState) {
    this.root = root;
    this.state = initial;
  }

  public init(): void {
    this.render();
  }

  public render() {
    const html = renderTemplate(sidebarTpl, {
      title: "Solar System",
      subtitle: "Frameworkless UI",
      hint: "Click a planet (soon™) to see details.",
      selectedPlanetName: this.state.selectedPlanetName ?? "None",
      checkedHidePlanets: this.state.hidePlanets ? "checked" : "",
      checkedHideMoons: this.state.hideMoons ? "checked" : "",
    });

    this.root.innerHTML = html;
    this.bindActions();
  }

  private bindActions() {
    this.root.querySelectorAll<HTMLElement>("[data-action]").forEach((el) => {
      const action = el.getAttribute("data-action");
      if (!action) return;

      // For inputs/checkboxes we use change
      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        el.addEventListener("change", () => this.dispatch(action, el.checked));
      } else {
        el.addEventListener("click", () => this.dispatch(action, null));
      }
    });
  }

  private dispatch(action: string, payload: any) {
    switch (action) {
      case "toggle-planets":
        this.state.hidePlanets = !!payload;
        // TODO: call into scene/controller
        this.render();
        break;

      case "toggle-moons":
        this.state.hideMoons = !!payload;
        // TODO: call into scene/controller
        this.render();
        break;
    }
  }
}
