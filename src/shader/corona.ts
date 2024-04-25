import * as THREE from "three";
import { ShaderDefinition } from "../interfaces/shaderDefinition.interface";

export const coronaShader: ShaderDefinition = {
  uniforms: {
    time: { value: 0.0 },
    resolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
  uniform float time;
  uniform vec2 resolution;
  varying vec2 vUv;

  void main() {
      vec2 uv = (vUv - 0.5) * 2.0;
      uv *= resolution.x / resolution.y;
      float angle = atan(uv.y, uv.x);
      float distance = length(uv);
      vec3 color = vec3(1.0, 0.8, 0.0);
      float alpha = 0.0;

      if (distance < 1.0) {
          alpha = 0.0; // Vollständig transparent innerhalb der Kugel
      } else {
          // Berechnung der Corona-Intensität
          float coronaIntensity = smoothstep(1.0, 2.5, distance);
          alpha = mix(0.2, 0.0, coronaIntensity); // Anpassen der Transparenz

          // Anpassen der Farbintensität basierend auf der Distanz
          float colorIntensity = 1.0 - smoothstep(1.0, 1.8, distance);
          color *= colorIntensity;
      }

      gl_FragColor = vec4(color, alpha);
  }
`,
  transparent: true,
};
