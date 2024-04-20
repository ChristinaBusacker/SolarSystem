export const earthShader = {
  vertexShader: `
  uniform vec3 sunPosition;
  
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vToSun;
  varying vec3 vViewDirection; // Varying to pass view direction to fragment shader
  
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vToSun = normalize(sunPosition - vWorldPosition);
    vViewDirection = normalize(cameraPosition - vWorldPosition); // Calculate view direction
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  
  `,
  fragmentShader: `
  uniform vec3 sunPosition;
  uniform vec3 lightColor;
  uniform float lightIntensity;
  uniform float lightFalloff;
  uniform float shininess; // Shininess coefficient for specular highlight
  
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vToSun;
  varying vec3 vViewDirection;
  
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D specMap;
  
  void main() {
    float distanceToLight = length(sunPosition - vWorldPosition);
    float attenuation = 1.0 / (1.0 + (distanceToLight / lightFalloff) * (distanceToLight / lightFalloff));
    float cosTheta = dot(vWorldNormal, vToSun);
    vec3 reflectDir = reflect(-vToSun, vWorldNormal); // Reflect direction of light
    float spec = pow(max(dot(reflectDir, vViewDirection), 0.0), shininess);
  

    float daynight = smoothstep(0.2, 1.0, cosTheta);

    float daySide = smoothstep(0.0, 0.8, cosTheta);
    float nightSide = smoothstep(0.8, 1.0, cosTheta);
  
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    vec4 specColor = texture2D(specMap, vUv);
    
    vec4 colorMix = mix(nightColor, dayColor, daynight);
  
    vec3 lightEffect = lightColor * lightIntensity * attenuation;
    vec3 finalColor = colorMix.rgb * lightEffect + lightColor * spec * specColor.r; // Adding specular component
    gl_FragColor = vec4(finalColor, colorMix.a);
  }
  `,
};
