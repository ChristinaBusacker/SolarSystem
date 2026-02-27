import type { Vec3 } from "./vec3";
import { vec3Distance } from "./vec3";
import { isRayOccludedBySpheres } from "./occlusion";

export type BodyKind = "planet" | "dwarf" | "moon" | "sun";

export type DeclutterBody = {
  id: string; // slug or stable id
  kind: BodyKind;

  position: Vec3;

  /**
   * Approx radius in world units (used for occlusion spheres).
   * If you only have "size" numbers in your system, use that.
   */
  radius: number;

  /**
   * For moons: parent body id (planet)
   */
  parentId?: string;

  /**
   * Optional flag if this is currently selected.
   * (You can also pass selectedId separately, this is just convenient.)
   */
  isSelected?: boolean;
};

export type DeclutterState = {
  /**
   * Which body is selected right now (planet/moon). Undefined means overview.
   */
  selectedId?: string;

  /**
   * If selectedId refers to a moon, this may be the parent planet id.
   */
  selectedParentId?: string;

  /**
   * Whether we are in "default camera" / overview mode.
   */
  isOverview: boolean;

  /**
   * Camera position used for distance tests and occlusion ray.
   */
  cameraPos: Vec3;

  /**
   * Optional: distance thresholds (world units).
   * These default values aim to match your current behavior loosely,
   * but you should tune them for your scene scale.
   */
  thresholds?: Partial<{
    // show moon labels only if camera is near parent in overview
    moonRevealDistanceToParent: number;
    // show moon labels in focus mode if camera is near selected parent/moon
    moonFocusLabelDistance: number;
    // when focusing a planet, hide other planets if camera is close enough
    focusHideOthersDistance: number;
  }>;

  /**
   * Occlusion settings
   */
  occlusion?: Partial<{
    enabled: boolean;
    radiusMultiplier: number;
  }>;
};

export type DeclutterResult = {
  /**
   * Per-body label visibility
   */
  labelVisibleById: Record<string, boolean>;

  /**
   * Optional orbit visibility - ids can be either body ids or special keys,
   * depending on how you apply it in AstronomicalManager.
   */
  orbitVisibleById: Record<string, boolean>;
};

const DEFAULT_THRESHOLDS = {
  moonRevealDistanceToParent: 18_000,
  moonFocusLabelDistance: 22_000,
  focusHideOthersDistance: 14_000,
};

const DEFAULT_OCCLUSION = {
  enabled: true,
  radiusMultiplier: 1.05,
};

/**
 * Compute label/orbit visibility with no THREE / DOM dependencies.
 * You feed it the bodies + camera position + selected body ids.
 */
