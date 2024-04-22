import * as THREE from "three";
import { AstronomicalDataset } from "../src/interfaces/dataset.interface";

const FINN_TO_KM = 14960;

export const sunData: AstronomicalDataset = {
  title: "Sonne",
  name: 'Sun',
  description:
    "Ein massiver, heißer Stern, der fast die gesamte Masse unseres Sonnensystems enthält und dessen Zentrum bildet.",
  size: 93,
  distanceToOrbiting: 0,
  orbitalSpeed: 0,
  rotationSpeed: 0.0000029928,
  initialPosition: new THREE.Vector3(0, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0,

  maxDistanceToOrbiting: 0,
  minDistanceToOrbiting: 0,
  orbitCenter: new THREE.Vector3(0, 0, 0),
  semiMajorAxis: 0,
  semiMinorAxis: 0,
  color: "#ffd700"
};

export const mercuryData: AstronomicalDataset = {
  title: "Merkur",
  name: 'Mercury',
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
    new THREE.Vector3(
      ((69.82 * 10 ** 5) / FINN_TO_KM - (46.0 * 10 ** 5) / FINN_TO_KM) / 2,
      0,
      0
    ),

  semiMajorAxis:
    ((69.82 * 10 ** 5) / FINN_TO_KM + (46.0 * 10 ** 5) / FINN_TO_KM) / 2,
  semiMinorAxis: Math.sqrt(69.82 * 10 ** 5 * 46.0 * 10 ** 5) / FINN_TO_KM,
  color: "#b87333"
};

export const venusData: AstronomicalDataset = {
  title: "Venus",
  name: 'Venus',
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
  color: "#cea262"
};

export const earthData: AstronomicalDataset = {
  title: "Erde",
  name: 'Earth',
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
  color: "#1f75fe"
};

export const moonData: AstronomicalDataset = {
  title: "Mond",
  name: 'Moon',
  description:
    "Der einzige natürliche Satellit der Erde. Beeinflusst die Gezeiten und hat eine dunkle, kraterreiche Oberfläche.",
  size: 0.232, // in Finn, Größe übertrieben für bessere Sichtbarkeit
  distanceToOrbiting: 2.57, // Realistischer Abstand zur Erde in Finn
  orbitalSpeed: 0.0000253315,
  rotationSpeed: 0,
  initialPosition: new THREE.Vector3(2.57, 0, 0), // Relative Position zur Erde in der Gruppe
  planetaryTilt: 6.68,
  orbitalTilt: 5.145,
  maxDistanceToOrbiting: 405.5 * 10 ** 3 / FINN_TO_KM, // 405,5 Tausend km
  minDistanceToOrbiting: 363.3 * 10 ** 3 / FINN_TO_KM, // 363,3 Tausend km
  orbitCenter: new THREE.Vector3(
    ((405.5 - 363.3) / 2) * 10 ** 3 / FINN_TO_KM,
    0,
    0
  ), // Korrektes Orbitzentrum relativ zur Erde
  semiMajorAxis: ((405.5 + 363.3) / 2) * 10 ** 3 / FINN_TO_KM,
  semiMinorAxis: Math.sqrt(405.5 * 363.3) * 10 ** 3 / FINN_TO_KM,
  color: '#888c8d'
};


export const marsData: AstronomicalDataset = {
  title: "Mars",
  name: 'Mars',
  description:
    "Bekannt als der rote Planet wegen seiner eisenoxidhaltigen Oberfläche. Ziel zahlreicher Raumfahrtmissionen.",
  size: 0.453,
  distanceToOrbiting: 1520,
  orbitalSpeed: 0.0000010081,
  rotationSpeed: 0.0000110506,
  initialPosition: new THREE.Vector3(1520, 0, 0),
  planetaryTilt: 25.19,
  orbitalTilt: 5.65,
  maxDistanceToOrbiting: 249.23 * 10 ** 6 / FINN_TO_KM, // 249,23 Millionen km
  minDistanceToOrbiting: 206.62 * 10 ** 6 / FINN_TO_KM, // 206,62 Millionen km
  orbitCenter: new THREE.Vector3(
    (((249.23 - 206.62) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((249.23 + 206.62) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(249.23 * 206.62) * 10 ** 5) / FINN_TO_KM,
  color: '#b22222'
};

export const jupiterData: AstronomicalDataset = {
  title: "Jupiter",
  name: 'Jupiter',
  description:
    "Der größte Planet des Sonnensystems, ein Gasriese mit einem großen roten Fleck, einem gigantischen Sturm.",
  size: 9.34,
  distanceToOrbiting: 5200,
  orbitalSpeed: 0.0000001598,
  rotationSpeed: 0.0001454441,
  initialPosition: new THREE.Vector3(5200, 0, 0),
  planetaryTilt: 6.09,
  orbitalTilt: 1.31,
  maxDistanceToOrbiting: 816.62 * 10 ** 6 / FINN_TO_KM, // 816,62 Millionen km
  minDistanceToOrbiting: 740.52 * 10 ** 6 / FINN_TO_KM, // 740,52 Millionen km
  orbitCenter: new THREE.Vector3(
    (((816.62 - 740.52) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((816.62 + 740.52) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(816.62 * 740.52) * 10 ** 5) / FINN_TO_KM,
  color: '#ff4500'
};

export const saturnData: AstronomicalDataset = {
  title: "Saturn",
  name: 'Saturn',
  description:
    "Auffällig wegen seiner beeindruckenden Ringstruktur. Ein Gasriese, der zweitgrößte Planet unseres Sonnensystems.",
  size: 7.78,
  distanceToOrbiting: 9580,
  orbitalSpeed: 0.0000000814,
  rotationSpeed: 0.0001569936,
  initialPosition: new THREE.Vector3(9580, 0, 0),
  planetaryTilt: 5.51,
  orbitalTilt: 2.49,
  maxDistanceToOrbiting: 1504.5 * 10 ** 6 / FINN_TO_KM, // 1,504 Milliarden km
  minDistanceToOrbiting: 1352.6 * 10 ** 6 / FINN_TO_KM, // 1,352 Milliarden km
  orbitCenter: new THREE.Vector3(
    (((1504.5 - 1352.6) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((1504.5 + 1352.6) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(1504.5 * 1352.6) * 10 ** 5) / FINN_TO_KM,
  color: '#ffd700'
};

export const uranusData: AstronomicalDataset = {
  title: "Uranus",
  name: 'Uranus',
  description:
    "Ein eisiger Gasriese, bekannt für seine einzigartige Neigung. Hat ein dünnes Ringsystem und zahlreiche Monde.",
  size: 0.339,
  distanceToOrbiting: 19220,
  orbitalSpeed: 0.0000000285,
  rotationSpeed: -0.0000968654,
  initialPosition: new THREE.Vector3(19220, 0, 0),
  planetaryTilt: 6.48,
  orbitalTilt: 0.77,
  maxDistanceToOrbiting: 3003.6 * 10 ** 6 / FINN_TO_KM, // 3,003 Milliarden km
  minDistanceToOrbiting: 2741.3 * 10 ** 6 / FINN_TO_KM, // 2,741 Milliarden km
  orbitCenter: new THREE.Vector3(
    (((3003.6 - 2741.3) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((3003.6 + 2741.3) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(3003.6 * 2741.3) * 10 ** 5) / FINN_TO_KM,
  color: '#2e8b57'
};

export const neptuneData: AstronomicalDataset = {
  title: "Neptun",
  name: 'Neptune',
  description:
    "Der entfernteste bekannte Planet unseres Sonnensystems. Ein blauer Gasriese mit starken Winden und Stürmen.",
  size: 0.329,
  distanceToOrbiting: 30050,
  orbitalSpeed: 0.0000000145,
  rotationSpeed: 0.0001031089,
  initialPosition: new THREE.Vector3(30050, 0, 0),
  planetaryTilt: 6.43,
  orbitalTilt: 1.77,
  maxDistanceToOrbiting: 4553.9 * 10 ** 6 / FINN_TO_KM, // 4,554 Milliarden km
  minDistanceToOrbiting: 4459.7 * 10 ** 6 / FINN_TO_KM, // 4,460 Milliarden km
  orbitCenter: new THREE.Vector3(
    (((4553.9 - 4459.7) / 2) * 10 ** 5) / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: (((4553.9 + 4459.7) / 2) * 10 ** 5) / FINN_TO_KM,
  semiMinorAxis: (Math.sqrt(4553.9 * 4459.7) * 10 ** 5) / FINN_TO_KM,
  color: '#4169e1'
};
/*
export const issData: AstronomicalDataset = {
  title: "Internationale Raumstation",
  description:
    "Ein bewohnbares künstliches Satellit und Mikrogravitationslabor, das in einer niedrigen Erdumlaufbahn kreist.",
  size: 0.00073,
  distanceToOrbiting: 0.00281,
  orbitalSpeed: 0.0001066667,
  rotationSpeed: 0,
  initialPosition: new THREE.Vector3(1000.00281, 0, 0),
  planetaryTilt: 51.6,
  maxDistanceToOrbiting: 420 * 10**3 / FINN_TO_KM, // 420 Tausend km
  minDistanceToOrbiting: 420 * 10**3 / FINN_TO_KM, // 420 T
};
*/

export const plutoData: AstronomicalDataset = {
  title: "Pluto",
  name: "Pluto",
  description:
    "Ein kleiner, eisiger Zwergplanet am Rand unseres Sonnensystems, bekannt für seine elliptische Umlaufbahn.",
  size: 0.186, // Größe in Finn
  distanceToOrbiting: 5900, // Durchschnittliche Entfernung zur Sonne in Finn
  orbitalSpeed: 0.0000004745,
  rotationSpeed: 0.0000027134,
  initialPosition: new THREE.Vector3(5900, 0, 0),
  planetaryTilt: 122.5,
  orbitalTilt: 17.16,
  maxDistanceToOrbiting: 7375.93 * 10 ** 6 / FINN_TO_KM,
  minDistanceToOrbiting: 4444.45 * 10 ** 6 / FINN_TO_KM,
  orbitCenter: new THREE.Vector3(
    ((7375.93 - 4444.45) / 2) * 10 ** 6 / FINN_TO_KM,
    0,
    0
  ),
  semiMajorAxis: ((7375.93 + 4444.45) / 2) * 10 ** 6 / FINN_TO_KM,
  semiMinorAxis: Math.sqrt(7375.93 * 4444.45) * 10 ** 6 / FINN_TO_KM,
  color: '#a6a6a6'
};

export const ioData: AstronomicalDataset = {
  title: "Io",
  name: "Io",
  description:
    "Der innerste und geologisch aktivste Mond des Jupiter, bekannt für seine zahlreichen Vulkane.",
  size: 0.286, // in Finn
  distanceToOrbiting: 0.422,
  orbitalSpeed: 0.00004205,
  rotationSpeed: 0.00004205, // Synchron mit der Umlaufzeit
  initialPosition: new THREE.Vector3(0.422, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0.05,
  semiMajorAxis: 421.8 * 10 ** 3 / FINN_TO_KM,  // Durchschnittliche Orbitalentfernung in Finn
  semiMinorAxis: 421.8 * 10 ** 3 * 0.99 / FINN_TO_KM,  // Leicht reduziert für Exzentrizität
  maxDistanceToOrbiting: 421.8 * 10 ** 3 / FINN_TO_KM * 1.002,  // leicht erhöhte maximale Entfernung
  minDistanceToOrbiting: 421.8 * 10 ** 3 / FINN_TO_KM * 0.998,  // leicht reduzierte minimale Entfernung
  orbitCenter: new THREE.Vector3(0, 0, 0), // Jupiter als Zentrum
  color: '#ff4500'
};

export const europaData: AstronomicalDataset = {
  title: "Europa",
  name: "Europa",
  description:
    "Ein eisbedeckter Mond mit einem möglichen unterirdischen Ozean, was ihn zu einem Kandidaten für außerirdisches Leben macht.",
  size: 0.245, // in Finn
  distanceToOrbiting: 0.671,
  orbitalSpeed: 0.00002957,
  rotationSpeed: 0.00002957, // Synchron
  initialPosition: new THREE.Vector3(0.671, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0.47,
  semiMajorAxis: 671 * 10 ** 3 / FINN_TO_KM,
  semiMinorAxis: 671 * 10 ** 3 * 0.99 / FINN_TO_KM,
  maxDistanceToOrbiting: 671 * 10 ** 3 / FINN_TO_KM * 1.002,
  minDistanceToOrbiting: 671 * 10 ** 3 / FINN_TO_KM * 0.998,
  orbitCenter: new THREE.Vector3(0, 0, 0),
  color: '#add8e6'
};

export const ganymedData: AstronomicalDataset = {
  title: "Ganymed",
  name: "Ganymede",
  description:
    "Der größte Mond im Sonnensystem und größer als der Planet Merkur.",
  size: 0.413, // in Finn
  distanceToOrbiting: 1.070,
  orbitalSpeed: 0.00001980,
  rotationSpeed: 0.00001980, // Synchron
  initialPosition: new THREE.Vector3(1.070, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0.20,
  semiMajorAxis: 1070 * 10 ** 3 / FINN_TO_KM,
  semiMinorAxis: 1070 * 10 ** 3 * 0.99 / FINN_TO_KM,
  maxDistanceToOrbiting: 1070 * 10 ** 3 / FINN_TO_KM * 1.002,
  minDistanceToOrbiting: 1070 * 10 ** 3 / FINN_TO_KM * 0.998,
  orbitCenter: new THREE.Vector3(0, 0, 0),
  color: '#808080'
};

export const callistoData: AstronomicalDataset = {
  title: "Kallisto",
  name: "Callisto",
  description:
    "Ein stark verkraterter und alter Mond, der äußere der vier Galileischen Monde, mit einer dichten Eiskruste.",
  size: 0.378, // in Finn
  distanceToOrbiting: 1.883,
  orbitalSpeed: 0.00001372,
  rotationSpeed: 0.00001372, // Synchron
  initialPosition: new THREE.Vector3(1.883, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0.28,
  semiMajorAxis: 1883 * 10 ** 3 / FINN_TO_KM,
  semiMinorAxis: 1883 * 10 ** 3 * 0.99 / FINN_TO_KM,
  maxDistanceToOrbiting: 1883 * 10 ** 3 / FINN_TO_KM * 1.002,
  minDistanceToOrbiting: 1883 * 10 ** 3 / FINN_TO_KM * 0.998,
  orbitCenter: new THREE.Vector3(0, 0, 0),
  color: '#a9a9a9'
};

export const enceladusData: AstronomicalDataset = {
  title: "Enceladus",
  name: "Enceladus",
  description: "Ein kleiner Mond des Saturn mit aktiven Eisvulkanen und einer möglicherweise bewohnbaren Unterwasserozean.",
  size: 0.078, // in Finn
  distanceToOrbiting: 238.02, // Durchschnittliche Entfernung in Finn
  orbitalSpeed: 0.0002191,
  rotationSpeed: 0.0002191, // Synchronrotation angenommen
  initialPosition: new THREE.Vector3(238.02, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0.019,
  maxDistanceToOrbiting: 238.02 * 1.002,
  minDistanceToOrbiting: 238.02 * 0.998,
  orbitCenter: new THREE.Vector3(0, 0, 0), // Saturn als Zentrum
  semiMajorAxis: 238.02,
  semiMinorAxis: 238.02 * 0.99,
  color: '#f0f8ff'
};


export const iapetusData: AstronomicalDataset = {
  title: "Iapetus",
  name: "Iapetus",
  description: "Ein ungewöhnlicher Mond von Saturn, bekannt für seine stark unterschiedlichen hellen und dunklen Hemisphären.",
  size: 0.143, // in Finn
  distanceToOrbiting: 3561.3,
  orbitalSpeed: 0.00004358,
  rotationSpeed: 0.00004358, // Synchronrotation angenommen
  initialPosition: new THREE.Vector3(3561.3, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 8.298,
  maxDistanceToOrbiting: 3561.3 * 1.002,
  minDistanceToOrbiting: 3561.3 * 0.998,
  orbitCenter: new THREE.Vector3(0, 0, 0), // Saturn als Zentrum
  semiMajorAxis: 3561.3,
  semiMinorAxis: 3561.3 * 0.99,
  color: '#f5f5f5'
};

export const rheaData: AstronomicalDataset = {
  title: "Rhea",
  name: "Rhea",
  description: "Der zweitgrößte Mond Sat Saturns, hauptsächlich aus Eis und Gestein zusammengesetzt.",
  size: 0.153, // in Finn
  distanceToOrbiting: 527.04,
  orbitalSpeed: 0.00007364,
  rotationSpeed: 0.00007364, // Synchronrotation angenommen
  initialPosition: new THREE.Vector3(527.04, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0.333,
  maxDistanceToOrbiting: 527.04 * 1.002,
  minDistanceToOrbiting: 527.04 * 0.998,
  orbitCenter: new THREE.Vector3(0, 0, 0), // Saturn als Zentrum
  semiMajorAxis: 527.04,
  semiMinorAxis: 527.04 * 0.99,
  color: '#d3d3d3'
};

export const titanData: AstronomicalDataset = {
  title: "Titan",
  name: "Titan",
  description: "Der größte Mond Sat Saturns und der einzige bekannte Mond mit einer dichten Atmosphäre.",
  size: 0.404, // in Finn
  distanceToOrbiting: 1221.83,
  orbitalSpeed: 0.00005812,
  rotationSpeed: 0.00005812, // Synchronrotation angenommen
  initialPosition: new THREE.Vector3(1221.83, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0.348,
  maxDistanceToOrbiting: 1221.83 * 1.002,
  minDistanceToOrbiting: 1221.83 * 0.998,
  orbitCenter: new THREE.Vector3(0, 0, 0), // Saturn als Zentrum
  semiMajorAxis: 1221.83,
  semiMinorAxis: 1221.83 * 0.99,
  color: '#f4a460'
};

export const tritonData: AstronomicalDataset = {
  title: "Triton",
  name: "Triton",
  description: "Der größte Mond von Neptun, bekannt für seine rückläufige Umlaufbahn und geologische Aktivität.",
  size: 0.212, // in Finn
  distanceToOrbiting: 354.76,
  orbitalSpeed: 0.00007391,
  rotationSpeed: 0.00007391, // Synchronrotation angenommen
  initialPosition: new THREE.Vector3(354.76, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 156.885, // Hohe Neigung aufgrund der rückläufigen Umlaufbahn
  maxDistanceToOrbiting: 354.76 * 1.002,
  minDistanceToOrbiting: 354.76 * 0.998,
  orbitCenter: new THREE.Vector3(0, 0, 0), // Neptun als Zentrum
  semiMajorAxis: 354.76,
  semiMinorAxis: 354.76 * 0.99,
  color: '#4682b4'
};

export const titaniaData: AstronomicalDataset = {
  title: "Titania",
  name: "Titania",
  description: "Der größte Mond von Uranus, gekennzeichnet durch große Canyons und eine vielfältige Oberflächenzusammensetzung.",
  size: 0.123, // in Finn
  distanceToOrbiting: 435.91,
  orbitalSpeed: 0.00003757,
  rotationSpeed: 0.00003757, // Synchronrotation angenommen
  initialPosition: new THREE.Vector3(435.91, 0, 0),
  planetaryTilt: 0,
  orbitalTilt: 0.079,
  maxDistanceToOrbiting: 435.91 * 1.002,
  minDistanceToOrbiting: 435.91 * 0.998,
  orbitCenter: new THREE.Vector3(0, 0, 0), // Uranus als Zentrum
  semiMajorAxis: 435.91,
  semiMinorAxis: 435.91 * 0.99,
  color: '#778899'
};