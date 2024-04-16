export const moonShader = {
    vertexShader: `
      uniform vec3 earthPosition;
      uniform vec3 sunPosition;
      varying float vShadowFactor;
  
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vec3 toEarth = normalize(earthPosition - worldPosition.xyz);
        vec3 toSun = normalize(sunPosition - worldPosition.xyz);
        float angle = acos(dot(toEarth, toSun));
        float earthRadiusApparent = 0.05; // Einstellbar, repräsentiert den scheinbaren Radius der Erde vom Mond aus
        float distanceToEarth = length(earthPosition - worldPosition.xyz);
        float umbraAngle = asin(earthRadiusApparent / distanceToEarth);
        
        if (angle < umbraAngle) {
          vShadowFactor = 0.0; // im Schatten
        } else {
          vShadowFactor = 1.0; // voll beleuchtet
        }
  
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying float vShadowFactor;
      uniform vec3 lightColor;
      uniform float lightIntensity;
  
      void main() {
        vec3 color = vec3(0.1, 0.1, 0.4); // Grundfarbe des Mondes
        color *= vShadowFactor * lightIntensity;
        gl_FragColor = vec4(color, 1.0);
      }
    `
};
