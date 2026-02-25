import { AstronomicalRawData } from "../src/interfaces/dataset.interface";

export const sunRawData: AstronomicalRawData = {
    name: "Sun",
    slug: "sun",
    description: "The Sun is the central star of the Solar System and contains most of its mass. All major planets orbit around it.",
    color: "#FDB813",

    isOrbiting: false,

    diameterKm: 1392700,

    axialTiltDeg: 7.25,
    orbitalInclinationDeg: 0,

    rotationPeriodHours: 609.12,
};

export const mercuryRawData: AstronomicalRawData = {
    name: "Mercury",
    slug: "mercury",
    description: "Mercury is the smallest planet in the Solar System and the closest one to the Sun. It has no natural moons and no ring system.",
    color: "#B7B8BA",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 4879.4,

    axialTiltDeg: 0.034,
    orbitalInclinationDeg: 7.005,

    orbitalPeriodDays: 87.969,
    rotationPeriodHours: 1407.6,

    periapsisKm: 46001200,
    apoapsisKm: 69816900,

    initialOrbitPhaseDeg: 317,
};

export const venusRawData: AstronomicalRawData = {
    name: "Venus",
    slug: "venus",
    description: "Venus is the second planet from the Sun and is similar in size to Earth. It rotates retrograde and has a very dense atmosphere.",
    color: "#D9B38C",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 12103.6,

    axialTiltDeg: 177.36,
    orbitalInclinationDeg: 3.3947,

    orbitalPeriodDays: 224.701,
    rotationPeriodHours: -5832.5,

    periapsisKm: 107477000,
    apoapsisKm: 108939000,

    initialOrbitPhaseDeg: 59,
};

export const earthRawData: AstronomicalRawData = {
    name: "Earth",
    slug: "earth",
    description: "Earth is the third planet from the Sun and the only known world to support life. It has one natural satellite, the Moon.",
    color: "#4C89D9",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 12742,

    axialTiltDeg: 23.439,
    orbitalInclinationDeg: 0.00005,

    orbitalPeriodDays: 365.256,
    rotationPeriodHours: 23.9345,

    periapsisKm: 147095000,
    apoapsisKm: 152100000,

    initialOrbitPhaseDeg: 248,
};

export const moonRawData: AstronomicalRawData = {
    name: "Moon",
    slug: "moon",
    description: "The Moon is Earth's only natural satellite. It is tidally locked, so its rotation period matches its orbital period around Earth.",
    color: "#C9C9C7",

    parentSlug: "earth",
    isOrbiting: true,

    diameterKm: 3474.8,

    axialTiltDeg: 6.68,
    orbitalInclinationDeg: -5.145,

    orbitalPeriodDays: 27.3217,
    rotationPeriodHours: 655.72,

    periapsisKm: 363300,
    apoapsisKm: 405500,

    initialOrbitPhaseDeg: 133,
};

export const marsRawData: AstronomicalRawData = {
    name: "Mars",
    slug: "mars",
    description: "Mars is the fourth planet from the Sun and is known for its reddish appearance. It has two small moons, Phobos and Deimos.",
    color: "#C96A3D",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 6779,

    axialTiltDeg: 25.19,
    orbitalInclinationDeg: 1.850,

    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.6229,

    periapsisKm: 206700000,
    apoapsisKm: 249200000,

    initialOrbitPhaseDeg: 12,
};

export const jupiterRawData: AstronomicalRawData = {
    name: "Jupiter",
    slug: "jupiter",
    description: "Jupiter is the largest planet in the Solar System and a gas giant with many moons. It also has a faint ring system.",
    color: "#C9A27E",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 139820,

    axialTiltDeg: 3.13,
    orbitalInclinationDeg: 1.303,

    orbitalPeriodDays: 4332.59,
    rotationPeriodHours: 9.925,

    periapsisKm: 740595000,
    apoapsisKm: 816363000,

    initialOrbitPhaseDeg: 274,

    ringInnerRadiusKm: 92000,
    ringOuterRadiusKm: 226000,
};

export const saturnRawData: AstronomicalRawData = {
    name: "Saturn",
    slug: "saturn",
    description: "Saturn is a gas giant known for its prominent ring system. It has many moons and a low average density.",
    color: "#D8C08A",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 116460,

    axialTiltDeg: 5.51, // was 26.73, before, im unsere about it
    orbitalInclinationDeg: 2.485,

    orbitalPeriodDays: 10759.22,
    rotationPeriodHours: 10.656,

    periapsisKm: 1352550000,
    apoapsisKm: 1514490000,

    initialOrbitPhaseDeg: 198,

    ringInnerRadiusKm: 66900,
    ringOuterRadiusKm: 140180,
};