export function computeDeclutterVisibility(args: {
  bodies: DeclutterBody[];
  state: DeclutterState;
}): DeclutterResult {
  const { bodies, state } = args;

  const thresholds = { ...DEFAULT_THRESHOLDS, ...(state.thresholds ?? {}) };
  const occlusion = { ...DEFAULT_OCCLUSION, ...(state.occlusion ?? {}) };

  const selectedId = state.selectedId;
  const selected = selectedId ? bodies.find(b => b.id === selectedId) : undefined;

  const labelVisibleById: Record<string, boolean> = {};
  const orbitVisibleById: Record<string, boolean> = {};

  // Build occluder spheres from planets/dwarfs/sun only (not moons, usually too small to matter).
  const occluderSpheres = bodies
    .filter(b => b.kind === "planet" || b.kind === "dwarf" || b.kind === "sun")
    .map(b => ({
      id: b.id,
      center: b.position,
      radius: b.radius,
    }));

  // IMPORTANT:
  // Do NOT ignore the selected body for occlusion.
  // We *want* the selected planet to be able to occlude its moons (e.g. Dione behind Saturn).
  // Self-occlusion is already avoided by the segment test (sphere center at target => t≈1).
  const ignoreIds = new Set<string>();

  const isFocusMode = !!selectedId && !state.isOverview;

  // A few helper lookups
  const byId = new Map<string, DeclutterBody>();
  for (const b of bodies) byId.set(b.id, b);

  // Determine if selected is a moon + parent
  const selectedIsMoon = selected?.kind === "moon";
  const selectedParent = state.selectedParentId
    ? byId.get(state.selectedParentId)
    : selectedIsMoon && selected?.parentId
      ? byId.get(selected.parentId)
      : undefined;

  for (const b of bodies) {
    // Default: show everything in overview, except selected markers should be hidden.
    let labelVisible = true;

    // Always hide label for the selected body (planet or moon).
    if (selectedId && b.id === selectedId) labelVisible = false;

    if (state.isOverview) {
      // Overview rules:
      // - Moons: only show if camera is near their parent planet (otherwise too much clutter)
      if (b.kind === "moon") {
        const parent = b.parentId ? byId.get(b.parentId) : undefined;
        if (!parent) {
          labelVisible = false;
        } else {
          const d = vec3Distance(state.cameraPos, parent.position);
          labelVisible = d <= thresholds.moonRevealDistanceToParent;
        }
      }

      // Orbits: show planet/dwarf orbits in overview; hide moon orbits.
      orbitVisibleById[b.id] = b.kind !== "moon";

      // Optional: in overview, if a planet is selected (but you're still in overview camera),
      // you might want to keep others visible. We leave them visible.
    } else {
      // Focus rules:
      if (selectedId) {
        if (selectedIsMoon) {
          // Focusing a moon:
          // - show parent planet label? usually yes (unless selected itself)
          // - hide other planets only when camera is close enough (keeps context while zoomed out)
          if (b.kind === "planet" || b.kind === "dwarf" || b.kind === "sun") {
            const d = vec3Distance(state.cameraPos, selectedParent?.position ?? selected!.position);
            if (d <= thresholds.focusHideOthersDistance) {
              // when close, keep only parent + sun maybe
              labelVisible = b.id === (selectedParent?.id ?? "") || b.kind === "sun";
            } else {
              labelVisible = true;
            }
          }

          // Moons:
          if (b.kind === "moon") {
            // Show moons of the same parent only if close enough (and not the selected one).
            if (!selectedParent || b.parentId !== selectedParent.id) {
              labelVisible = false;
            } else {
              const d = vec3Distance(state.cameraPos, selectedParent.position);
              labelVisible = d <= thresholds.moonFocusLabelDistance && b.id !== selectedId;
            }
          }

          // Orbits: show moon orbits for moons of the parent, hide other planet orbits.
          if (b.kind === "moon") {
            orbitVisibleById[b.id] = !!selectedParent && b.parentId === selectedParent.id;
          } else {
            orbitVisibleById[b.id] = false;
          }
        } else {
          // Focusing a planet/dwarf:
          if (b.kind === "moon") {
            // show moons for selected planet if close enough
            labelVisible =
              b.parentId === selectedId &&
              vec3Distance(state.cameraPos, selected!.position) <=
                thresholds.moonFocusLabelDistance &&
              b.id !== selectedId;
          } else if (b.kind === "planet" || b.kind === "dwarf") {
            // hide other planets if close enough
            const d = vec3Distance(state.cameraPos, selected!.position);
            if (d <= thresholds.focusHideOthersDistance) {
              labelVisible = b.id === selectedId; // but selected is already forced hidden above
              // so effectively: hide all when close; keeps UI clean
            } else {
              labelVisible = true;
            }
          }

          // Orbits: show only moons orbits around selected planet, hide other planet orbits.
          if (b.kind === "moon") {
            orbitVisibleById[b.id] = b.parentId === selectedId;
          } else {
            orbitVisibleById[b.id] = false;
          }
        }
      } else {
        // No selection but not overview? Rare, but keep safe defaults.
        orbitVisibleById[b.id] = b.kind !== "moon";
      }
    }

    // Occlusion: hide labels behind large bodies (CSS2D "fake depth test")
    if (labelVisible && occlusion.enabled) {
      const occluded = isRayOccludedBySpheres({
        rayOrigin: state.cameraPos,
        target: b.position,
        spheres: occluderSpheres,
        ignoreIds,
        radiusMultiplier: occlusion.radiusMultiplier,
      });

      if (occluded) labelVisible = false;
    }

    labelVisibleById[b.id] = labelVisible;
  }

  return { labelVisibleById, orbitVisibleById };
}
