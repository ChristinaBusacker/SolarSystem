export const planetMaterial = new THREE.ShaderMaterial({
    uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },
        lightColor: { value: new THREE.Color(0xffffff) }, // Farbe des Lichts
        lightIntensity: { value: 1.0 }, // Intensität des Lichts
        lightFalloff: { value: 100.0 } // Lichtabfall bis zur maximalen Reichweite
    },
    vertexShader: `
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
      varying vec2 vUv;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      varying vec3 vToSun;
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform vec3 lightColor;
      uniform float lightIntensity;
      uniform float lightFalloff;
      
      void main() {
        float distanceToLight = length(sunPosition - vWorldPosition);
        float attenuation = 1.0 / (1.0 + (distanceToLight / lightFalloff) * (distanceToLight / lightFalloff));
        float cosTheta = dot(vWorldNormal, vToSun);
        float penumbra = smoothstep(0.0, 0.2, cosTheta);
        float umbra = smoothstep(0.2, 1.0, cosTheta);
  
        vec4 dayColor = texture2D(dayTexture, vUv);
        vec4 nightColor = texture2D(nightTexture, vUv);
        vec4 colorMix = mix(nightColor, dayColor, umbra + penumbra * 0.5);
        
        vec3 lightEffect = lightColor * lightIntensity * attenuation;
        gl_FragColor = vec4(colorMix.rgb * lightEffect, colorMix.a);
      }
    `,
    side: THREE.DoubleSide
});