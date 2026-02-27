import type { AstronomicalRawData } from "../interfaces/dataset.interface";
import * as rawBodyExports from "../../data/raw-object.data";
import { BodyInfoOverride } from "../interfaces/bodyInfoOverride.interface";
import { astronomicalSidebarContent } from '../../data/sidebar.data'

const BODY_INFO_OVERRIDES: Record<string, BodyInfoOverride> = astronomicalSidebarContent

const DWARF_PLANET_SLUGS = new Set(["pluto", "ceres", "eris", "haumea", "makemake"]);

function isRawData(value: unknown): value is AstronomicalRawData {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AstronomicalRawData>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.slug === "string" &&
    typeof candidate.color === "string" &&
    typeof candidate.isOrbiting === "boolean" &&
    typeof candidate.diameterKm === "number"
  );
}

function getAllRawBodies(): AstronomicalRawData[] {
  return Object.values(rawBodyExports).filter(isRawData);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function inferTypeLabel(body: AstronomicalRawData): string {
  if (!body.isOrbiting) return "Star";
  if (body.parentSlug && body.parentSlug !== "sun") return "Moon";
  if (DWARF_PLANET_SLUGS.has(body.slug)) return "Dwarf planet";
  return "Planet";
}

function buildRows(body: AstronomicalRawData, moons: AstronomicalRawData[]): Array<[string, string]> {
  const rows: Array<[string, string]> = [];

  rows.push(["Type", inferTypeLabel(body)]);
  rows.push(["Diameter", `${formatNumber(body.diameterKm)} km`]);
  rows.push(["Axial tilt", `${body.axialTiltDeg.toFixed(2)}°`]);
  rows.push(["Orbital tilt", `${body.orbitalInclinationDeg.toFixed(2)}°`]);

  if (typeof body.orbitalPeriodDays === "number") {
    rows.push(["Orbit period", `${formatNumber(body.orbitalPeriodDays, 2)} days`]);
  }

  if (typeof body.rotationPeriodHours === "number") {
    const retrograde = body.rotationPeriodHours < 0;
    rows.push([
      "Rotation",
      `${formatNumber(Math.abs(body.rotationPeriodHours), 2)} h${retrograde ? " (retrograde)" : ""}`,
    ]);
  }

  if (typeof body.periapsisKm === "number" && typeof body.apoapsisKm === "number") {
    rows.push([
      "Orbit range",
      `${formatNumber(body.periapsisKm)} km - ${formatNumber(body.apoapsisKm)} km`,
    ]);
  }

  if (typeof body.ringInnerRadiusKm === "number" && typeof body.ringOuterRadiusKm === "number") {
    rows.push([
      "Ring span",
      `${formatNumber(body.ringInnerRadiusKm)} - ${formatNumber(body.ringOuterRadiusKm)} km`,
    ]);
  }

  if (body.parentSlug) {
    rows.push(["Orbits", body.parentSlug]);
  }

  if (moons.length > 0 && body.isOrbiting) {
    rows.push(["Moons", `${moons.length}`]);
  }

  return rows;
}

export function renderSelectedBodyDetails(bodyName?: string | null): string {
  if (!bodyName) {
    return `
      <div class="ui-body-details">
        <p class="ui-hint">Click a marker (or a planet) to see details.</p>
      </div>
    `;
  }

  const allBodies = getAllRawBodies();
  const body =
    allBodies.find((entry) => entry.name.toLowerCase() === bodyName.toLowerCase()) ??
    allBodies.find((entry) => entry.slug.toLowerCase() === bodyName.toLowerCase());

  if (!body) {
    return `
      <div class="ui-body-details">
        <p class="ui-hint">No info dataset wired for <strong>${escapeHtml(bodyName)}</strong> yet.</p>
      </div>
    `;
  }

  const moons = allBodies
    .filter((entry) => entry.parentSlug === body.slug)
    .sort((a, b) => a.name.localeCompare(b.name));

  const override = BODY_INFO_OVERRIDES[body.slug];
  const rows = buildRows(body, moons);

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <div class="ui-body-row">
          <div class="ui-body-row__label">${escapeHtml(label)}</div>
          <div class="ui-body-row__value">${escapeHtml(value)}</div>
        </div>
      `,
    )
    .join("");

  const moonChipsHtml =
    moons.length > 0
      ? `<div class="ui-body-chips">${moons
        .map((moon) => `<button class="ui-body-chip"
        data-action="select-body"
        data-kind="moon"
        data-name="${moon.slug}">
        <span class="planet__icon--${moon.slug}"></span>
        ${escapeHtml(moon.name)}
        </button>`)
        .join("")}</div>`
      : `<div class="ui-body-subtle">No moons listed.</div>`;

  const moonChipsHtmlContainer = inferTypeLabel(body) !== 'Moon' ? `
      <div class="ui-body-block">
        <div class="ui-body-block__title">${body.isOrbiting ? 'Moons' : 'Planets'}</div>
        ${moonChipsHtml}
      </div>
  ` : ""

  const description = override?.summary ?? body.description ?? "No description yet.";

  const compositionBlock = override?.composition
    ? `
      <div class="ui-body-block">
        <div class="ui-body-block__title">Composition</div>
        <p>${escapeHtml(override.composition)}</p>
      </div>
    `
    : "";

  const atmosphereBlock = override?.atmosphere
    ? `
      <div class="ui-body-block">
        <div class="ui-body-block__title">Atmosphere</div>
        <p>${escapeHtml(override.atmosphere)}</p>
      </div>
    `
    : "";

  const tempBlock = override?.surfaceTemperature
    ? `
      <div class="ui-body-block">
        <div class="ui-body-block__title">Surface temperature</div>
        <p>${escapeHtml(override.surfaceTemperature)}</p>
      </div>
    `
    : "";

  const factsBlock = override?.facts?.length
    ? `
      <div class="ui-body-block">
        <div class="ui-body-block__title">Quick facts</div>
        <ul class="ui-body-facts">
          ${override.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}
        </ul>
      </div>
    `
    : "";

  const texturePreviewBlock = override?.texture ? `
        <img class="sidebar__texture" src="${override.texture}" />
  `: ""

  return `
    <div class="ui-body-details">
      ${texturePreviewBlock}

      <div class="ui-body-block">
        <p>${escapeHtml(description)}</p>
      </div>

      <div class="ui-body-block">
        <div class="ui-body-block__title">Core data</div>
        <div class="ui-body-grid">${rowsHtml}</div>
      </div>

      ${moonChipsHtmlContainer}

      ${tempBlock}
      ${compositionBlock}
      ${atmosphereBlock}
      ${factsBlock}


    </div>
  `;
}
