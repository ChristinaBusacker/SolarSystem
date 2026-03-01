import { router } from "../router/router";
import { getLayoutState, subscribeLayoutState, toggleSidebar } from "./layout-state";
import { subscribeFocusTitleOverride } from "./focus-title-state";
import { UiActions } from "./ui-actions";
import { renderTemplate } from "./template";
import stageControlsTpl from "./templates/stage-controls.tpl.html";

interface StageControlsRenderState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  focusTitle: string;
  focusMode: "none" | "body" | "cinematic";
  isFullscreen: boolean;
  focusTitleOverride: string | null;
}

export class StageControlsRenderer {
  private readonly root: HTMLElement;
  private readonly actions: UiActions;
  private state: StageControlsRenderState = {
    leftSidebarOpen: false,
    rightSidebarOpen: true,
    focusTitle: "",
    focusMode: "none",
    isFullscreen: false,
    focusTitleOverride: null,
  };

  public constructor(root: HTMLElement, actions: UiActions) {
    this.root = root;
    this.actions = actions;

    const layout = getLayoutState();
    this.state.leftSidebarOpen = layout.leftOpen;
    this.state.rightSidebarOpen = layout.rightOpen;

    subscribeLayoutState(snapshot => {
      this.state.leftSidebarOpen = snapshot.leftOpen;
      this.state.rightSidebarOpen = snapshot.rightOpen;
      this.render();
    });

    router.subscribe(route => {
      if (route.name === "planet") {
        this.state.focusMode = "body";
        this.state.focusTitle = this.slugToLabel(route.planet);
      } else if (route.name === "moon") {
        this.state.focusMode = "body";
        this.state.focusTitle = this.slugToLabel(route.moon);
      } else {
        // Allow a focus title override (used by Cinematic mode).
        const override = this.state.focusTitleOverride;
        this.state.focusMode = override ? "cinematic" : "none";
        this.state.focusTitle = override ?? "";
      }

      this.render();
    });

    subscribeFocusTitleOverride(title => {
      this.state.focusTitleOverride = title;

      const route = router.getCurrent();
      if (route.name !== "planet" && route.name !== "moon") {
        this.state.focusMode = title ? "cinematic" : "none";
        this.state.focusTitle = title ?? "";
        this.render();
      }
    });

    document.addEventListener("fullscreenchange", this.handleFullscreenChange);

    this.render();
    this.bindActions();
  }

  private render(): void {
    this.root.innerHTML = renderTemplate(stageControlsTpl, {
      leftStateClass: this.state.leftSidebarOpen ? "is-active" : "",
      rightStateClass: this.state.rightSidebarOpen ? "is-active" : "",
      focusBodyHiddenClass: this.state.focusMode === "body" ? "" : "is-hidden",
      focusCinematicHiddenClass: this.state.focusMode === "cinematic" ? "" : "is-hidden",
      focusTitle: this.state.focusTitle,
      fullscreenIconClass: this.state.isFullscreen
        ? "ui-stage-btn__icon--fullscreen-exit"
        : "ui-stage-btn__icon--fullscreen",
      fullscreenAriaLabel: this.state.isFullscreen ? "Exit fullscreen" : "Enter fullscreen",
    });
  }

  public init(): void {
    // Constructor wired everything already in this version.
    // Keeping init() for compatibility with existing app bootstrap.
  }

  private bindActions(): void {
    this.root.addEventListener("click", event => {
      const target = event.target as HTMLElement | null;
      const actionNode = target?.closest<HTMLElement>("[data-stage-action]");
      if (!actionNode) return;

      const action = actionNode.dataset.stageAction;
      if (!action) return;

      if (action === "toggle-left") {
        toggleSidebar("left");
        return;
      }

      if (action === "toggle-right") {
        toggleSidebar("right");
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
    this.render();
  };

  private syncFullscreenState(): void {
    this.state.isFullscreen = Boolean(document.fullscreenElement);
  }

  private slugToLabel(slug: string): string {
    return slug
      .split("-")
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
}
