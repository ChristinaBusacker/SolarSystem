import sidebarLeftTpl from "./templates/sidebar-left.tpl.html";
import { closeSidebar } from "./layout-state";
import { router } from "../router/router";

export class PlanetSidebarRenderer {
  private root: HTMLElement;
  private mounted = false;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  public init(): void {
    this.root.innerHTML = sidebarLeftTpl;

    if (!this.mounted) {
      this.bind();
      this.mounted = true;
    }
  }

  private bind(): void {
    // Close button + body navigation
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const closeBtn = target?.closest<HTMLElement>("[data-action='sidebar-close'][data-side='left']");
      if (closeBtn) {
        e.stopPropagation();
        closeSidebar("left");
        return;
      }

      const bodyBtn = target?.closest<HTMLElement>("[data-action='select-body']");
      if (bodyBtn) {
        e.stopPropagation();

        const kind = (bodyBtn.getAttribute("data-kind") ?? "planet") as "planet" | "moon";
        const name = bodyBtn.getAttribute("data-name") ?? bodyBtn.getAttribute("data-planet") ?? "";
        if (!name) return;

        if (kind === "moon") router.goMoon(name);
        else router.goPlanet(name);
        return;
      }

      // Legacy fallback for older buttons (kept so partial template edits don't explode)
      const planetBtn = target?.closest<HTMLElement>("[data-action='select-planet']");
      if (planetBtn) {
        e.stopPropagation();
        const planet = planetBtn.getAttribute("data-planet") ?? "";
        if (planet) router.goPlanet(planet);
      }
    });

    // Stop pointer events from reaching camera controls when interacting.
    this.root.addEventListener(
      "pointerdown",
      (e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest("button, a, input, select, textarea")) e.stopPropagation();
      },
      true,
    );
  }
}
