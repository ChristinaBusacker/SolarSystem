export const planetShader = {
  vertexShader: `
    uniform vec3 sunPosition;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vToSun;
  
    void main() {
      vUv = uv;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vToSun = normalize(sunPosition - vWorldPosition);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform vec3 sunPosition;
    uniform vec3 lightColor;
    uniform float lightIntensity;
    uniform float lightFalloff;
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vToSun;
  
    void main() {
      vec3 toSun = normalize(sunPosition - vWorldPosition);

      float cosTheta = dot(vWorldNormal, toSun);
      
      float daynight = smoothstep(-0.2, 1.0, cosTheta);

      vec3 lightEffect = lightColor * lightIntensity;
  
      vec4 dayColor = texture2D(dayTexture, vUv);

      vec4 finalColor = vec4(dayColor.rgb * daynight * lightEffect, dayColor.a); // Anwendung der Lichtintensität
  
      gl_FragColor = finalColor;
    }
  `
};