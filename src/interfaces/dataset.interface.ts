import type * as THREE from "three";


export interface AstronomicalRawData {
  name: string;
  slug: string;
  description?: string;
  color: `#${string}`;
  parentSlug?: string;
  isOrbiting: boolean;
  diameterKm: number;
  axialTiltDeg: number;
  orbitalInclinationDeg: number;
  orbitalPeriodDays?: number;
  rotationPeriodHours?: number;
  periapsisKm?: number;
  apoapsisKm?: number;
  initialOrbitPhaseDeg?: number;
  ringInnerRadiusKm?: number;
  ringOuterRadiusKm?: number;
  denyCamera?: boolean;
};
export interface AstronomicalDataset {
  title?: string //DEPRECATED
  slug: string,
  name: string;
  description: string;
  size: number;
  distanceToOrbiting?: number; // deprecated
  isOrbiting: boolean;
  orbitalSpeed: number;
  rotationSpeed: number;
  initialPosition: THREE.Vector3;
  planetaryTilt: number;
  orbitalTilt: number;
  orbitCenter: THREE.Vector3;
  semiMajorAxis: number;
  semiMinorAxis: number;
  parentSlug: string;
  color: string;
  orbitalDuration: number;
  ringInnerRadius?: number;
  ringOuterRadius?: number;
  denyCamera?: boolean;
}