export const uranusRawData: AstronomicalRawData = {
    name: "Uranus",
    slug: "uranus",
    description: "Uranus is an ice giant with a strongly tilted rotation axis. It rotates retrograde and has a dark, narrow ring system.",
    color: "#7FD6D6",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 50724,

    axialTiltDeg: 97.77,
    orbitalInclinationDeg: 0.773,

    orbitalPeriodDays: 30688.5,
    rotationPeriodHours: -17.24,

    periapsisKm: 2741300000,
    apoapsisKm: 3003630000,

    initialOrbitPhaseDeg: 71,

    ringInnerRadiusKm: 38000,
    ringOuterRadiusKm: 51000,
};

export const neptuneRawData: AstronomicalRawData = {
    name: "Neptune",
    slug: "neptune",
    description: "Neptune is the outermost major planet and an ice giant with strong winds. It has a faint ring system and several moons.",
    color: "#4062D6",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 49244,

    axialTiltDeg: 28.32,
    orbitalInclinationDeg: 1.770,

    orbitalPeriodDays: 60182,
    rotationPeriodHours: 16.11,

    periapsisKm: 4444450000,
    apoapsisKm: 4546700000,

    initialOrbitPhaseDeg: 329,

    ringInnerRadiusKm: 41900,
    ringOuterRadiusKm: 62930,
};

export const plutoRawData: AstronomicalRawData = {
    name: "Pluto",
    slug: "pluto",
    description: "Pluto is a dwarf planet in the Kuiper Belt. It has a highly eccentric orbit and rotates retrograde.",
    color: "#B89C7A",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 2376.6,

    axialTiltDeg: 122.53,
    orbitalInclinationDeg: 17.16,

    orbitalPeriodDays: 90560,
    rotationPeriodHours: -153.293,

    periapsisKm: 4436820000,
    apoapsisKm: 7375930000,

    initialOrbitPhaseDeg: 45,
};

export const ioRawData: AstronomicalRawData = {
    name: "Io",
    slug: "io",
    description: "Io is the innermost of the four Galilean moons of Jupiter and the most volcanically active body in the Solar System. It is tidally locked to Jupiter.",
    color: "#D8C36A",

    parentSlug: "jupiter",
    isOrbiting: true,

    diameterKm: 3643.2,

    axialTiltDeg: 0.0,
    orbitalInclinationDeg: 0.05,

    orbitalPeriodDays: 1.76914,
    rotationPeriodHours: 42.4594,

    periapsisKm: 419900,
    apoapsisKm: 423400,

    initialOrbitPhaseDeg: 186,
};

export const europaRawData: AstronomicalRawData = {
    name: "Europa",
    slug: "europa",
    description: "Europa is one of Jupiter's Galilean moons and is covered by a thick ice shell. It is tidally locked and likely has a subsurface ocean.",
    color: "#CFC7B8",

    parentSlug: "jupiter",
    isOrbiting: true,

    diameterKm: 3121.6,

    axialTiltDeg: 0.1,
    orbitalInclinationDeg: 0.47,

    orbitalPeriodDays: 3.55118,
    rotationPeriodHours: 85.2283,

    periapsisKm: 665100,
    apoapsisKm: 677100,

    initialOrbitPhaseDeg: 54,
};

export const ganymedeRawData: AstronomicalRawData = {
    name: "Ganymede",
    slug: "ganymede",
    description: "Ganymede is Jupiter's largest moon and the largest moon in the Solar System. It is tidally locked and has its own intrinsic magnetic field.",
    color: "#9E9A8F",

    parentSlug: "jupiter",
    isOrbiting: true,

    diameterKm: 5268.2,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.2,

    orbitalPeriodDays: 7.154553,
    rotationPeriodHours: 171.709272,

    periapsisKm: 1069000,
    apoapsisKm: 1071800,

    initialOrbitPhaseDeg: 259,
};

export const callistoRawData: AstronomicalRawData = {
    name: "Callisto",
    slug: "callisto",
    description: "Callisto is the outermost Galilean moon of Jupiter and one of the most heavily cratered bodies in the Solar System. It is tidally locked to Jupiter.",
    color: "#7E7A73",

    parentSlug: "jupiter",
    isOrbiting: true,

    diameterKm: 4820.6,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.28,

    orbitalPeriodDays: 16.689018,
    rotationPeriodHours: 400.536432,

    periapsisKm: 1868800,
    apoapsisKm: 1896600,

    initialOrbitPhaseDeg: 9,
};

