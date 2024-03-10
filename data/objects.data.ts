import * as THREE from "three";

const FINN_TO_KM = 14960;

export const sunData = {
  title: "Sonne",
  description:
    "Ein massiver, heißer Stern, der fast die gesamte Masse unseres Sonnensystems enthält und dessen Zentrum bildet.",
  size: 93,
  distanceToOrbiting: 0,
  orbitalSpeed: 0,
  rotationSpeed: 0.0000029928,
  initialPosition: new THREE.Vector3(0, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0,
};

export const mercuryData = {
  title: "Merkur",
  description:
    "Der kleinste Planet des Sonnensystems und der Sonne am nächsten. Er ist bekannt für seine extreme Temperaturschwankungen.",
  size: 0.326,
  distanceToOrbiting: 390,
  orbitalSpeed: 0.0000078643,
  rotationSpeed: 0.0000001467,
  initialPosition: new THREE.Vector3(390, 0, 0),
  planetaryTilt: 0.03,
  orbitalTilt: 3.38,
  maxDistanceToOrbiting: (69.82 * 10 ** 5) / FINN_TO_KM, // 69,82 Millionen km
  minDistanceToOrbiting: (46.0 * 10 ** 5) / FINN_TO_KM, // 46,00 Millionen km
  orbitCenter:
    ((69.82 * 10 ** 5) / FINN_TO_KM - (46.0 * 10 ** 5) / FINN_TO_KM) / 2,
  semiMajorAxis:
    ((69.82 * 10 ** 5) / FINN_TO_KM + (46.0 * 10 ** 5) / FINN_TO_KM) / 2,
  semiMinorAxis: Math.sqrt(69.82 * 10 ** 5 * 46.0 * 10 ** 5) / FINN_TO_KM,
};

export const venusData = {
  title: "Venus",
  description:
    "Zweiter Planet von der Sonne aus und ähnlich groß wie die Erde. Bekannt für seine dichte Atmosphäre und heiße Oberfläche.",
  size: 0.809,
  distanceToOrbiting: 720,
  orbitalSpeed: 0.0000038987,
  rotationSpeed: -0.000000064,
  initialPosition: new THREE.Vector3(720, 0, 0),
  planetaryTilt: 2.64,
  orbitalTilt: 3.86,
  maxDistanceToOrbiting: (108.94 * 10 ** 5) / FINN_TO_KM, // 108,94 Millionen km
  minDistanceToOrbiting: (107.48 * 10 ** 5) / FINN_TO_KM, // 107,48 Millionen km
  orbitCenter: new THREE.Vector3(
    (((108.94 - 107.48) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((108.94 + 107.48) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(108.94 * 107.48) * 10 ** 5) / FINN_TO_KM,
};

export const earthData = {
  title: "Erde",
  description:
    "Unser Heimatplanet, der dritte von der Sonne aus. Einziger bekannter Ort im Universum, der Leben beherbergt.",
  size: 0.851,
  distanceToOrbiting: 1000,
  orbitalSpeed: 0.0000027397,
  rotationSpeed: 0.0000115741,
  initialPosition: new THREE.Vector3(1000, 0, 0),
  planetaryTilt: 23.44,
  orbitalTilt: 7.155,
  maxDistanceToOrbiting: (152.1 * 10 ** 5) / FINN_TO_KM, // 152,10 Millionen km
  minDistanceToOrbiting: (147.1 * 10 ** 5) / FINN_TO_KM, // 147,10 Millionen km
  orbitCenter: new THREE.Vector3(
    (((152.1 - 147.1) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((152.1 + 147.1) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(152.1 * 147.1) * 10 ** 5) / FINN_TO_KM,
};

export const moonData = {
  title: "Mond",
  description:
    "Der einzige natürliche Satellit der Erde. Beeinflusst die Gezeiten und hat eine dunkle, kraterreiche Oberfläche.",
  size: 0.232, // in Finn, Größe übertrieben für bessere Sichtbarkeit
  distanceToOrbiting: 2.57, // Realistischer Abstand zur Erde in Finn
  orbitalSpeed: 0.0000253315,
  rotationSpeed: 0.0000026617,
  initialPosition: new THREE.Vector3(2.57, 0, 0), // Relative Position zur Erde in der Gruppe
  planetaryTilt: 6.68,
  orbitalTilt: 5.145,
  orbitCenter: new THREE.Vector3(
    (((405.5 - 363.3) / 2) * 10 ** 3) / FINN_TO_KM,
    0,
    0
  ), // Orbitzentrum relativ zur Erde
  semiMajorAxis: (((405.5 + 363.3) / 2) * 10 ** 2) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(405.5 * 363.3) * 10 ** 2) / FINN_TO_KM,
};

export const marsData = {
  title: "Mars",
  description:
    "Bekannt als der rote Planet wegen seiner eisenoxidhaltigen Oberfläche. Ziel zahlreicher Raumfahrtmissionen.",
  size: 0.453,
  distanceToOrbiting: 1520,
  orbitalSpeed: 0.0000010081,
  rotationSpeed: 0.0000110506,
  initialPosition: new THREE.Vector3(1520, 0, 0),
  planetaryTilt: 25.19,
  orbitalTilt: 5.65,
  orbitCenter: new THREE.Vector3(
    (((249.23 - 206.62) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((249.23 + 206.62) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(249.23 * 206.62) * 10 ** 5) / FINN_TO_KM,
};

export const jupiterData = {
  title: "Jupiter",
  description:
    "Der größte Planet des Sonnensystems, ein Gasriese mit einem großen roten Fleck, einem gigantischen Sturm.",
  size: 9.34,
  distanceToOrbiting: 5200,
  orbitalSpeed: 0.0000001598,
  rotationSpeed: 0.0001454441,
  initialPosition: new THREE.Vector3(5200, 0, 0),
  planetaryTilt: 6.09,
  orbitCenter: new THREE.Vector3(
    (((816.62 - 740.52) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((816.62 + 740.52) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(816.62 * 740.52) * 10 ** 5) / FINN_TO_KM,
};

export const saturnData = {
  title: "Saturn",
  description:
    "Auffällig wegen seiner beeindruckenden Ringstruktur. Ein Gasriese, der zweitgrößte Planet unseres Sonnensystems.",
  size: 7.78,
  distanceToOrbiting: 9580,
  orbitalSpeed: 0.0000000814,
  rotationSpeed: 0.0001569936,
  initialPosition: new THREE.Vector3(9580, 0, 0),
  planetaryTilt: 5.51,
  orbitCenter: new THREE.Vector3(
    (((1504.5 - 1352.6) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((1504.5 + 1352.6) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(1504.5 * 1352.6) * 10 ** 5) / FINN_TO_KM,
};

export const uranusData = {
  title: "Uranus",
  description:
    "Ein eisiger Gasriese, bekannt für seine einzigartige Neigung. Hat ein dünnes Ringsystem und zahlreiche Monde.",
  size: 0.339,
  distanceToOrbiting: 19220,
  orbitalSpeed: 0.0000000285,
  rotationSpeed: -0.0000968654,
  initialPosition: new THREE.Vector3(19220, 0, 0),
  planetaryTilt: 6.48,
  orbitCenter: new THREE.Vector3(
    (((3003.6 - 2741.3) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((3003.6 + 2741.3) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(3003.6 * 2741.3) * 10 ** 5) / FINN_TO_KM,
};

export const neptuneData = {
  title: "Neptun",
  description:
    "Der entfernteste bekannte Planet unseres Sonnensystems. Ein blauer Gasriese mit starken Winden und Stürmen.",
  size: 0.329,
  distanceToOrbiting: 30050,
  orbitalSpeed: 0.0000000145,
  rotationSpeed: 0.0001031089,
  initialPosition: new THREE.Vector3(30050, 0, 0),
  planetaryTilt: 6.43,
  orbitCenter: new THREE.Vector3(
    (((4553.9 - 4459.7) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((4553.9 + 4459.7) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(4553.9 * 4459.7) * 10 ** 5) / FINN_TO_KM,
};

export const issData = {
  title: "Internationale Raumstation",
  description:
    "Ein bewohnbares künstliches Satellit und Mikrogravitationslabor, das in einer niedrigen Erdumlaufbahn kreist.",
  size: 0.00073,
  distanceToOrbiting: 0.00281,
  orbitalSpeed: 0.0001066667,
  rotationSpeed: 0,
  initialPosition: new THREE.Vector3(1000.00281, 0, 0),
  planetaryTilt: 51.6,
};
