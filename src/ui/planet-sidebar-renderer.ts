import { router } from "../router/router";
import { closeSidebar } from "./layout-state";
import sidebarLeftTpl from "./templates/sidebar-left.tpl.html";

export class PlanetSidebarRenderer {
  private root: HTMLElement;
  private mounted = false;
  private leakGuardMounted = false;

  constructor(root: HTMLElement) {
    this.root = root;
  }

  public init(): void {
    this.root.innerHTML = sidebarLeftTpl;

    if (!this.mounted) {
      this.bind();
      this.mounted = true;
    }

    if (!this.leakGuardMounted) {
      this.bindPointerLeakGuard();
      this.leakGuardMounted = true;
    }
  }

  private bindPointerLeakGuard(): void {
    const stop = (event: Event) => {
      event.stopPropagation();
    };

    this.root.addEventListener("wheel", stop, { passive: true });
    this.root.addEventListener("mousedown", stop);
    this.root.addEventListener("mouseup", stop);
    this.root.addEventListener("mousemove", stop);
    this.root.addEventListener("pointerdown", stop);
    this.root.addEventListener("pointerup", stop);
    this.root.addEventListener("pointermove", stop);
    this.root.addEventListener("touchstart", stop, { passive: true });
    this.root.addEventListener("touchmove", stop, { passive: true });
    this.root.addEventListener("touchend", stop, { passive: true });
  }

  private bind(): void {
    // Close button + body navigation
    this.root.addEventListener("click", e => {
      const target = e.target as HTMLElement | null;
      const closeBtn = target?.closest<HTMLElement>(
        "[data-action='sidebar-close'][data-side='left']",
      );
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
      e => {
        const target = e.target as HTMLElement | null;
        if (target?.closest("button, a, input, select, textarea")) e.stopPropagation();
      },
      true,
    );
  }
}
