import hudTemplate from "./templates/hud.tpl.html";
import { UiActions } from "./ui-actions";

export type OrbitVisibilityToggles = {
  planets: boolean;
  moons: boolean;
};

export type HudState = {
  bodyName: string;
  simulationSpeed: number;
  paused: boolean;
  orbitsVisible: OrbitVisibilityToggles;
  markersVisible: boolean;
};

type SpeedPreset = {
  label: string;
  secondsPerSecond: number;
};

const ENGINE_BASE_SECONDS = 60;

export class HudRenderer {
  private readonly root: HTMLElement;
  private readonly actions: UiActions;
  private state: HudState;

  private paused = false;
  private lastNonZeroPresetIndex = 1;

  private readonly speedPresets: SpeedPreset[] = [
    { label: "Real-time", secondsPerSecond: 1 },
    { label: "1 min / s", secondsPerSecond: 60 },
    { label: "5 min / s", secondsPerSecond: 5 * 60 },
    { label: "15 min / s", secondsPerSecond: 15 * 60 },
    { label: "30 min / s", secondsPerSecond: 30 * 60 },
    { label: "1 h / s", secondsPerSecond: 60 * 60 },
    { label: "3 h / s", secondsPerSecond: 3 * 60 * 60 },
    { label: "6 h / s", secondsPerSecond: 6 * 60 * 60 },
    { label: "12 h / s", secondsPerSecond: 12 * 60 * 60 },
    { label: "1 d / s", secondsPerSecond: 24 * 60 * 60 },
    { label: "3 d / s", secondsPerSecond: 3 * 24 * 60 * 60 },
    { label: "1 w / s", secondsPerSecond: 7 * 24 * 60 * 60 },
    { label: "2 w / s", secondsPerSecond: 14 * 24 * 60 * 60 },
    { label: "1 m / s", secondsPerSecond: 30 * 24 * 60 * 60 },
    { label: "3 m / s", secondsPerSecond: 3 * 30 * 24 * 60 * 60 },
    { label: "6 m / s", secondsPerSecond: 6 * 30 * 24 * 60 * 60 },
    { label: "1 y / s", secondsPerSecond: 12 * 30 * 24 * 60 * 60 },
  ];

  constructor(root: HTMLElement, initial: HudState, actions: UiActions) {
    this.root = root;
    this.actions = actions;
    this.state = { ...initial };

    const initialSpeed = Number(initial.simulationSpeed) || 0;
    if (initialSpeed <= 0) {
      this.paused = true;
      this.state.simulationSpeed = 0;
      this.lastNonZeroPresetIndex = 1;
    } else {
      this.paused = false;
      this.lastNonZeroPresetIndex = this.speedToPresetIndex(initialSpeed);
      this.state.simulationSpeed = this.presetIndexToSpeed(this.lastNonZeroPresetIndex);
    }

    this.root.innerHTML = this.compileTemplate(hudTemplate, {
      bodyName: this.state.bodyName,
    });

    this.bind();
    this.syncFromState();
  }

  public setSelectedBodyName(name: string): void {
    this.state.bodyName = name;
    this.syncBodyName();
  }

  public setSimulationSpeed(speed: number): void {
    if (speed <= 0) {
      this.paused = true;
      this.state.simulationSpeed = 0;
    } else {
      this.paused = false;
      this.lastNonZeroPresetIndex = this.speedToPresetIndex(speed);
      this.state.simulationSpeed = this.presetIndexToSpeed(this.lastNonZeroPresetIndex);
    }

    this.syncFromState();
  }

  public setOrbitVisibility(toggles: OrbitVisibilityToggles): void {
    this.state.orbitsVisible = { ...toggles };
    this.syncOrbitToggles();
  }

  public setMarkersVisible(visible: boolean): void {
    this.state.markersVisible = visible;
    this.syncMarkerToggle();
  }

