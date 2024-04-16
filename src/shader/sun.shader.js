export const sunShader = {
    vertexShader: `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition; // Verwende vViewPosition, um die Position im Kameraraum zu übergeben

    float plasmaNoise(vec3 position, float time) {
        return sin(position.x * 10.0 + time) * sin(position.y * 10.0 + time) * sin(position.z * 10.0 + time);
    }

    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        float displacement = plasmaNoise(position, time);
        vec3 displacedPosition = position + normal * displacement * 0.1;
        vec4 viewPosition = modelViewMatrix * vec4(displacedPosition, 1.0); // Position in Kamerakoordinaten
        vViewPosition = viewPosition.xyz; // Übergebe nur den xyz-Anteil
        gl_Position = projectionMatrix * viewPosition;
    }
    `,
    fragmentShader: `
    uniform sampler2D sunTexture;
    uniform sampler2D sunSpotsTexture;
    uniform vec3 myCameraPosition; // Die Position der Kamera im Weltkoordinatensystem
    uniform float cameraFar; // Die Far-Plane der Kamera
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
        vec3 sunColor = texture2D(sunTexture, vUv).rgb;
        vec3 sunSpotsColor = texture2D(sunSpotsTexture, vUv).rgb;
        sunColor = mix(sunColor, sunSpotsColor, 0.2);

        // Abstand von der Kamera zum Punkt auf der Oberfläche der Sonne
        float distance = length(vViewPosition) / cameraFar;

        // Dämpfungsfaktor basierend auf der Entfernung
        float attenuation = 1.0 / (1.0 + distance * distance);

        // Emissionsfaktor
        float emissiveFactor = dot(vNormal, vec3(0, 0, 1));
        emissiveFactor = clamp(emissiveFactor * emissiveFactor, 0.0, 1.0); // Emissionswert begrenzen

        // Multiplikator für die Emissionsstärke, um die Gesamtintensität anzupassen
        float emissionStrength = 0.5; // Du kannst diesen Wert anpassen

        // Emission dämpfen und mit der Stärke multiplizieren
        vec3 emission = sunColor * emissiveFactor * attenuation * emissionStrength;

        // Farbe berechnen und ausgeben
        vec3 color = sunColor + emission;
        gl_FragColor = vec4(color, 1.0);
    }
    `
};
