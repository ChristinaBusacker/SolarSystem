import * as THREE from "three";

const textureLoader = new THREE.TextureLoader();
const dayTexture = textureLoader.load("assets/textures/2k_earth_daymap.jpg");
const nightTexture = textureLoader.load(
  "assets/textures/2k_earth_nightmap.jpg"
);

// Erstellen des Shader-Materials
export const earthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    dayTexture: { value: dayTexture },
    nightTexture: { value: nightTexture },
    sunPosition: { value: new THREE.Vector3(0, 0, 0) }, // Position der Sonne
  },
  vertexShader: `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  fragmentShader: `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  
  void main() {
    vec3 sunPosition  = vec3(0, 0, 0); // Uniform für die Sonnenposition
    vec3 toSun = normalize(sunPosition - vWorldPosition); // Richtung zur Sonne
    float dotProduct = dot(vWorldNormal, toSun);
    float intensity = smoothstep(-0.2, 0.2, dotProduct); // Glättung des Übergangs
  
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    gl_FragColor = mix(nightColor, dayColor, intensity);
  }
  `,
  shadowSide: THREE.DoubleSide,
});

// Aktivieren von Schatten für das Material
earthMaterial.shadowSide = THREE.DoubleSide; // Erlaubt Schatten auf beiden Seiten des Materials