export const enceladusRawData: AstronomicalRawData = {
    name: "Enceladus",
    slug: "enceladus",
    description: "Enceladus is a small icy moon of Saturn known for its active geysers near the south pole. It is tidally locked and orbits within Saturn's E ring.",
    color: "#E8EDF2",

    parentSlug: "saturn",
    isOrbiting: true,

    diameterKm: 504.2,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.009,

    orbitalPeriodDays: 1.370218,
    rotationPeriodHours: 32.885232,

    periapsisKm: 236900,
    apoapsisKm: 239200,

    initialOrbitPhaseDeg: 301,
};

export const iapetusRawData: AstronomicalRawData = {
    name: "Iapetus",
    slug: "iapetus",
    description: "Iapetus is a moon of Saturn known for its strong brightness contrast between hemispheres and its unusual equatorial ridge. It is tidally locked to Saturn.",
    color: "#B8B0A4",

    parentSlug: "saturn",
    isOrbiting: true,

    diameterKm: 1468.6,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 15.47,

    orbitalPeriodDays: 79.3215,
    rotationPeriodHours: 1903.716,

    periapsisKm: 3459100,
    apoapsisKm: 3662500,

    initialOrbitPhaseDeg: 120,
};

export const rheaRawData: AstronomicalRawData = {
    name: "Rhea",
    slug: "rhea",
    description: "Rhea is Saturn's second-largest moon and is composed mostly of water ice. It is tidally locked and heavily cratered.",
    color: "#CFCBC4",

    parentSlug: "saturn",
    isOrbiting: true,

    diameterKm: 1527.6,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.345,

    orbitalPeriodDays: 4.518212,
    rotationPeriodHours: 108.437088,

    periapsisKm: 526600,
    apoapsisKm: 527600,

    initialOrbitPhaseDeg: 342,
};

export const titanRawData: AstronomicalRawData = {
    name: "Titan",
    slug: "titan",
    description: "Titan is Saturn's largest moon and has a dense atmosphere rich in nitrogen. It is tidally locked and has lakes of liquid hydrocarbons.",
    color: "#D2A86F",

    parentSlug: "saturn",
    isOrbiting: true,

    diameterKm: 5149.5,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.349,

    orbitalPeriodDays: 15.945421,
    rotationPeriodHours: 382.690104,

    periapsisKm: 1186700,
    apoapsisKm: 1257000,

    initialOrbitPhaseDeg: 216,
};

export const tritonRawData: AstronomicalRawData = {
    name: "Triton",
    slug: "triton",
    description: "Triton is Neptune's largest moon and likely a captured Kuiper Belt object. It orbits retrograde and is tidally locked to Neptune.",
    color: "#C9D3DC",

    parentSlug: "neptune",
    isOrbiting: true,

    diameterKm: 2706.8,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 156.865,

    orbitalPeriodDays: 5.876854,
    rotationPeriodHours: -141.044496,

    periapsisKm: 354753,
    apoapsisKm: 354765,

    initialOrbitPhaseDeg: 88,
};

export const titaniaRawData: AstronomicalRawData = {
    name: "Titania",
    slug: "titania",
    description: "Titania is the largest moon of Uranus and is composed of ice and rock. It is tidally locked to Uranus and has a heavily cratered surface with large fault valleys.",
    color: "#BFC3CC",

    parentSlug: "uranus",
    isOrbiting: true,

    diameterKm: 1576.8,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.079,

    orbitalPeriodDays: 8.706234,
    rotationPeriodHours: 208.949616,

    periapsisKm: 435430,
    apoapsisKm: 436390,

    initialOrbitPhaseDeg: 302,
};

export const phobosRawData: AstronomicalRawData = {
    name: "Phobos",
    slug: "phobos",
    description: "Phobos is the larger and innermost moon of Mars. It orbits very close to Mars and is slowly spiraling inward.",
    color: "#8E8478",

    parentSlug: "mars",
    isOrbiting: true,

    diameterKm: 22.533,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 1.093,

    orbitalPeriodDays: 0.31891,
    rotationPeriodHours: 7.65384,

    periapsisKm: 9235,
    apoapsisKm: 9517,

    initialOrbitPhaseDeg: 27,
};

export const deimosRawData: AstronomicalRawData = {
    name: "Deimos",
    slug: "deimos",
    description: "Deimos is the smaller and outer moon of Mars. It has an irregular shape and a relatively smooth, dusty surface.",
    color: "#A79B8B",

    parentSlug: "mars",
    isOrbiting: true,

    diameterKm: 12.4,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.93,

    orbitalPeriodDays: 1.26244,
    rotationPeriodHours: 30.29856,

    periapsisKm: 23455,
    apoapsisKm: 23471,

    initialOrbitPhaseDeg: 177,
};