  private compileTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key: string) => vars[key] ?? "");
  }

  private bind(): void {
    const speedSlider = this.root.querySelector<HTMLInputElement>("[data-speed-slider]");
    if (speedSlider) {
      speedSlider.addEventListener("input", () => {
        const presetIndex = this.clamp(
          Math.round(Number(speedSlider.value)),
          0,
          this.speedPresets.length - 1,
        );
        const speed = this.presetIndexToSpeed(presetIndex);

        this.lastNonZeroPresetIndex = presetIndex;
        this.state.simulationSpeed = speed;
        this.paused = false;

        this.syncFromState();
        this.actions.setSimulationSpeed(speed);
      });
    }

    const pauseButton = this.root.querySelector<HTMLButtonElement>("[data-speed-pause]");
    if (pauseButton) {
      pauseButton.addEventListener("click", () => {
        this.paused = !this.paused;

        const speed = this.paused ? 0 : this.presetIndexToSpeed(this.lastNonZeroPresetIndex);
        this.state.simulationSpeed = speed;

        this.syncFromState();
        this.actions.setSimulationSpeed(speed);
      });
    }

    const markerToggle = this.root.querySelector<HTMLButtonElement>("[data-toggle-markers]");
    if (markerToggle) {
      markerToggle.addEventListener("click", () => {
        const visible = this.actions.toggleMarkers();
        this.state.markersVisible = visible;
        this.syncMarkerToggle();
      });
    }

    const orbitPlanetToggle = this.root.querySelector<HTMLButtonElement>(
      "[data-toggle-orbits-planets]",
    );
    if (orbitPlanetToggle) {
      orbitPlanetToggle.addEventListener("click", () => {
        const visible = this.actions.toggleOrbits();
        // Scene currently supports a single orbit visibility toggle.
        this.state.orbitsVisible.planets = visible;
        this.state.orbitsVisible.moons = visible;
        this.syncOrbitToggles();
      });
    }

    const orbitMoonToggle = this.root.querySelector<HTMLButtonElement>(
      "[data-toggle-orbits-moons]",
    );
    if (orbitMoonToggle) {
      orbitMoonToggle.addEventListener("click", () => {
        const visible = this.actions.toggleOrbits();
        // Scene currently supports a single orbit visibility toggle.
        this.state.orbitsVisible.planets = visible;
        this.state.orbitsVisible.moons = visible;
        this.syncOrbitToggles();
      });
    }
  }

  private syncFromState(): void {
    this.syncBodyName();

    const speedSlider = this.root.querySelector<HTMLInputElement>("[data-speed-slider]");
    if (speedSlider) {
      const baseSpeed = this.paused
        ? this.presetIndexToSpeed(this.lastNonZeroPresetIndex)
        : Math.max(this.state.simulationSpeed, this.presetIndexToSpeed(0));
      const sliderIndex = this.speedToPresetIndex(baseSpeed);

      speedSlider.min = "0";
      speedSlider.max = String(this.speedPresets.length - 1);
      speedSlider.step = "1";
      speedSlider.value = String(sliderIndex);
      this.applySpeedTrackProgress(speedSlider, sliderIndex);
    }

    this.updateValueLabel(this.paused ? 0 : this.state.simulationSpeed);
    this.syncScaleLabels();
    this.syncPauseButton();
    this.syncOrbitToggles();
    this.syncMarkerToggle();
  }

  private syncBodyName(): void {
    const bodyLabel = this.root.querySelector<HTMLElement>("[data-body-name]");
    if (bodyLabel) bodyLabel.textContent = this.state.bodyName;
  }

  private updateValueLabel(speed: number): void {
    const label = this.root.querySelector<HTMLElement>("[data-speed-value]");
    if (!label) return;

    if (speed <= 0) {
      label.textContent = "Paused";
      return;
    }

    label.textContent =
      this.speedPresets[this.speedToPresetIndex(speed)]?.label ?? this.formatSpeedFallback(speed);
  }

  private syncScaleLabels(): void {
    const min = this.root.querySelector<HTMLElement>(".hud-speed__min");
    const max = this.root.querySelector<HTMLElement>(".hud-speed__max");

    if (min) min.textContent = this.speedPresets[0]?.label ?? "Min";
    if (max) max.textContent = this.speedPresets[this.speedPresets.length - 1]?.label ?? "Max";
  }

  private syncPauseButton(): void {
    const pauseButton = this.root.querySelector<HTMLButtonElement>("[data-speed-pause]");
    if (!pauseButton) return;

    pauseButton.classList.toggle("is-paused", this.paused);
    pauseButton.setAttribute("aria-pressed", String(this.paused));
    pauseButton.setAttribute("aria-label", this.paused ? "Resume simulation" : "Pause simulation");
  }

  private syncOrbitToggles(): void {
    const syncButton = (
      selector: string,
      visible: boolean,
      labels: { on: string; off: string },
    ) => {
      const btn = this.root.querySelector<HTMLButtonElement>(selector);
      if (!btn) return;

      btn.classList.toggle("is-active", visible);
      btn.setAttribute("aria-pressed", String(visible));
      btn.setAttribute("aria-label", visible ? labels.off : labels.on);

      const text = btn.querySelector<HTMLElement>("[data-toggle-label]");
      if (text) text.textContent = visible ? labels.off : labels.on;
    };

    syncButton("[data-toggle-orbits-planets]", this.state.orbitsVisible.planets, {
      on: "Orbits on",
      off: "Orbits off",
    });

    syncButton("[data-toggle-orbits-moons]", this.state.orbitsVisible.moons, {
      on: "Moon orbits on",
      off: "Moon orbits off",
    });
  }

  private syncMarkerToggle(): void {
    const btn = this.root.querySelector<HTMLButtonElement>("[data-toggle-markers]");
    if (!btn) return;

    const visible = this.state.markersVisible;
    btn.classList.toggle("is-active", visible);
    btn.setAttribute("aria-pressed", String(visible));
    btn.setAttribute("aria-label", visible ? "Hide markers" : "Show markers");

    const text = btn.querySelector<HTMLElement>("[data-toggle-label]");
    if (text) text.textContent = visible ? "Marker on" : "Marker off";
  }

  private presetIndexToSpeed(index: number): number {
    const preset = this.speedPresets[this.clamp(index, 0, this.speedPresets.length - 1)];
    if (!preset) return 1;

    return preset.secondsPerSecond / ENGINE_BASE_SECONDS;
  }

  private speedToPresetIndex(speed: number): number {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < this.speedPresets.length; i++) {
      const distance = Math.abs(this.presetIndexToSpeed(i) - speed);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  private formatSpeedFallback(speed: number): string {
    const secondsPerSecond = speed * ENGINE_BASE_SECONDS;

    if (secondsPerSecond >= 86400) return `${(secondsPerSecond / 86400).toFixed(1)} d / s`;
    if (secondsPerSecond >= 3600) return `${(secondsPerSecond / 3600).toFixed(1)} h / s`;
    if (secondsPerSecond >= 60) return `${(secondsPerSecond / 60).toFixed(1)} min / s`;

    return `${secondsPerSecond.toFixed(1)} s / s`;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private applySpeedTrackProgress(input: HTMLInputElement, sliderIndex: number): void {
    const max = Math.max(1, this.speedPresets.length - 1);
    const percentage = (sliderIndex / max) * 100;
    input.style.setProperty("--hud-slider-fill", `${percentage}%`);
  }
}
