import menuTpl from "./templates/menu.tpl.html";
import { renderTemplate } from "./template";

import { router } from "../router/router";
import { toggleDeclutterAuto, toggleMarkers, toggleOrbits } from "./scene-visibility-state";
import { subscribeLayoutState } from "./layout-state";

interface MenuRenderState {
  isOpen: boolean;
  isFullscreen: boolean
}

export class MenuRenderer {
  private readonly root: HTMLElement;
  private state: MenuRenderState = {
    isOpen: false,
    isFullscreen: false
  };

  public constructor(root: HTMLElement) {
    this.root = root;

    subscribeLayoutState((snapshot) => {
      this.render();
    });

    router.subscribe((route) => {
      this.state.isOpen = false;
      this.render();
    });

    document.addEventListener("fullscreenchange", this.handleFullscreenChange.bind(this));

    this.render();
    this.bindActions();
  }

  private render(): void {
    this.root.innerHTML = renderTemplate(menuTpl, {
      menuState: this.state.isOpen ? 'open' : ''
    });
  }

  public init(): void {
    // Constructor wired everything already in this version.
    // Keeping init() for compatibility with existing app bootstrap.
  }

  private bindActions(): void {
    this.root.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      const actionNode = target?.closest<HTMLElement>("[data-menu-action]");
      if (!actionNode) return;

      const action = actionNode.dataset.menuAction;
      if (!action) return;

      if (action === "toggle-menu") {
        this.root.classList.toggle('open')
        return;
      }

      if (action === "toggle-marker") {
        toggleMarkers();
        actionNode.parentElement.classList.toggle('is-active')
        return;
      }

      if (action === "toggle-orbits") {
        toggleOrbits();
        actionNode.parentElement.classList.toggle('is-active')
        return;
      }

      if (action === "toggle-declutter") {
        toggleDeclutterAuto();
        actionNode.parentElement.classList.toggle('is-active')
        return;
      }

      if (action === "toggle-audio") {
        actionNode.parentElement.classList.toggle('is-active')
        return;
      }

      if (action === "go-home") {
        router.goHome();
        return;
      }

      if (action === "zoom-in") {
        window.dispatchEvent(
          new CustomEvent("ui:zoom-step", {
            detail: { direction: "in" as const },
          }),
        );
        return;
      }

      if (action === "zoom-out") {
        window.dispatchEvent(
          new CustomEvent("ui:zoom-step", {
            detail: { direction: "out" as const },
          }),
        );
        return;
      }

      if (action === "toggle-fullscreen") {
        void this.toggleFullscreen();
      }
    });
  }

  private async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore fullscreen API failures (browser permissions / unsupported context).
    }
  }



  private readonly handleFullscreenChange = (): void => {
    this.syncFullscreenState();
  };

  private syncFullscreenState(): void {
    this.state.isFullscreen = Boolean(document.fullscreenElement);

    const button = this.root.querySelector('[data-menu-action="toggle-fullscreen"]');
    console.log(button)
    if (this.state.isFullscreen) {
      button?.classList.add('is-active')
    } else {
      button?.classList.remove('is-active')
    }
  }

  private slugToLabel(slug: string): string {
    return slug
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}