export const oberonRawData: AstronomicalRawData = {
    name: "Oberon",
    slug: "oberon",
    description: "Oberon is the outermost major moon of Uranus and the second-largest Uranian moon. It is tidally locked and heavily cratered.",
    color: "#A9A6A1",

    parentSlug: "uranus",
    isOrbiting: true,

    diameterKm: 1522.8,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.068,

    orbitalPeriodDays: 13.463239,
    rotationPeriodHours: 323.117736,

    periapsisKm: 582703,
    apoapsisKm: 584337,

    initialOrbitPhaseDeg: 64,
};

export const mimasRawData: AstronomicalRawData = {
    name: "Mimas",
    slug: "mimas",
    description: "Mimas is a small icy moon of Saturn known for the large Herschel crater. It is tidally locked to Saturn.",
    color: "#D7D5D2",

    parentSlug: "saturn",
    isOrbiting: true,

    diameterKm: 396.4,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 1.574,

    orbitalPeriodDays: 0.942422,
    rotationPeriodHours: 22.618128,

    periapsisKm: 181902,
    apoapsisKm: 189176,

    initialOrbitPhaseDeg: 231,
};

export const dioneRawData: AstronomicalRawData = {
    name: "Dione",
    slug: "dione",
    description: "Dione is a mid-sized icy moon of Saturn with a bright, cratered surface. It is tidally locked and has a tenuous exosphere.",
    color: "#CFCBC4",

    parentSlug: "saturn",
    isOrbiting: true,

    diameterKm: 1122.8,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.028,

    orbitalPeriodDays: 2.736915,
    rotationPeriodHours: 65.68596,

    periapsisKm: 376566,
    apoapsisKm: 378226,

    initialOrbitPhaseDeg: 5,
};

export const tethysRawData: AstronomicalRawData = {
    name: "Tethys",
    slug: "tethys",
    description: "Tethys is an icy moon of Saturn with a low density and a prominent giant canyon system. It is tidally locked to Saturn.",
    color: "#DCD9D2",

    parentSlug: "saturn",
    isOrbiting: true,

    diameterKm: 1062.2,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 1.091,

    orbitalPeriodDays: 1.887802,
    rotationPeriodHours: 45.307248,

    periapsisKm: 294590,
    apoapsisKm: 294648,

    initialOrbitPhaseDeg: 155,
};

export const ceresRawData: AstronomicalRawData = {
    name: "Ceres",
    slug: "ceres",
    description: "Ceres is the largest object in the asteroid belt and is classified as a dwarf planet. It lies between the orbits of Mars and Jupiter.",
    color: "#8F8F8F",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 939.4,

    axialTiltDeg: 4.0,
    orbitalInclinationDeg: 10.594,

    orbitalPeriodDays: 1680.17,
    rotationPeriodHours: 9.07417,

    periapsisKm: 382620000,
    apoapsisKm: 445410000,

    initialOrbitPhaseDeg: 290,
};

export const charonRawData: AstronomicalRawData = {
    name: "Charon",
    slug: "charon",
    description: "Charon is Pluto's largest moon and forms a close binary-like system with Pluto. It is tidally locked to Pluto.",
    color: "#B9B6B1",

    parentSlug: "pluto",
    isOrbiting: true,

    diameterKm: 1212,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0,

    orbitalPeriodDays: 6.38723,
    rotationPeriodHours: 153.29352,

    periapsisKm: 17536,
    apoapsisKm: 17536,

    initialOrbitPhaseDeg: 11,
};

export const erisRawData: AstronomicalRawData = {
    name: "Eris",
    slug: "eris",
    description: "Eris is a dwarf planet in the scattered disc beyond Neptune. It has a highly eccentric and strongly inclined orbit.",
    color: "#CFCFCF",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 2326,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 44.04,

    orbitalPeriodDays: 203830,
    rotationPeriodHours: 25.9,

    periapsisKm: 5766000000,
    apoapsisKm: 14594000000,

    initialOrbitPhaseDeg: 67,
};

export const haumeaRawData: AstronomicalRawData = {
    name: "Haumea",
    slug: "haumea",
    description: "Haumea is a fast-spinning dwarf planet in the Kuiper Belt with an elongated shape. It also has a ring and two known moons.",
    color: "#CBBFAE",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 1595,

    axialTiltDeg: 126,
    orbitalInclinationDeg: 28.19,

    orbitalPeriodDays: 103774,
    rotationPeriodHours: 3.9155,

    periapsisKm: 5170000000,
    apoapsisKm: 7710000000,

    initialOrbitPhaseDeg: 240,

    ringInnerRadiusKm: 2250,
    ringOuterRadiusKm: 2300,
};

