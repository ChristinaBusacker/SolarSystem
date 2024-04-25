import { ShaderDefinition } from "../interfaces/shaderDefinition.interface";

export const astronomicalShader: ShaderDefinition = {
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

  uniform vec3 casterPosition1;
  uniform float casterRadius1;

  uniform vec3 casterPosition2;
  uniform float casterRadius2;

  uniform vec3 casterPosition3;
  uniform float casterRadius3;

  uniform vec3 casterPosition4;
  uniform float casterRadius4;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  varying vec3 vToSun;

  void ShadowCast(in vec3 position, in float radius, in vec3 toSun, inout float shadow) {
    vec3 parentToObjectDirection = normalize(vWorldPosition - position);
    float parentToObjectDistance = length(position - vWorldPosition);

    float cosThetaShadow = dot(parentToObjectDirection, toSun);

    if(radius > 0.0) {
      if(cosThetaShadow < 0.0) {
        float sinTheta = sqrt(1.0 - cosThetaShadow * cosThetaShadow);
        float relativeDistance = radius / parentToObjectDistance;
  
        float shadowEdge = 0.02;
        float fadeStart = relativeDistance - shadowEdge;
        float fadeEnd = relativeDistance + shadowEdge;
  
        shadow -= 1.0 - smoothstep(fadeStart, fadeEnd, sinTheta);
      }
    }

  }

  void main() {
    vec3 toSun = normalize(sunPosition - vWorldPosition);
    float shadow = 1.0;
    
    ShadowCast(casterPosition1, casterRadius1, toSun, shadow);
    ShadowCast(casterPosition2, casterRadius2, toSun, shadow);
    ShadowCast(casterPosition3, casterRadius3, toSun, shadow);
    ShadowCast(casterPosition4, casterRadius4, toSun, shadow);
    
    shadow = clamp(shadow, 0.0, 1.0);

    float cosTheta = dot(vWorldNormal, toSun);
    
    float daynight = smoothstep(-0.2, 1.0, cosTheta);
    vec3 lightEffect = lightColor * lightIntensity;
    vec4 dayColor = texture2D(dayTexture, vUv);

    vec4 finalColor = vec4(dayColor.rgb * daynight * lightEffect *  shadow , dayColor.a); // Anwendung der Lichtintensität

    gl_FragColor =finalColor;
  }
  `
};