import { renderTemplate } from "./template";
import menuTpl from "./templates/menu.tpl.html";

import { SoundManager } from "../manager/SoundManager";
import { router } from "../router/router";
import { subscribeLayoutState } from "./layout-state";
import { getSceneVisibilityState } from "./scene-visibility-state";
import { UiActions } from "./ui-actions";

interface MenuRenderState {
  isOpen: boolean;
  isFullscreen: boolean;
}

export class MenuRenderer {
  private readonly root: HTMLElement;
  private readonly actions: UiActions;
  private state: MenuRenderState = {
    isOpen: false,
    isFullscreen: false,
  };

  public constructor(root: HTMLElement, actions: UiActions) {
    this.root = root;
    this.actions = actions;

    subscribeLayoutState(snapshot => {
      if (snapshot.rightOpen) {
        this.root.classList.remove("open");
        this.ensureSoundState();
      }
    });

    router.subscribe(() => {
      this.state.isOpen = false;
      this.render();
      this.ensureSoundState();
    });

    document.addEventListener("fullscreenchange", this.handleFullscreenChange.bind(this));

    // Keep sound toggle in sync even if sound is started elsewhere (e.g. Cinematic mode).
    SoundManager.subscribeAmbientState(() => this.ensureSoundState());

    this.render();
    this.bindActions();
  }

  private render(): void {
    this.root.innerHTML = renderTemplate(menuTpl, {
      menuState: this.state.isOpen ? "open" : "",
    });

    this.ensureSoundState();
    this.syncSceneToggles();
  }

  private ensureSoundState() {
    // Keep UI in sync with SoundManager state (important for Cinematic mode,
    // which can start ambient sound without touching the menu toggle).
    const isActive = SoundManager.isAmbientPlaying();
    this.state.isFullscreen = Boolean(document.fullscreenElement);

    const elem = this.root.querySelector('[data-menu-action="toggle-audio"]');
    elem?.parentElement?.classList.toggle("is-active", isActive);
  }

  private syncSceneToggles(): void {
    const s = getSceneVisibilityState();
    this.root
      .querySelector('[data-menu-action="toggle-marker"]')
      ?.parentElement?.classList.toggle("is-active", s.markersVisible);
    this.root
      .querySelector('[data-menu-action="toggle-orbits"]')
      ?.parentElement?.classList.toggle("is-active", s.orbitsVisible);
    this.root
      .querySelector('[data-menu-action="toggle-declutter"]')
      ?.parentElement?.classList.toggle("is-active", s.declutterAuto);
  }

  public init(): void {
    // Constructor wired everything already in this version.
    // Keeping init() for compatibility with existing app bootstrap.
  }

  private bindActions(): void {
    this.root.addEventListener("click", event => {
      this.ensureSoundState();
      const target = event.target as HTMLElement | null;
      const actionNode = target?.closest<HTMLElement>("[data-menu-action]");
      if (!actionNode) return;

      const action = actionNode.dataset.menuAction;
      if (!action) return;

      if (action === "toggle-menu") {
        this.root.classList.toggle("open");
        return;
      }

      if (action === "toggle-marker") {
        const visible = this.actions.toggleMarkers();
        actionNode.parentElement.classList.toggle("is-active", visible);
        return;
      }

      if (action === "toggle-orbits") {
        const visible = this.actions.toggleOrbits();
        actionNode.parentElement.classList.toggle("is-active", visible);
        return;
      }

      if (action === "toggle-declutter") {
        const enabled = this.actions.toggleDeclutterAuto();
        actionNode.parentElement.classList.toggle("is-active", enabled);
        return;
      }

      if (action === "toggle-audio") {
        void SoundManager.toggleAmbient().finally(() => this.ensureSoundState());
        return;
      }

      if (action === "go-home") {
        router.goHome();
        return;
      }

      if (action === "zoom-in") {
        this.actions.zoomStep("in");
        return;
      }

      if (action === "zoom-out") {
        this.actions.zoomStep("out");
        return;
      }

      if (action === "toggle-fullscreen") {
        void this.toggleFullscreen();
      }
    });

    const volume = this.root.querySelector<HTMLInputElement>("[data-volume-slider]");
    if (volume) {
      volume.addEventListener("input", () => {
        const next = Number(volume.value);
        if (Number.isFinite(next)) SoundManager.setVolume(next);
      });
    }
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
      button?.classList.add("is-active");
    } else {
      button?.classList.remove("is-active");
    }
  }
}
