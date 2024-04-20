export const starsShader = {
    vertexShader: `
    // Vertex Shader
    attribute float size;
    attribute vec3 customColor;
    
    varying vec3 vColor;
    
    void main() {
      vColor = customColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
    
    `,
    fragmentShader: `
    #ifdef GL_ES
    precision highp float;
    #endif
    
    uniform vec3 color;
    uniform sampler2D pointTexture;
    
    varying vec3 vColor;
    
    void main() {
      vec4 texColor = texture2D(pointTexture, gl_PointCoord);
      vec4 starColor = vec4(vColor * color, 1.0); // Multiplikation mit der Farbuniform
    
      // Prüfen der Texturtransparenz
      if (texColor.a < 0.1) discard;
      else gl_FragColor = starColor * texColor; // Multiplikation der Farben
    }
    `
};