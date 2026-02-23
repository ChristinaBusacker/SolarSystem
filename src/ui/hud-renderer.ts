import hudTpl from "./templates/hud.tpl.html";

export interface HudState {
  /** The simulation speed multiplier (e.g. 0..5000). 0 pauses the simulation. */
  simulationSpeed: number;
}

export class HudRenderer {
  private root: HTMLElement;
  private state: HudState;
  private mounted = false;

  private paused = false;
  private lastNonZeroSpeed = 1;

  private readonly minSpeed = 1;
  private readonly maxSpeed = 5000;
  private readonly midSpeed = 500;
  private readonly sliderMax = 1000;

  /**
   * Convex curve exponent so that the midpoint (50% slider) maps to ~×500.
   * f(t) = min + (max-min) * t^gamma
   */
  private readonly gamma =
    Math.log((this.midSpeed - this.minSpeed) / (this.maxSpeed - this.minSpeed)) / Math.log(0.5);

  constructor(root: HTMLElement, initial: HudState) {
    this.root = root;
    this.state = initial;

    const initialSpeed = Math.round(initial.simulationSpeed);
    if (initialSpeed <= 0) {
      this.paused = true;
      this.lastNonZeroSpeed = this.midSpeed;
      this.state.simulationSpeed = 0;
    } else {
      this.paused = false;
      this.lastNonZeroSpeed = this.clamp(initialSpeed, this.minSpeed, this.maxSpeed);
      this.state.simulationSpeed = this.lastNonZeroSpeed;
    }
  }

  public init(): void {
    this.root.innerHTML = hudTpl;

    if (!this.mounted) {
      this.bind();
      this.mounted = true;
    }

    this.syncFromState();
  }

  public setSimulationSpeed(speed: number): void {
    if (speed <= 0) {
      this.paused = true;
      this.state.simulationSpeed = 0;
    } else {
      this.paused = false;
      this.state.simulationSpeed = this.clamp(Math.round(speed), this.minSpeed, this.maxSpeed);
      this.lastNonZeroSpeed = this.state.simulationSpeed;
    }

    this.syncFromState();
  }

  private bind(): void {
    // Slider input
    this.root.addEventListener("input", (e) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLInputElement>('[data-action="speed-change"]');
      if (!el) return;

      e.stopPropagation();

      // Moving the slider always resumes.
      this.paused = false;

      const sliderValue = Number(el.value);
      const speed = this.sliderToSpeed(sliderValue);

      this.lastNonZeroSpeed = speed;
      this.state.simulationSpeed = speed;

      this.syncFromState();

      window.dispatchEvent(
        new CustomEvent("ui:speedChange", {
          detail: { speed },
        }),
      );
    });

    // Pause/resume button
    this.root.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest<HTMLButtonElement>('[data-action="speed-toggle-pause"]');
      if (!btn) return;

      e.stopPropagation();

      this.paused = !this.paused;
      const speed = this.paused ? 0 : this.lastNonZeroSpeed;
      this.state.simulationSpeed = speed;

      this.syncFromState();

      window.dispatchEvent(
        new CustomEvent("ui:speedChange", {
          detail: { speed },
        }),
      );
    });

    // Prevent camera controls from stealing drag/wheel while interacting with the HUD.
    this.root.addEventListener(
      "pointerdown",
      (e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest("input, button, select, textarea, [data-stop-camera]")) {
          e.stopPropagation();
        }
      },
      true,
    );

    this.root.addEventListener(
      "wheel",
      (e) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest("input, button, select, textarea, [data-stop-camera]")) {
          e.stopPropagation();
        }
      },
      { passive: true, capture: true },
    );
  }

  private syncFromState(): void {
    const input = this.root.querySelector<HTMLInputElement>('.hud-speed__input[data-action="speed-change"]');
    if (input) {
      // While paused, keep the thumb at the last chosen speed.
      const baseSpeed = this.paused ? this.lastNonZeroSpeed : Math.max(this.state.simulationSpeed, 1);
      const sliderValue = this.speedToSlider(baseSpeed);
      input.value = String(sliderValue);
      input.style.setProperty("--p", `${(sliderValue / this.sliderMax) * 100}%`);
    }

    this.updateValueLabel(this.paused ? 0 : this.state.simulationSpeed);
    this.syncPauseButton();
  }

  private updateValueLabel(speed: number): void {
    const label = this.root.querySelector<HTMLElement>("[data-speed-value]");
    if (label) label.textContent = `×${speed}`;
  }

  private syncPauseButton(): void {
    const btn = this.root.querySelector<HTMLElement>('[data-action="speed-toggle-pause"]');
    if (!btn) return;
    btn.classList.toggle("is-paused", this.paused);
  }

  private sliderToSpeed(slider: number): number {
    const t = this.clamp(slider, 0, this.sliderMax) / this.sliderMax;
    const v = this.minSpeed + (this.maxSpeed - this.minSpeed) * Math.pow(t, this.gamma);
    return this.clamp(Math.round(v), this.minSpeed, this.maxSpeed);
  }

  private speedToSlider(speed: number): number {
    const s = this.clamp(speed, this.minSpeed, this.maxSpeed);
    const t = Math.pow((s - this.minSpeed) / (this.maxSpeed - this.minSpeed), 1 / this.gamma);
    return this.clamp(Math.round(t * this.sliderMax), 0, this.sliderMax);
  }

  private clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }
}
