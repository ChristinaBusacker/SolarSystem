import { ShaderDefinition } from "../interfaces/shaderDefinition.interface";

// A lightweight, procedural starfield intended to stay crisp on mobile.
// No textures, no huge env maps. Just math.
//
// Design goals:
// - lots of tiny stars + a few bigger ones
// - subtle color variation (warm/white/cool)
// - stable across DPI / resolutions (sizes are in UV space, not cell space)
export const starfieldSkyShader: ShaderDefinition = {
  uniforms: {
    uTime: { value: 0.0 },

    // Roughly: cells per UV axis. Total stars ~= density^2 * probability
    uSmallStarDensity: { value: 520.0 },
    uSmallStarProbability: { value: 0.12 },

    uBigStarDensity: { value: 160.0 },
    uBigStarProbability: { value: 0.03 },

    // Very subtle "galaxy" band (kept intentionally faint)
    uGalaxyStrength: { value: 0.06 },
    uGalaxyWidth: { value: 0.24 },
    uGalaxyAxis: { value: [0.0, 0.35, 0.94] },
  },
  vertexShader: `
    varying vec3 vDir;

    void main() {
      // Sphere is centered at the camera. Direction is the normalized vertex position.
      vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #ifdef GL_ES
    precision highp float;
    #endif

    uniform float uTime;
    uniform float uSmallStarDensity;
    uniform float uSmallStarProbability;
    uniform float uBigStarDensity;
    uniform float uBigStarProbability;
    uniform float uGalaxyStrength;
    uniform float uGalaxyWidth;
    uniform vec3  uGalaxyAxis;

    varying vec3 vDir;

    const float PI = 3.14159265359;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    vec2 hash22(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.xx + p3.yz) * p3.zy);
    }

    vec2 dirToEquirect(vec3 dir) {
      dir = normalize(dir);
      float u = atan(dir.z, dir.x) / (2.0 * PI) + 0.5;
      float v = asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5;
      return vec2(u, v);
    }

    vec3 starTint(float r) {
      // r in [0,1]. Bias towards white, with occasional warm/cool stars.
      vec3 warm  = vec3(1.0, 0.90, 0.78);
      vec3 cool  = vec3(0.78, 0.88, 1.0);
      vec3 white = vec3(1.0);

      float wc = smoothstep(0.08, 0.92, r);
      vec3 base = mix(warm, cool, wc);

      // Pull most stars closer to white.
      float toWhite = smoothstep(0.20, 0.85, r);
      return mix(base, white, toWhite);
    }

    // Distance on an equirect UV map is distorted near the poles.
    // This compensates a bit by scaling U by cos(latitude).
    float equirectDistance(vec2 a, vec2 b, float v) {
      vec2 d = a - b;
      // wrap in U
      d.x = abs(d.x);
      d.x = min(d.x, 1.0 - d.x);

      float lat = (v - 0.5) * PI;
      d.x *= max(0.15, cos(lat));
      return length(d);
    }

    vec3 renderStarLayer(
      vec2 uv,
      float density,
      float probability,
      float sizeMin,
      float sizeMax,
      float haloMul,
      float intensityMin,
      float intensityMax,
      float intensityPow,
      float twinkle
    ) {
      // Grid cell id
      vec2 gv = uv * density;
      vec2 id = floor(gv);

      float rnd = hash12(id);
      float on = step(1.0 - probability, rnd);

      // Star position within the cell
      vec2 jitter = hash22(id + 17.23);
      vec2 posUv = (id + jitter) / density;

      // Visible, resolution-stable size in UV space
      float sizeR = pow(hash12(id + 3.71), 7.0);
      float size = mix(sizeMin, sizeMax, sizeR);

      float d = equirectDistance(uv, posUv, uv.y);

      float core = smoothstep(size, 0.0, d);
      float halo = smoothstep(size * 6.0, 0.0, d) * haloMul;

      float iRnd = hash12(id + 9.13);
      float intensity = mix(intensityMin, intensityMax, pow(iRnd, intensityPow));

      // subtle twinkle for big stars
      float tw = 1.0;
      if (twinkle > 0.0) {
        float phase = hash12(id + 21.7) * 6.2831853;
        tw = 0.90 + 0.10 * sin(uTime * 0.7 + phase);
      }

      vec3 tint = starTint(hash12(id + 5.55));
      return tint * (core + halo) * intensity * on * tw;
    }

    void main() {
      vec3 dir = normalize(vDir);
      vec2 uv = dirToEquirect(dir);

      vec3 col = vec3(0.0);

      // Faint "Milky Way" band. No heavy noise: just a soft plane with a tiny hashed modulation.
      vec3 axis = normalize(uGalaxyAxis);
      float plane = 1.0 - abs(dot(dir, axis));
      float band = smoothstep(1.0 - uGalaxyWidth, 1.0, plane);
      float bandNoise = 0.70 + 0.30 * hash12(floor(uv * 12.0));
      vec3 galaxyCol = vec3(0.10, 0.12, 0.18) * band * bandNoise;
      col += galaxyCol * uGalaxyStrength;

      // Small stars (lots)
      col += renderStarLayer(
        uv,
        uSmallStarDensity,
        uSmallStarProbability,
        0.00035,
        0.00120,
        0.08,
        0.22,
        1.05,
        2.2,
        0.0
      );

      // Big stars (few, bright)
      col += renderStarLayer(
        uv,
        uBigStarDensity,
        uBigStarProbability,
        0.00110,
        0.00380,
        0.35,
        0.80,
        2.40,
        1.2,
        1.0
      );

      // Keep blacks black, but boost visibility a bit.
      col = max(col, 0.0);
      col *= 1.35;

      // Gentle curve
      col = pow(col, vec3(0.95));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
