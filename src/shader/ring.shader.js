export const ringShader = {
    vertexShader: `
    varying vec3 vWorldPosition;
    varying vec2 vUv; // UV-Koordinaten für den Fragment Shader
    
    void main() {
      vUv = uv; // Übernehmen der UV-Koordinaten vom Buffer
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    
    
    `,
    fragmentShader: `
    uniform vec3 planetWorldPosition; // Weltkoordinaten des Planeten (Saturn)
    uniform vec3 sunWorldPosition; // Weltkoordinaten der Sonne, in Ihrem Fall (0,0,0)
    uniform float planetRadius; // Der Radius von Saturn
    uniform sampler2D ringTexture; // Die Textur des Rings
    varying vec2 vUv; // Die übergebenen UV-Koordinaten
    varying vec3 vWorldPosition; // Weltkoordinaten eines Punktes auf dem Ring
    
    void main() {
      // Direktion von der Sonne zum Punkt auf dem Ring
      vec3 sunToRingDir = normalize(vWorldPosition - sunWorldPosition);
      
      // Direktion und Abstand von der aktuellen Position auf dem Ring zum Zentrum des Planeten
      vec3 planetToRingDir = normalize(planetWorldPosition - vWorldPosition);
      float planetToRingDistance = length(planetWorldPosition - vWorldPosition);
    
      // Überprüfung, ob der Punkt im Schattenkegel liegt
      float shadow = 0.0;
      if(planetToRingDistance > planetRadius) {
        float cosTheta = dot(sunToRingDir, planetToRingDir);

        if (planetToRingDistance > planetRadius && cosTheta < 0.0) {
            float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
            float relativeDistance = planetRadius / planetToRingDistance;
        
            // Verwenden von smoothstep, um den Schatten weich auslaufen zu lassen
            float shadowEdge = 0.02; // Ein Wert, der die Breite des Übergangsbereichs bestimmt
            float fadeStart = relativeDistance - shadowEdge;
            float fadeEnd = relativeDistance + shadowEdge;
            
            shadow = 1.0 - smoothstep(fadeStart, fadeEnd, sinTheta);
        }
      }
    
      // Textur holen und Schatten einmischen
      vec4 texel = texture2D(ringTexture, vUv);
      vec3 shadowColor = texel.rgb * (1.0 - shadow); // Dunkler machen, wenn im Schatten
      gl_FragColor = vec4(shadowColor, texel.a);
    }
    

    `,
};
