import zoomControlsTpl from "./templates/zoom-controls.tpl.html";
import { renderTemplate } from "./template";
import { getLayoutState, subscribeLayoutState } from "./layout-state";
import { router } from "../router/router";

interface StageControlsRenderState {
    leftSidebarOpen: boolean;
    rightSidebarOpen: boolean;
    focusTitle: string;
    hasFocusedBody: boolean;
    isFullscreen: boolean;
}

export class ZoomControlsRenderer {
    private readonly root: HTMLElement;
    private state: StageControlsRenderState = {
        leftSidebarOpen: false,
        rightSidebarOpen: true,
        focusTitle: "",
        hasFocusedBody: false,
        isFullscreen: false,
    };

    public constructor(root: HTMLElement) {
        this.root = root;

        const layout = getLayoutState();
        this.state.leftSidebarOpen = layout.leftOpen;
        this.state.rightSidebarOpen = layout.rightOpen;

        this.render();
        this.bindActions();
    }

    private render(): void {
        this.root.innerHTML = renderTemplate(zoomControlsTpl, {
            leftStateClass: this.state.leftSidebarOpen ? "is-active" : "",
            rightStateClass: this.state.rightSidebarOpen ? "is-active" : "",
            focusHiddenClass: this.state.hasFocusedBody ? "" : "is-hidden",
            focusTitle: this.state.focusTitle,
            fullscreenIconClass: this.state.isFullscreen
                ? "ui-stage-btn__icon--fullscreen-exit"
                : "ui-stage-btn__icon--fullscreen",
            fullscreenAriaLabel: this.state.isFullscreen
                ? "Exit fullscreen"
                : "Enter fullscreen",
        });
    }

    public init(): void {
        // Constructor wired everything already in this version.
        // Keeping init() for compatibility with existing app bootstrap.
    }

    private bindActions(): void {
        this.root.addEventListener("click", (event) => {
            const target = event.target as HTMLElement | null;
            const actionNode = target?.closest<HTMLElement>("[data-stage-action]");
            if (!actionNode) return;

            const action = actionNode.dataset.stageAction;
            if (!action) return;

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

        });
    }
}
