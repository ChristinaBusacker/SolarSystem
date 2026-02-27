# SolarSystem (Three.js)

A **lightweight, framework-free** Solar System renderer built with **Three.js + TypeScript**, focused on **real scale & orbits**, **custom GLSL shaders**, and a subtle **cinematic touch** (bloom, lens flare, starfield).

**Live demo:** https://cmbu.de/

<p>
  <a href="https://cmbu.de/">
    <img alt="Demo" src="https://img.shields.io/badge/demo-live-2ea44f?style=flat&logo=googlechrome&logoColor=white" />
  </a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-typesafe-3178C6?style=flat&logo=typescript&logoColor=white" />
  <img alt="Three.js" src="https://img.shields.io/badge/Three.js-WebGL-black?style=flat&logo=three.js&logoColor=white" />
  <img alt="Webpack" src="https://img.shields.io/badge/Webpack-bundled-8DD6F9?style=flat&logo=webpack&logoColor=1a1a1a" />
  <img alt="ESLint" src="https://img.shields.io/badge/ESLint-linting-4B32C3?style=flat&logo=eslint&logoColor=white" />
  <img alt="Prettier" src="https://img.shields.io/badge/Prettier-formatting-F7B93E?style=flat&logo=prettier&logoColor=1a1a1a" />
</p>

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

> Preview GIF/video will be added once the project is in its final visual state.

---

## Why this exists

This project started as a personal deep dive into **modern Web 3D** and Three.js internals:
custom shaders, post processing, camera control, CSS2D markers, routing, sound, performance tradeoffs, and keeping everything **maintainable and typesafe** without hiding behind a framework.

It’s a learning project, but it’s built like I want to ship it.

---

## Highlights

- **Framework-free:** no React / Vue / Angular. Just **Three.js + TS**.
- **Real scale & orbits:** sizes, distances, eccentricity/inclination based on real data (with small pragmatic adjustments where needed for usability).
- **Custom shader pipeline** for detail and performance:
  - multi-caster shadowing (eclipses / occlusion)
  - day/night transitions (Earth)
  - atmosphere layers (where applicable)
  - procedural asteroid impostors (fast belts at scale)
- **Cinematic polish (optional):** bloom, lens flare, procedural starfield.
- **Mobile-friendly controls** (orbit + pinch zoom), and responsive UI.
- **UI tools:** markers, orbits, zoom buttons, fullscreen, sound, and declutter.

---

## Controls

### Desktop

- **Orbit:** Left mouse drag
- **Zoom:** Mouse wheel
- **Pan:** not supported (intentionally)

### Mobile

- **Orbit:** 1 finger drag
- **Zoom:** 2 finger pinch

### UI Controls

- Fullscreen toggle
- Sound toggle + volume slider
- Toggle **Orbits**
- Toggle **Markers**
- Zoom In / Zoom Out buttons
- **Declutter** (auto filtering of markers/orbits)

### Time / Simulation Speed (HUD)

The simulation can run from real-time up to “1 year per second”.

<details>
<summary><b>Available speed presets</b></summary>

- Real-time (1s / s)
- 1 min / s
- 5 min / s
- 15 min / s
- 30 min / s
- 1 h / s
- 3 h / s
- 6 h / s
- 12 h / s
- 1 d / s
- 3 d / s
- 1 w / s
- 2 w / s
- 1 m / s
- 3 m / s
- 6 m / s
- 1 y / s

</details>

---

## Included bodies

Planets, dwarf planets, major moons, and belts are included.

<details>
<summary><b>Full list</b></summary>

**Star & planets**

- Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune

**Dwarf planets / minor planets**

- Ceres, Pluto, Haumea, Makemake, Eris

**Moons**

- Moon (Earth)
- Phobos, Deimos (Mars)
- Io, Europa, Ganymede, Callisto (Jupiter)
- Mimas, Enceladus, Tethys, Dione, Rhea, Titan (Saturn)
- Oberon (Uranus)
- Triton, Proteus, Nereid (Neptune)
- Charon (Pluto)

**Belts**

- Asteroid Belt
- Kuiper Belt

</details>

---

## Shader notes (what’s actually custom here)

This project uses multiple custom shaders to keep visuals sharp while staying performant.

- `shader/astronomical.shader.ts`  
  **Planet shading + multi-caster shadowing** (up to 4 shadow casters, soft edge) for believable eclipses/occlusion.

- `shader/astronomical-displacement.shader.ts`  
  **Heightmap displacement** in the vertex shader (centered displacement) for more believable non-perfect spheres.

- `shader/earth.shader.ts`  
  **Day/Night blend + night lights + spec map**, plus shadow casting. The night side stays alive instead of just going black.

- `shader/ring.shader.ts`  
  **Ring shadowing**: Saturn’s rings darken correctly inside the planet’s shadow cone (with a soft transition).

- `shader/asteroid-belt-impostor.shader.ts`  
  **Asteroid impostors**: point sprites with procedural silhouettes + crater noise + wrapped diffuse + rim lighting.  
  Orbit parameters are per-asteroid attributes (semi-major/minor, ecc, inclination, phase, angular speed).  
  Also supports a “bloom mode” discard to keep bloom clean.

- `shader/starfield-points.shader.ts`  
  **Procedural starfield** as crisp, anti-aliased point sprites (HiDPI friendly, no massive HDR sky textures).

- `shader/sun.shader.ts` + `shader/corona.ts`  
  **Animated sun surface + corona layer** (subtle, distance-aware look).

- `shader/mixpass.shader.ts`  
  **Bloom compositing pass** to mix base + bloom output cleanly.

---

## Tech stack

- **TypeScript**
- **Three.js**
- **Webpack** (dev server + production build)
- **Custom GLSL shaders**
- **CSS2DRenderer** for markers
- **Post-processing** (bloom, compositing, anti-aliasing)
- **Custom routing & UI layer** (no external UI framework)

---

## Getting started

### Requirements

- Node.js (recent LTS recommended)

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Quality checks

```bash
npm run check
```

<details>
<summary><b>All scripts</b></summary>

```json
{
  "start": "npm run dev",
  "dev": "webpack serve --config webpack.dev.js",
  "build": "webpack --config webpack.prod.js",
  "typecheck": "tsc -p tsconfig.json --noEmit",
  "lint": "eslint . --ext .ts,.js",
  "lint:fix": "eslint . --ext .ts,.js --fix",
  "format": "prettier . --check",
  "format:write": "prettier . --write",
  "check": "npm run lint && npm run format && npm run typecheck"
}
```

</details>

### Environment

This repo includes `.env.dev` and `.env.prod`.  
Production build uses the production env config.

---

## Project structure (high level)

- `src/application.ts` — main orchestration
- `src/manager/` — scene/camera/astronomical managers
- `src/objects/` — bodies (planets, moons, belts)
- `src/shader/` — custom shader implementations
- `src/ui/` — UI renderers, UI manager, state
- `src/rendering/` — post-processing pipeline
- `src/services/` — viewport & other service abstractions
- `data/` — datasets / raw object data

---

## Assets & credits

Most textures are sourced from (and sometimes adjusted/combined for this project):

- https://www.solarsystemscope.com/textures/
- https://planetpixelemporium.com/planets.html
- https://planet-texture-maps.fandom.com/wiki/Uranus

Some textures are fictional when no high-quality real maps were available.

This project is a personal learning/portfolio project and is not affiliated with NASA/ESA/Three.js.

---

## License

MIT (see `package.json`).

---

## Author

Made with a questionable amount of love and shader debugging by **Christina Busacker**.
