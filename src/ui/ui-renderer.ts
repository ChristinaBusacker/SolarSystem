import sidebarTpl from "./templates/sidebar.tpl.html";
import { renderTemplate } from "./template";

export interface UiState {
  hidePlanets: boolean;
  hideMoons: boolean;
  selectedPlanetName?: string;
  sidebarOpen: boolean;
}

export class UiRenderer {
  private root: HTMLElement;
  private state: UiState;
  private isMounted = false;
  private lastSidebarOpen: boolean | null = null;

  private static readonly SIDEBAR_TRANSITION_MS = 280;

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
      sidebarOpenClass: this.state.sidebarOpen ? "is-open" : "is-closed",
    });

    this.root.innerHTML = html;

    if (!this.isMounted) {
      this.bindActions();
      this.bindGlobalShortcuts();
      this.isMounted = true;
    }

    this.applyState();
  }

  private bindActions() {
    // Event delegation so we don't have to re-bind after each render.
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-action]");
      const action = el?.getAttribute("data-action");
      if (!action) return;

      // Prevent camera controls from receiving UI clicks.
      e.stopPropagation();

      // Checkbox clicks are handled via "change" below.
      if (el instanceof HTMLInputElement && el.type === "checkbox") return;

      this.dispatch(action, null);
    });

    this.root.addEventListener("change", (e) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-action]");
      const action = el?.getAttribute("data-action");
      if (!action) return;

      if (el instanceof HTMLInputElement && el.type === "checkbox") {
        e.stopPropagation();
        this.dispatch(action, el.checked);
      }
    });

    // Keyboard support for elements that act like buttons (e.g. sidebar header).
    this.root.addEventListener("keydown", (e) => {
      const ke = e as KeyboardEvent;
      if (ke.key !== "Enter" && ke.key !== " ") return;

      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>("[data-action]");
      const action = el?.getAttribute("data-action");
      if (!action) return;

      ke.preventDefault();
      ke.stopPropagation();
      this.dispatch(action, null);
    });
  }

  private bindGlobalShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.state.sidebarOpen) {
        this.state.sidebarOpen = false;
        this.applyState();
      }
    });
  }

  private dispatch(action: string, payload: any) {
    switch (action) {
      case "toggle-planets":
        this.state.hidePlanets = !!payload;
        this.applyState();
        break;

      case "toggle-moons":
        this.state.hideMoons = !!payload;
        this.applyState();
        break;

      case "sidebar-open":
        this.state.sidebarOpen = true;
        this.applyState();
        break;

      case "sidebar-close":
        this.state.sidebarOpen = false;
        this.applyState();
        break;

      case "sidebar-toggle":
        this.state.sidebarOpen = !this.state.sidebarOpen;
        this.applyState();
        break;
    }
  }

  private applyState(): void {
    const shell = this.root.querySelector<HTMLElement>("[data-ui='sidebar']");
    if (shell) {
      shell.classList.toggle("is-open", this.state.sidebarOpen);
      shell.classList.toggle("is-closed", !this.state.sidebarOpen);
    }

    // Also toggle the layout container so the scene can resize.
    const sidebarRoot = document.getElementById("sidebar-root");
    if (sidebarRoot) {
      sidebarRoot.classList.toggle("is-open", this.state.sidebarOpen);
      sidebarRoot.classList.toggle("is-closed", !this.state.sidebarOpen);
    }

    // Fire resize updates during transitions so the canvas doesn't jump.
    if (this.lastSidebarOpen !== null && this.lastSidebarOpen !== this.state.sidebarOpen) {
      window.dispatchEvent(
        new CustomEvent("ui:sidebarTransition", {
          detail: { durationMs: UiRenderer.SIDEBAR_TRANSITION_MS },
        }),
      );
    }
    this.lastSidebarOpen = this.state.sidebarOpen;

    // Keep checkboxes in sync without re-rendering.
    const planets = this.root.querySelector<HTMLInputElement>(
      'input[type="checkbox"][data-action="toggle-planets"]',
    );
    if (planets) planets.checked = this.state.hidePlanets;

    const moons = this.root.querySelector<HTMLInputElement>(
      'input[type="checkbox"][data-action="toggle-moons"]',
    );
    if (moons) moons.checked = this.state.hideMoons;

    // Apply visibility toggles to the CSS2D overlay.
    const cssOverlay = document.querySelector<HTMLElement>(".css-renderer");
    if (cssOverlay) {
      cssOverlay.classList.toggle("hidePlanets", this.state.hidePlanets);
      cssOverlay.classList.toggle("hideMoons", this.state.hideMoons);
    }
  }
}

