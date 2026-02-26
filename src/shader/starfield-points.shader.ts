import { ShaderDefinition } from "../interfaces/shaderDefinition.interface";

// Starfield rendered as THREE.Points using a tiny fragment shader.
// This avoids the blocky artifacts you can get from an equirect sky-dome grid.
//
// Design goals:
// - crisp, round stars
// - variable size, brightness, color
// - stable on mobile (no huge textures / PMREM)
export const starfieldPointsShader: ShaderDefinition = {
  uniforms: {
    uTime: { value: 0.0 },
    uPixelRatio: { value: 1.0 },
    // Global multiplier for star sizes.
    uSizeMul: { value: 1.0 },
  },
  vertexShader: `
    attribute vec3  aColor;
    attribute float aSize;
    attribute float aAlpha;

    uniform float uPixelRatio;
    uniform float uSizeMul;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vColor = aColor;
      vAlpha = aAlpha;

      // Positions are on a unit sphere; the Application scales the whole Points object.
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // gl_PointSize is in pixels.
      // Keep stars crisp on high DPI by scaling with pixel ratio.
      float sizePx = aSize * uSizeMul * uPixelRatio;
      // Avoid sub-pixel sizes (they shimmer heavily when the camera moves).
      gl_PointSize = max(sizePx, 1.0);
    }
  `,
  fragmentShader: `
    #ifdef GL_ES
    precision highp float;
    #endif

    uniform float uTime;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      // gl_PointCoord is [0..1] across the point sprite.
      vec2 p = gl_PointCoord - 0.5;
      float r = length(p);

      // Anti-aliased circular sprite.
      // We fade the edge instead of hard-discarding at exactly 0.5 to reduce "sparkle" during camera motion.
      float edge = smoothstep(0.55, 0.45, r);
      float core = smoothstep(0.45, 0.0, r);
      float halo = smoothstep(0.55, 0.0, r) * 0.22;

      // Stars in space don't twinkle. (Atmosphere is for planets, not your skybox.)
      float a = clamp((core + halo) * vAlpha, 0.0, 1.0) * edge;
      if (a < 0.002) discard;

      // With additive blending (SRC_ALPHA, ONE) the GPU will multiply the RGB by alpha.
      gl_FragColor = vec4(vColor, a);
    }
  `,
};
