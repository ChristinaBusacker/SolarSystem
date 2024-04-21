export const moonShader = {
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
    uniform vec3 parentWorldPosition;
    uniform float parentRadius; // Der Radius von Saturn
    varying vec2 vUv;
    varying vec3 vWorldNormal;
    varying vec3 vWorldPosition;
    varying vec3 vToSun;
  
    void main() {
      vec3 toSun = normalize(sunPosition - vWorldPosition);
      vec3 parentToObjectDirection = normalize(vWorldPosition - parentWorldPosition);
      float parentToObjectDistance = length(parentWorldPosition - vWorldPosition);
      
      float shadow = 0.0;

      float cosThetaShadow = dot(parentToObjectDirection, toSun);

      if (parentToObjectDistance > parentRadius && cosThetaShadow < 0.0) {
        float sinTheta = sqrt(1.0 - cosThetaShadow * cosThetaShadow);
        float relativeDistance = parentRadius / parentToObjectDistance;

        float shadowEdge = 0.02; // Ein Wert, der die Breite des Übergangsbereichs bestimmt
        float fadeStart = relativeDistance - shadowEdge;
        float fadeEnd = relativeDistance + shadowEdge;

        shadow = 1.0 - smoothstep(fadeStart, fadeEnd, sinTheta);
      }

      float cosTheta = dot(vWorldNormal, toSun);
      
      float daynight = smoothstep(-0.2, 1.0, cosTheta);
      vec3 lightEffect = lightColor * lightIntensity;
      vec4 dayColor = texture2D(dayTexture, vUv);

      vec4 finalColor = vec4(dayColor.rgb * daynight * lightEffect * (1.0 - shadow) , dayColor.a); // Anwendung der Lichtintensität
  
      gl_FragColor = finalColor;
    }
    `
};