export const makemakeRawData: AstronomicalRawData = {
    name: "Makemake",
    slug: "makemake",
    description: "Makemake is a dwarf planet in the Kuiper Belt and one of the brightest trans-Neptunian objects. It has a moderately eccentric orbit.",
    color: "#D8C8B0",

    parentSlug: "sun",
    isOrbiting: true,

    diameterKm: 1434,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 28.96,

    orbitalPeriodDays: 112897,
    rotationPeriodHours: 22.83,

    periapsisKm: 5727300000,
    apoapsisKm: 7919600000,

    initialOrbitPhaseDeg: 314,
};

export const umbrielRawData: AstronomicalRawData = {
    name: "Umbriel",
    slug: "umbriel",
    description: "Umbriel is a dark, icy moon of Uranus and one of its major satellites. It is tidally locked and heavily cratered.",
    color: "#7F8087",

    parentSlug: "uranus",
    isOrbiting: true,

    diameterKm: 1169.4,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.128,

    orbitalPeriodDays: 4.144177,
    rotationPeriodHours: 99.460248,

    periapsisKm: 264963,
    apoapsisKm: 267037,

    initialOrbitPhaseDeg: 101,
};

export const arielRawData: AstronomicalRawData = {
    name: "Ariel",
    slug: "ariel",
    description: "Ariel is one of Uranus's major moons and has a relatively bright icy surface. It is tidally locked and shows signs of past geologic activity.",
    color: "#D9DDE3",

    parentSlug: "uranus",
    isOrbiting: true,

    diameterKm: 1157.8,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.26,

    orbitalPeriodDays: 2.520379,
    rotationPeriodHours: 60.489096,

    periapsisKm: 190671,
    apoapsisKm: 191129,

    initialOrbitPhaseDeg: 196,
};

export const mirandaRawData: AstronomicalRawData = {
    name: "Miranda",
    slug: "miranda",
    description: "Miranda is the smallest major moon of Uranus and has a patchwork surface with giant cliffs and canyons. It is tidally locked.",
    color: "#CFCFD4",

    parentSlug: "uranus",
    isOrbiting: true,

    diameterKm: 471.6,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 4.338,

    orbitalPeriodDays: 1.413479,
    rotationPeriodHours: 33.923496,

    periapsisKm: 129222,
    apoapsisKm: 129558,

    initialOrbitPhaseDeg: 285,
};

export const proteusRawData: AstronomicalRawData = {
    name: "Proteus",
    slug: "proteus",
    description: "Proteus is a large irregular moon of Neptune with a dark surface. It is tidally locked and was discovered by Voyager 2.",
    color: "#8A8C90",

    parentSlug: "neptune",
    isOrbiting: true,

    diameterKm: 420,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 0.075,

    orbitalPeriodDays: 1.122315,
    rotationPeriodHours: 26.93556,

    periapsisKm: 117588,
    apoapsisKm: 117706,

    initialOrbitPhaseDeg: 49,
};

export const nereidRawData: AstronomicalRawData = {
    name: "Nereid",
    slug: "nereid",
    description: "Nereid is an outer moon of Neptune with an unusually eccentric orbit. It is much farther out than Neptune's regular inner moons.",
    color: "#B5B7BD",

    parentSlug: "neptune",
    isOrbiting: true,

    diameterKm: 340,

    axialTiltDeg: 0,
    orbitalInclinationDeg: 7.23,

    orbitalPeriodDays: 360.1362,
    rotationPeriodHours: 11.594,

    periapsisKm: 1372300,
    apoapsisKm: 9655300,

    initialOrbitPhaseDeg: 170,
};

export const asteroidBeltZone = {
    name: "Asteroid Belt",
    slug: "asteroid-belt",
    innerRadiusKm: 329115316, // ~2.2 AU
    outerRadiusKm: 478713186, // ~3.2 AU
};

export const kuiperBeltInnerZone = {
    name: "Kuiper Belt-Inner",
    slug: "kuiper-belt-inner",
    innerRadiusKm: 4487936121, // ~30 AU
    outerRadiusKm: 6487936121, // ~55 AU
};

export const kuiperBeltOuterZone = {
    name: "Kuiper Belt-Outer",
    slug: "kuiper-belt-outer",
    innerRadiusKm: 6227882889, // ~30 AU
    outerRadiusKm: 8227882889, // ~55 AU
};