import * as THREE from "three";
import { AstronomicalDataset, AstronomicalRawData } from "../interfaces/dataset.interface";

export class AstronomicalDataParser {
  /**
   * 1 Finn = 0.0001 AU = 14,959.79 km
   */
  public static readonly FINN_TO_KM = 14959.79;

  public static parse(raw: AstronomicalRawData): AstronomicalDataset {
    this.validateRaw(raw);

    const size = this.kmToFinn(raw.diameterKm);

    const planetaryTilt = raw.axialTiltDeg;
    const orbitalTilt = raw.orbitalInclinationDeg;

    const orbitalDuration = raw.isOrbiting ? (raw.orbitalPeriodDays ?? 0) : 0;
    const orbitalSpeed = raw.isOrbiting ? this.periodDaysToRadPerSecond(raw.orbitalPeriodDays!) : 0;

    const rotationSpeed = raw.rotationPeriodHours
      ? this.periodHoursToRadPerSecond(raw.rotationPeriodHours)
      : 0;

    let orbitCenter = new THREE.Vector3(0, 0, 0);
    let semiMajorAxis = 0;
    let semiMinorAxis = 0;
    let initialPosition = new THREE.Vector3(0, 0, 0);

    if (raw.isOrbiting) {
      const peri = raw.periapsisKm!;
      const apo = raw.apoapsisKm!;

      // Ellipse with parent object in one focus.
      // Center offset from focus along +X (same convention as your existing project).
      const centerOffsetKm = (apo - peri) / 2;
      const semiMajorKm = (apo + peri) / 2;
      const semiMinorKm = Math.sqrt(apo * peri);

      orbitCenter = new THREE.Vector3(this.kmToFinn(centerOffsetKm), 0, 0);
      semiMajorAxis = this.kmToFinn(semiMajorKm);
      semiMinorAxis = this.kmToFinn(semiMinorKm);

      // Local ellipse position (without orbitCenter), matching your existing setup:
      // orbitalGroup carries orbitCenter, object group carries ellipse-local position.
      const phaseDeg = raw.initialOrbitPhaseDeg ?? 0;
      const phaseRad = THREE.MathUtils.degToRad(phaseDeg);

      initialPosition = new THREE.Vector3(
        semiMajorAxis * Math.cos(phaseRad),
        0,
        semiMinorAxis * Math.sin(phaseRad),
      );
    }

    const dataset: AstronomicalDataset = {
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      color: raw.color,

      isOrbiting: raw.isOrbiting,
      parentSlug: raw.parentSlug,

      size,
      initialPosition,

      planetaryTilt,
      orbitalTilt,

      orbitalDuration,
      orbitalSpeed,
      rotationSpeed,

      orbitCenter,
      semiMajorAxis,
      semiMinorAxis,

      denyCamera: raw.denyCamera,
    };

    if (typeof raw.ringInnerRadiusKm === "number") {
      dataset.ringInnerRadius = this.kmToFinn(raw.ringInnerRadiusKm);
    }

    if (typeof raw.ringOuterRadiusKm === "number") {
      dataset.ringOuterRadius = this.kmToFinn(raw.ringOuterRadiusKm);
    }

    return dataset;
  }

  public static parseMany(rawItems: AstronomicalRawData[]): AstronomicalDataset[] {
    return rawItems.map(item => this.parse(item));
  }

  private static kmToFinn(km: number): number {
    return km / this.FINN_TO_KM;
  }

  private static periodDaysToRadPerSecond(days: number): number {
    const seconds = days * 24 * 60 * 60;
    return (2 * Math.PI) / seconds;
  }

  private static periodHoursToRadPerSecond(hours: number): number {
    const sign = Math.sign(hours) || 1;
    const seconds = Math.abs(hours) * 60 * 60;
    return sign * ((2 * Math.PI) / seconds);
  }

  private static validateRaw(raw: AstronomicalRawData): void {
    if (!raw.name?.trim()) {
      throw new Error("AstronomicalRawData.name is required.");
    }

    if (!raw.slug?.trim()) {
      throw new Error(`AstronomicalRawData.slug is required for "${raw.name}".`);
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(raw.color)) {
      throw new Error(
        `AstronomicalRawData.color must be a 6-digit hex color (e.g. #1f75fe) for "${raw.name}".`,
      );
    }

    if (!(raw.diameterKm > 0)) {
      throw new Error(`AstronomicalRawData.diameterKm must be > 0 for "${raw.name}".`);
    }

    if (!raw.isOrbiting) {
      return;
    }

    if (!raw.parentSlug) {
      throw new Error(
        `AstronomicalRawData.parentSlug is required when isOrbiting=true ("${raw.name}").`,
      );
    }

    if (!(raw.orbitalPeriodDays && raw.orbitalPeriodDays > 0)) {
      throw new Error(
        `AstronomicalRawData.orbitalPeriodDays must be > 0 for orbiting object "${raw.name}".`,
      );
    }

    if (!(raw.periapsisKm && raw.periapsisKm > 0)) {
      throw new Error(
        `AstronomicalRawData.periapsisKm must be > 0 for orbiting object "${raw.name}".`,
      );
    }

    if (!(raw.apoapsisKm && raw.apoapsisKm > 0)) {
      throw new Error(
        `AstronomicalRawData.apoapsisKm must be > 0 for orbiting object "${raw.name}".`,
      );
    }

    if (raw.apoapsisKm < raw.periapsisKm) {
      throw new Error(`AstronomicalRawData.apoapsisKm must be >= periapsisKm for "${raw.name}".`);
    }

    if (typeof raw.ringInnerRadiusKm === "number" && raw.ringInnerRadiusKm <= 0) {
      throw new Error(`ringInnerRadiusKm must be > 0 for "${raw.name}".`);
    }

    if (typeof raw.ringOuterRadiusKm === "number" && raw.ringOuterRadiusKm <= 0) {
      throw new Error(`ringOuterRadiusKm must be > 0 for "${raw.name}".`);
    }

    if (
      typeof raw.ringInnerRadiusKm === "number" &&
      typeof raw.ringOuterRadiusKm === "number" &&
      raw.ringOuterRadiusKm <= raw.ringInnerRadiusKm
    ) {
      throw new Error(`ringOuterRadiusKm must be > ringInnerRadiusKm for "${raw.name}".`);
    }
  }
}
