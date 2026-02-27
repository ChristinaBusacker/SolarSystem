import { renderTemplate } from "./template";
import menuTpl from "./templates/menu.tpl.html";

import { SoundManager } from "../manager/SoundManager";
import { router } from "../router/router";
import { subscribeLayoutState } from "./layout-state";
import { toggleDeclutterAuto, toggleMarkers, toggleOrbits } from "./scene-visibility-state";

interface MenuRenderState {
  isOpen: boolean;
  isFullscreen: boolean;
  isSoundActive: boolean
}

export class MenuRenderer {
  private readonly root: HTMLElement;
  private state: MenuRenderState = {
    isOpen: false,
    isFullscreen: false,
    isSoundActive: false
  };

  public constructor(root: HTMLElement) {
    this.root = root;

    subscribeLayoutState((snapshot) => {
      if (snapshot.rightOpen) {
        this.root.classList.remove('open')
        this.ensureSoundState();
      }
    });

    router.subscribe(() => {
      this.state.isOpen = false;
      this.render();
      this.ensureSoundState();
    });

    document.addEventListener("fullscreenchange", this.handleFullscreenChange.bind(this));

    this.render();
    this.bindActions();
  }


  private render(): void {
    this.root.innerHTML = renderTemplate(menuTpl, {
      menuState: this.state.isOpen ? 'open' : ''
    });

    this.ensureSoundState();
  }

  private ensureSoundState() {

    if (this.state.isSoundActive) {
      const elem = this.root.querySelector('[data-menu-action="toggle-audio"]')
      elem.parentElement.classList.add('is-active')
    }
  }

  public init(): void {
    // Constructor wired everything already in this version.
    // Keeping init() for compatibility with existing app bootstrap.
  }

  private bindActions(): void {
    this.root.addEventListener("click", (event) => {
      this.ensureSoundState();
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
        this.state.isSoundActive = !this.state.isSoundActive;
        actionNode.parentElement.classList.toggle('is-active')
        return SoundManager.toggleAmbient();
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

    this.root.querySelector('[data-volume-slider').addEventListener('change', function (e) {
      const target = e.target as HTMLInputElement;
      SoundManager.setVolume(parseInt(target.value))
    })
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
    if (this.state.isFullscreen) {
      button?.classList.add('is-active')
    } else {
      button?.classList.remove('is-active')
    }
  }
}
