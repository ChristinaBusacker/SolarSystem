import { router } from "../router/router";
import { renderSelectedBodyDetails } from "./body-detail-content";
import { closeSidebar } from "./layout-state";
import { renderTemplate } from "./template";
import sidebarTpl from "./templates/sidebar.tpl.html";

export interface UiState {
  hidePlanets: boolean;
  hideMoons: boolean;
  selectedBodyName?: string;
}

/**
 * Right sidebar content renderer (information panel).
 * Open/close is handled by the layout state + CSS, not by inner markup.
 */
export class UiRenderer {
  private root: HTMLElement;
  private state: UiState;
  private mounted = false;
  private leakGuardMounted = false;

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

    if (!this.leakGuardMounted) {
      this.bindPointerLeakGuard();
      this.leakGuardMounted = true;
    }

    this.applyState();
  }

  public setSelectedBodyName(name?: string): void {
    this.state.selectedBodyName = name;
    this.render();
    this.applyState();
  }

  public render(): void {
    const html = renderTemplate(sidebarTpl, {
      title: "Solar System",
      subtitle: "Explore our universe",
      hint: "Click a marker (or a planet) to see details.",
      selectedBodyName: this.state.selectedBodyName?.toUpperCase() ?? "None",
      selectedBodyDetailsHtml: renderSelectedBodyDetails(this.state.selectedBodyName),
      checkedHidePlanets: this.state.hidePlanets ? "checked" : "",
      checkedHideMoons: this.state.hideMoons ? "checked" : "",
    });

    this.root.innerHTML = html;

    this.root.addEventListener("click", event => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const el = target.closest<HTMLElement>('[data-action="select-body"]');
      if (!el || !this.root.contains(el)) return;

      const { kind, name } = el.dataset;

      if (kind === "moon") router.goMoon(name);
      else router.goPlanet(name);
    });
  }

  private bindPointerLeakGuard(): void {
    const stop = (event: Event) => {
      event.stopPropagation();
    };

    const events: Array<keyof HTMLElementEventMap> = [
      "wheel",
      "mousedown",
      "mouseup",
      "mousemove",
      "pointerdown",
      "pointerup",
      "pointermove",
      "touchstart",
      "touchmove",
      "touchend",
    ];

    for (const eventName of events) {
      this.root.addEventListener(eventName, stop, { passive: true });
    }
  }

  private bindActions(): void {
    // Event delegation.
    this.root.addEventListener("click", e => {
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

    this.root.addEventListener("change", e => {
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
    }
  }
}
