
import * as THREE from "three";

export const penumbraShader = {

    vertexShader: `
  varying vec3 vPosition;
  void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
    fragmentShader: `
  uniform vec3 sunPosition; // Sonnenposition, z.B. vec3(0, 0, 0)
  uniform vec3 planetRadius; // Radius des Planeten/Mondes
  varying vec3 vPosition;
  
  void main() {
      vec3 toSun = normalize(sunPosition - vPosition);
      float distanceToSun = length(sunPosition - vPosition);
      float umbraAngle = asin(planetRadius / distanceToSun);
      float penumbraAngle = acos(planetRadius / distanceToSun);
  
      float lightDot = dot(normalize(vPosition), toSun);
      float lightAngle = acos(lightDot);
  
      if (lightAngle < umbraAngle) {
          // Umbra
          gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Komplett schwarz
      } else if (lightAngle < penumbraAngle) {
          // Penumbra
          float shadowStrength = (lightAngle - umbraAngle) / (penumbraAngle - umbraAngle);
          gl_FragColor = vec4(vec3(shadowStrength), 1.0); // Linear abnehmende Intensität
      } else {
          // Kein Schatten
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); // Komplett weiß
      }
  }
`,
};
