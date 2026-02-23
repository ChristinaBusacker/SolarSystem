import { ShaderDefinition } from "../interfaces/shaderDefinition.interface";

export const asteroidBeltImpostorShader: ShaderDefinition = {
  vertexShader: `
    uniform float uTime;
    uniform float uViewportScale;
    uniform vec3 uSunWorldPosition;

    attribute float aSemiMajor;
    attribute float aSemiMinor;
    attribute float aEcc;
    attribute float aArgPeri;
    attribute float aInclination;
    attribute float aPhase0;
    attribute float aAngularSpeed;
    attribute float aSize;
    attribute float aShapeSeed;
    attribute vec3 aColor;

    varying vec3 vColor;
    varying vec3 vViewPos;
    varying vec3 vSunDirView;
    varying float vSunDistance;
    varying float vShapeSeed;

    void main() {
      float theta = aPhase0 - (aAngularSpeed * uTime);

      // Ellipse in XZ with focus offset for eccentricity.
      float x0 = aSemiMajor * cos(theta) - aSemiMajor * aEcc;
      float z0 = aSemiMinor * sin(theta);

      // Rotate orbit in plane (argument of periapsis).
      float co = cos(aArgPeri);
      float so = sin(aArgPeri);
      float x1 = x0 * co - z0 * so;
      float z1 = x0 * so + z0 * co;

      // Inclination around X axis.
      float ci = cos(aInclination);
      float si = sin(aInclination);
      float y2 = z1 * si;
      float z2 = z1 * ci;

      vec4 worldPos = modelMatrix * vec4(x1, y2, z2, 1.0);
      vec4 mvPos = viewMatrix * worldPos;
      vec3 sunView = (viewMatrix * vec4(uSunWorldPosition, 1.0)).xyz;

      vColor = aColor;
      vViewPos = mvPos.xyz;
      vSunDirView = sunView - mvPos.xyz;
      vSunDistance = length(uSunWorldPosition - worldPos.xyz);
      vShapeSeed = aShapeSeed;

      float pointSize = aSize * (300.0 * uViewportScale / max(1.0, -mvPos.z));
      gl_PointSize = clamp(pointSize, 1.5, 64.0);
      gl_Position = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: `
    #ifdef GL_ES
    precision highp float;
    #endif

    uniform float uBloomMode;

    varying vec3 vColor;
    varying vec3 vViewPos;
    varying vec3 vSunDirView;
    varying float vSunDistance;
    varying float vShapeSeed;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 78.233);
      return fract(p.x * p.y);
    }

    float valueNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash21(i);
      float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0));
      float d = hash21(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float n = 0.0;
      float a = 0.55;
      for (int i = 0; i < 4; i++) {
        n += valueNoise(p) * a;
        p = p * 2.03 + vec2(17.1, 9.2);
        a *= 0.5;
      }
      return n;
    }

    void main() {
      if (uBloomMode > 0.5) discard;

      // Point-local coordinates (-1..1).
      vec2 p = gl_PointCoord * 2.0 - 1.0;

      // Per-asteroid rotation so they don't all share the same silhouette.
      float rot = vShapeSeed * 6.28318530718;
      float cr = cos(rot);
      float sr = sin(rot);
      vec2 pr = vec2(p.x * cr - p.y * sr, p.x * sr + p.y * cr);

      float r = length(pr);
      float angle = atan(pr.y, pr.x);

      // Jagged silhouette radius.
      float edgeNoise = fbm(vec2(cos(angle), sin(angle)) * 3.0 + vec2(vShapeSeed * 19.3, vShapeSeed * 7.7));
      float edge = 0.78 + (edgeNoise - 0.5) * 0.22;

      // Make it less circular.
      float anis = mix(0.78, 1.22, fract(vShapeSeed * 13.7));
      float ang2 = angle + vShapeSeed * 3.1;
      float ellipseWarp = 1.0 + 0.20 * cos(2.0 * ang2) * (anis - 1.0);
      float rr = r / max(0.55, ellipseWarp);

      if (rr > edge) discard;

      // Surface noise / pseudo-height.
      vec2 nUv = pr * 3.5 + vec2(vShapeSeed * 11.0, vShapeSeed * 23.0);
      float n1 = fbm(nUv);
      float n2 = fbm(nUv * 2.1 + 4.7);
      float craters = smoothstep(0.62, 0.92, n2) * 0.35;

      float edgeNorm = clamp(rr / max(0.001, edge), 0.0, 1.0);
      float baseHeight = sqrt(max(0.0, 1.0 - edgeNorm * edgeNorm));
      float height = clamp(baseHeight * (0.92 + (n1 - 0.5) * 0.35) - craters, 0.0, 1.0);

      // Approximate normal in view space (sprite space == view-facing billboard).
      vec3 n = normalize(vec3(pr * 0.95, max(0.06, height)));
      vec3 l = normalize(vSunDirView);
      vec3 v = normalize(-vViewPos);
      vec3 h = normalize(l + v);

      float diff = max(dot(n, l), 0.0);
      float spec = pow(max(dot(n, h), 0.0), 18.0) * 0.16;
      float rim = pow(1.0 - max(dot(n, v), 0.0), 2.4) * 0.08;

      // Darken crevices and broken surface areas.
      float crevice = smoothstep(0.45, 0.95, n2) * 0.28;
      float edgeDark = smoothstep(0.55, 1.0, edgeNorm) * 0.35;

      // Mild cinematic distance attenuation relative to sun (not inverse-square harsh).
      float sunAtten = 1.0 - smoothstep(1200.0, 4200.0, vSunDistance) * 0.15;

      vec3 albedo = vColor;
      vec3 lit = albedo * (0.12 + diff * 0.95) * sunAtten;
      lit *= (1.0 - crevice) * (1.0 - edgeDark);
      lit += vec3(spec);
      lit += albedo * rim;

      // Subtle color breakup so they don't read as identical dots.
      lit *= 0.94 + (n1 - 0.5) * 0.12;

      float alpha = smoothstep(edge + 0.03, edge - 0.02, rr);
      gl_FragColor = vec4(lit, alpha);
    }
  `,
};
