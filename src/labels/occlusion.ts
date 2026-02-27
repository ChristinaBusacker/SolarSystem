import type { Vec3 } from "./vec3";
/**
 * Returns true if the ray segment [rayOrigin -> target] intersects any sphere.
 * This is used to emulate "depth test" for CSS2D labels.
 *
 * NOTE: We treat target as the end of the segment, so occluders behind the target
 * don't matter.
 */
export function isRayOccludedBySpheres(args: {
  rayOrigin: Vec3;
  target: Vec3;
  spheres: Array<{ center: Vec3; radius: number; id?: string }>;
  /**
   * Optional ids to ignore (e.g. ignore the selected body itself).
   */
  ignoreIds?: Set<string>;
  /**
   * Inflate spheres slightly so labels disappear a touch earlier (more natural).
   */
  radiusMultiplier?: number;
}): boolean {
  const { rayOrigin, target, spheres } = args;
  const ignoreIds = args.ignoreIds ?? new Set<string>();
  const radiusMultiplier = args.radiusMultiplier ?? 1.05;

  const dir = {
    x: target.x - rayOrigin.x,
    y: target.y - rayOrigin.y,
    z: target.z - rayOrigin.z,
  };

  const segLenSq = dir.x * dir.x + dir.y * dir.y + dir.z * dir.z;
  if (segLenSq <= 1e-12) return false;

  // For each sphere, compute closest point on segment and compare distance.
  for (const s of spheres) {
    if (s.id && ignoreIds.has(s.id)) continue;

    const r = s.radius * radiusMultiplier;

    // Vector from origin to sphere center
    const oc = {
      x: s.center.x - rayOrigin.x,
      y: s.center.y - rayOrigin.y,
      z: s.center.z - rayOrigin.z,
    };

    // Project oc onto segment dir: t in [0..1]
    const t = (oc.x * dir.x + oc.y * dir.y + oc.z * dir.z) / segLenSq;

    if (t <= 0 || t >= 1) continue;

    const closest = {
      x: rayOrigin.x + dir.x * t,
      y: rayOrigin.y + dir.y * t,
      z: rayOrigin.z + dir.z * t,
    };

    const dx = closest.x - s.center.x;
    const dy = closest.y - s.center.y;
    const dz = closest.z - s.center.z;

    if (dx * dx + dy * dy + dz * dz <= r * r) return true;
  }

  return false;
}
