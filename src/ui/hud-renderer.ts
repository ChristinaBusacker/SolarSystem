import hudTpl from "./templates/hud.tpl.html";

export interface HudState {
  /** The simulation speed multiplier (e.g. 1..5000). */
  simulationSpeed: number;
}

export class HudRenderer {
  private root: HTMLElement;
  private state: HudState;
  private mounted = false;

  private readonly minSpeed = 1;
  private readonly maxSpeed = 5000;
  private readonly sliderMax = 1000;

  constructor(root: HTMLElement, initial: HudState) {
    this.root = root;
    this.state = initial;
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
    this.state.simulationSpeed = this.clamp(Math.round(speed), this.minSpeed, this.maxSpeed);
    this.syncFromState();
  }

  private bind(): void {
    this.root.addEventListener("input", (e) => {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLInputElement>('[data-action="speed-change"]');
      if (!el) return;

      e.stopPropagation();

      const sliderValue = Number(el.value);
      const speed = this.sliderToSpeed(sliderValue);

      this.updateValueLabel(speed);

      window.dispatchEvent(
        new CustomEvent("ui:speedChange", {
          detail: { speed },
        }),
      );
    });

    // Prevent camera controls from stealing drag/wheel while interacting with the slider.
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
    const input = this.root.querySelector<HTMLInputElement>(
      '.hud-speed__input[data-action="speed-change"]',
    );
    if (!input) return;

    const sliderValue = this.speedToSlider(this.state.simulationSpeed);
    input.value = String(sliderValue);

    // Position the floating value label above the thumb.
    input.style.setProperty("--p", `${(sliderValue / this.sliderMax) * 100}%`);

    this.updateValueLabel(this.state.simulationSpeed);
  }

  private updateValueLabel(speed: number): void {
    const label = this.root.querySelector<HTMLElement>("[data-speed-value]");
    if (label) label.textContent = `×${speed}`;
  }

  /** Logarithmic mapping so low speeds have finer control. */
  private sliderToSpeed(slider: number): number {
    const t = this.clamp(slider, 0, this.sliderMax) / this.sliderMax;
    const min = Math.log(this.minSpeed);
    const max = Math.log(this.maxSpeed);
    const v = Math.exp(min + (max - min) * t);
    return this.clamp(Math.round(v), this.minSpeed, this.maxSpeed);
  }

  private speedToSlider(speed: number): number {
    const s = this.clamp(speed, this.minSpeed, this.maxSpeed);
    const min = Math.log(this.minSpeed);
    const max = Math.log(this.maxSpeed);
    const t = (Math.log(s) - min) / (max - min);
    return this.clamp(Math.round(t * this.sliderMax), 0, this.sliderMax);
  }

  private clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }
}
