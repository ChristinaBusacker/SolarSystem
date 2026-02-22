import type { Application } from "../application";

/**
 * Minimal, frameworkless UI layer.
 *
 * This is intentionally small: it provides a dedicated place to grow the
 * educational UI (sidebar with planet info + quizzes) without mixing DOM
 * concerns into the Three.js scene logic.
 */
export class UiRenderer {
  private static instance: UiRenderer | null = null;

  private root!: HTMLElement;
  private panel!: HTMLElement;

  private constructor(private readonly app: Application) {}

  public static getInstance(app: Application): UiRenderer {
    if (!UiRenderer.instance) UiRenderer.instance = new UiRenderer(app);
    return UiRenderer.instance;
  }

  public init(): void {
    this.root = this.ensureRoot();
    this.panel = this.renderShell();
    this.root.appendChild(this.panel);

    this.bindToggles();
  }

  private ensureRoot(): HTMLElement {
    const existing = document.getElementById("ui-root");
    if (existing) return existing;

    const root = document.createElement("div");
    root.id = "ui-root";
    document.body.appendChild(root);
    return root;
  }

  private renderShell(): HTMLElement {
    const panel = document.createElement("aside");
    panel.className = "ui-panel";

    panel.innerHTML = `
      <div class="ui-header">
        <h2>Solar System</h2>
        <p>Frameworkless UI layer. Next up: planet sidebar content + quizzes.</p>
      </div>

      <div class="ui-content">
        <div class="ui-row">
          <label for="toggleMoons">Show moons</label>
          <input id="toggleMoons" type="checkbox" checked />
        </div>
        <div class="ui-row">
          <label for="togglePlanets">Show planets</label>
          <input id="togglePlanets" type="checkbox" checked />
        </div>
      </div>

      <div class="ui-footer">
        Tip: click a planet later to see facts and mini-tests.
      </div>
    `;

    return panel;
  }

  private bindToggles(): void {
    const toggleMoons = this.panel.querySelector<HTMLInputElement>("#toggleMoons");
    const togglePlanets = this.panel.querySelector<HTMLInputElement>("#togglePlanets");

    if (toggleMoons) {
      toggleMoons.addEventListener("change", () => {
        this.app.cssRenderer.domElement.classList.toggle("hideMoons", !toggleMoons.checked);
      });
    }

    if (togglePlanets) {
      togglePlanets.addEventListener("change", () => {
        this.app.cssRenderer.domElement.classList.toggle(
          "hidePlanets",
          !togglePlanets.checked
        );
      });
    }
  }
}
