import { BodyInfoOverride } from "../src/interfaces/bodyInfoOverride.interface";

export const astronomicalSidebarPlanetContent: Record<string, BodyInfoOverride> = {
  sun: {
    summary:
      "The Sun is the central star of the Solar System and the gravitational anchor for all major planets, dwarf planets, and countless smaller bodies. In this app it serves as the reference point for orbital layouts and system-wide scale relationships.",
    composition:
      "A G-type main-sequence star made mostly of hydrogen and helium. Energy is produced by nuclear fusion in the core, while the visible surface (photosphere) sits above deeper convective and radiative layers.",
    surfaceTemperature:
      "Photosphere temperature is about 5,500°C (the core is vastly hotter, reaching roughly 15 million°C).",
    atmosphere:
      "The Sun has a stellar atmosphere made of plasma, including the photosphere, chromosphere, and corona. The corona extends far into space and drives the solar wind.",
    facts: [
      "Contains about 99.86% of the Solar System's total mass",
      "Powered by hydrogen fusion into helium in the core",
      "Rotates differentially, faster at the equator than near the poles",
      "Its solar wind helps shape the heliosphere",
    ],
    texture: "/assets/textures/2k_sun.jpg",
  },

  mercury: {
    summary:
      "Mercury is the smallest planet in the Solar System and the closest one to the Sun. It is a dense, airless world with extreme day-night temperature differences and a heavily cratered surface.",
    composition:
      "Rocky terrestrial planet with an unusually large iron-rich core, surrounded by a thinner silicate mantle and crust. Its high metal content makes it one of the densest planets.",
    surfaceTemperature:
      "Surface temperatures vary dramatically, from about -180°C at night to around 430°C in daylight (mean values are much less useful here than on Earth).",
    atmosphere:
      "Mercury has no substantial atmosphere, only a very thin exosphere made of atoms like sodium, potassium, oxygen, and helium that are constantly replenished and lost to space.",
    facts: [
      "No natural moons and no ring system",
      "Locked in a 3:2 spin-orbit resonance with the Sun",
      "Has water ice in permanently shadowed polar craters",
      "A solar day on Mercury is much longer than its sidereal rotation period",
    ],
    texture: "/assets/textures/2k_mercury.jpg",
  },

  venus: {
    summary:
      "Venus is the second planet from the Sun and is often called Earth's twin because of its similar size. In reality it is a hostile world with crushing pressure, thick clouds, and an extreme greenhouse climate.",
    composition:
      "Rocky terrestrial planet with an iron core, silicate mantle, and crust. Much of its surface is volcanic plain, with mountains, highlands, and evidence of widespread resurfacing.",
    surfaceTemperature:
      "Average surface temperature is about 465°C, hot enough to melt lead and remarkably uniform between day and night because of the dense atmosphere.",
    atmosphere:
      "A very dense atmosphere dominated by carbon dioxide with nitrogen and sulfur compounds. Thick sulfuric acid clouds obscure the surface and trap heat efficiently.",
    facts: [
      "Rotates retrograde, opposite to most planets",
      "Its sidereal day is longer than its orbital year",
      "Surface pressure is about 92 times Earth's",
      "No natural moons and no ring system",
    ],
    texture: "/assets/textures/2k_venus_surface.jpg",
  },

  earth: {
    summary:
      "Earth is the third planet from the Sun and the only known world with stable liquid water oceans on the surface and a long-lived biosphere. In this app it works as a practical baseline for comparing planetary size, climate, and orbital timing.",
    composition:
      "Rocky terrestrial planet with an iron-nickel core, silicate mantle, and a thin crust. Its surface is shaped by plate tectonics and includes oceans, continents, mountain ranges, deserts, and polar ice caps.",
    surfaceTemperature:
      "Global mean surface temperature is about 15°C, but local conditions vary strongly by latitude, altitude, season, and weather.",
    atmosphere:
      "Primarily nitrogen and oxygen, with argon, carbon dioxide, and variable water vapor. The atmosphere supports weather, moderates temperatures, and shields the surface from harmful radiation.",
    facts: [
      "About 71% of the surface is covered by liquid water",
      "Has 1 natural satellite, the Moon",
      "Axial tilt is the main driver of seasons",
      "A strong magnetic field helps protect the atmosphere and surface",
    ],
    texture: "/assets/textures/2k_earth_daymap.jpg",
  },

  mars: {
    summary:
      "Mars is the fourth planet from the Sun and a cold desert world known for its red color, polar caps, and giant volcanoes. It is one of the most studied targets for past habitability and future human exploration.",
    composition:
      "Rocky terrestrial planet with a metallic core, silicate mantle, and basaltic crust. Iron oxide dust in the soil and atmosphere gives Mars its characteristic reddish appearance.",
    surfaceTemperature:
      "Average surface temperature is about -63°C, with large swings depending on season, latitude, and time of day.",
    atmosphere:
      "A thin atmosphere mostly made of carbon dioxide, with nitrogen and argon. It is too thin to retain much heat, and it allows frequent dust storms and strong seasonal changes.",
    facts: [
      "Has 2 small moons, Phobos and Deimos",
      "Home to Olympus Mons, the largest volcano in the Solar System",
      "Shows clear evidence that liquid water existed in the past",
      "Can experience planet-wide dust storms",
    ],
    texture: "/assets/textures/2k_mars.jpg",
  },

  jupiter: {
    summary:
      "Jupiter is the largest planet in the Solar System and a massive gas giant that strongly influences the dynamics of nearby objects. Its cloud bands and giant storms make it one of the most visually distinctive planets.",
    composition:
      "Primarily hydrogen and helium with no solid surface in the usual sense. Beneath the cloud tops, pressure increases into deep fluid layers and likely metallic hydrogen around a dense core region.",
    surfaceTemperature:
      "Cloud-top temperatures are roughly -145°C, while temperatures increase rapidly deeper inside the planet.",
    atmosphere:
      "Mostly hydrogen and helium with smaller amounts of methane, ammonia, and water vapor. The atmosphere is structured into colorful bands and hosts long-lived storms.",
    facts: [
      "Largest planet in the Solar System by diameter and mass",
      "The Great Red Spot is a giant storm larger than Earth",
      "Has a powerful magnetic field and intense radiation belts",
      "Surrounded by many moons and a faint ring system",
    ],
    texture: "/assets/textures/2k_jupiter.jpg",
  },

  saturn: {
    summary:
      "Saturn is a gas giant best known for its bright, extensive ring system. It is less dense than all other planets and has a large family of moons, including Titan and Enceladus.",
    composition:
      "Mostly hydrogen and helium, with deeper layers under extreme pressure and likely a dense core. Like Jupiter, it has no solid surface, only a transition into deeper fluid interiors.",
    surfaceTemperature:
      "Cloud-top temperatures are about -178°C on average, with warmer conditions deeper below the visible atmosphere.",
    atmosphere:
      "Dominated by hydrogen and helium with traces of methane, ammonia, and other compounds. Its atmosphere shows banding, storms, and a persistent hexagonal jet pattern near the north pole.",
    facts: [
      "Its rings are made mostly of water-ice particles",
      "Mean density is lower than that of liquid water",
      "Has a large moon system, including Titan with a dense atmosphere",
      "A hexagon-shaped jet stream persists at the north pole",
    ],
    texture: "/assets/textures/2k_saturn.jpg",
  },

  uranus: {
    summary:
      "Uranus is an ice giant with a dramatic axial tilt that makes it appear to rotate on its side. Its muted blue-green color comes from methane in the upper atmosphere.",
    composition:
      "An ice giant with a hydrogen-helium outer envelope and deeper layers rich in water, ammonia, and methane ices above a rocky core. It likely has a slushy, high-pressure interior rather than a simple layered structure.",
    surfaceTemperature:
      "Cloud-top temperatures are around -197°C, making Uranus one of the coldest planetary atmospheres in the Solar System.",
    atmosphere:
      "Mainly hydrogen and helium with methane, which absorbs red light and gives Uranus its blue-green color. The atmosphere is often visually calm but can still show storms and seasonal changes.",
    facts: [
      "Axial tilt is about 98°, so it effectively rolls around the Sun",
      "Rotates retrograde relative to most planets",
      "Has a dark, narrow ring system",
      "Hosts a family of major icy moons including Titania and Oberon",
    ],
    texture: "/assets/textures/2k_uranus.jpg",
  },

  neptune: {
    summary:
      "Neptune is the outermost major planet and a dynamic ice giant with deep blue clouds and extreme winds. It is a distant, cold world but still geologically and atmospherically active.",
    composition:
      "Ice giant with a hydrogen-helium atmosphere and deeper layers enriched in water, ammonia, and methane compounds above a rocky interior. It has no solid surface for a spacecraft to land on.",
    surfaceTemperature:
      "Cloud-top temperatures are around -201°C, with internal heat helping drive atmospheric motion.",
    atmosphere:
      "Mostly hydrogen and helium with methane, plus trace compounds that influence cloud chemistry. Neptune's atmosphere is active and supports some of the fastest winds measured on any planet.",
    facts: [
      "Fastest sustained winds in the Solar System have been observed here",
      "Radiates more internal heat than it receives from the Sun",
      "Has a faint ring system",
      "Its largest moon, Triton, orbits retrograde and is likely captured",
    ],
    texture: "/assets/textures/2k_neptune.jpg",
  },

  ceres: {
    summary:
      "Ceres is the largest object in the asteroid belt and the smallest recognized dwarf planet in the inner Solar System. It sits between Mars and Jupiter and helps bridge the gap between planets and smaller asteroids.",
    composition:
      "A differentiated body with a rocky interior and a large fraction of water ice and hydrated minerals. It may contain briny layers or remnants of an ancient subsurface ocean.",
    surfaceTemperature:
      "Typical surface temperatures are far below freezing, often around -105°C on average, with significant day-night variation.",
    atmosphere:
      "Ceres has no stable atmosphere, but it can have a very thin exosphere with traces of water vapor under certain conditions.",
    facts: [
      "Largest object in the main asteroid belt",
      "Classified as a dwarf planet",
      "Bright salt deposits are visible in Occator Crater",
      "Likely contains abundant water ice and hydrated minerals",
    ],
    texture: "/assets/textures/1k_ceres.png",
  },

  pluto: {
    summary:
      "Pluto is a dwarf planet in the Kuiper Belt and one of the best-known trans-Neptunian worlds. Despite its small size, it has a complex surface, a thin atmosphere, and a remarkably large moon system led by Charon.",
    composition:
      "A mixture of rock and volatile ices, including nitrogen, methane, and carbon monoxide ice on the surface. Pluto is internally differentiated and may preserve a subsurface ocean layer.",
    surfaceTemperature:
      "Surface temperatures are extremely low, typically around -230°C, with seasonal changes as Pluto moves along its eccentric orbit.",
    atmosphere:
      "A thin, seasonal atmosphere mostly of nitrogen with methane and carbon monoxide. It expands when Pluto is closer to the Sun and can partially collapse as it moves farther away.",
    facts: [
      "Part of the Kuiper Belt beyond Neptune",
      "Its orbit is highly eccentric and significantly inclined",
      "Charon is so large that the system behaves like a binary pair",
      "Sputnik Planitia is a vast nitrogen-ice basin",
    ],
    texture: "/assets/textures/2k_pluto.jpg",
  },

  haumea: {
    summary:
      "Haumea is a dwarf planet in the Kuiper Belt known for its rapid rotation and elongated shape. It is one of the most unusual large trans-Neptunian objects and is associated with a collisional family of icy bodies.",
    composition:
      "Likely a rocky interior with an icy outer layer, but strongly distorted by its fast spin. Its shape is not close to spherical, making it visually and physically distinct from most major bodies in the app.",
    surfaceTemperature:
      "Surface temperatures are extremely low, roughly in the range of about -240°C to -220°C depending on location and illumination.",
    atmosphere:
      "No stable atmosphere is known. Any volatiles at the surface are expected to remain frozen or escape quickly under normal conditions.",
    facts: [
      "Rotates very quickly, completing one spin in under 4 hours",
      "Has an elongated, non-spherical shape",
      "Known to have a ring system",
      "Has two known moons and a likely collisional family",
    ],
    texture: "/assets/textures/1k_haumea.png",
  },

  makemake: {
    summary:
      "Makemake is a bright dwarf planet in the Kuiper Belt and one of the larger known trans-Neptunian objects. It is farther out than Pluto and reflects a significant amount of sunlight from its icy surface.",
    composition:
      "An icy dwarf planet with surface volatiles dominated by methane ice and likely ethane and complex organic residues. Its interior is expected to contain a rock-ice mixture, though much remains uncertain.",
    surfaceTemperature:
      "Surface temperatures are extremely low, commonly near -240°C, with local variation based on sunlight and surface reflectivity.",
    atmosphere:
      "No persistent atmosphere has been confirmed. If present at all, it would be extremely tenuous and likely seasonal or patchy.",
    facts: [
      "One of the largest known dwarf planets in the Kuiper Belt",
      "Its bright surface is rich in methane ice",
      "Has one known moon",
      "Named after a creator deity from Rapa Nui tradition",
    ],
    texture: "/assets/textures/3k_makemake.jpg",
  },

  eris: {
    summary:
      "Eris is a distant dwarf planet in the scattered disc region beyond the Kuiper Belt. It follows a highly eccentric and steeply inclined orbit, spending most of its time far from the Sun.",
    composition:
      "A rock-ice dwarf planet with a bright, reflective surface likely covered by frozen volatiles such as methane. It is more massive than Pluto despite being similar in size.",
    surfaceTemperature:
      "Surface temperatures are among the coldest in the Solar System, often around -240°C or lower depending on orbital position.",
    atmosphere:
      "Eris has no known stable atmosphere at its current great distance. A transient atmosphere may form only when it moves much closer to the Sun and some surface volatiles sublimate.",
    facts: [
      "More massive than Pluto, though similar in diameter",
      "Its discovery helped trigger the modern dwarf planet classification",
      "Has a moon named Dysnomia",
      "Orbits the Sun on a highly inclined and very eccentric path",
    ],
    texture: "/assets/textures/2k_eris.png",
  },
};

export const astronomicalMoonSidebarContent: Record<string, BodyInfoOverride> = {
  moon: {
    summary:
      "The Moon is Earth's only natural satellite and the brightest object in our night sky after the Sun. In this app it is the most familiar moon and a useful baseline for comparing orbital distance, tidal locking, and cratered terrain.",
    composition:
      "Rocky body with a small iron-rich core, silicate mantle, and an anorthositic crust. Its surface is dominated by impact craters, dark basaltic maria, and bright highlands.",
    surfaceTemperature:
      "Surface temperatures vary strongly, from about -173°C during lunar night to around 127°C in direct sunlight.",
    atmosphere:
      "The Moon has no substantial atmosphere, only an extremely thin exosphere made of trace atoms such as helium, neon, argon, and sodium.",
    facts: [
      "Tidally locked to Earth, so the same side always faces us",
      "Drives most of Earth's ocean tides",
      "Its surface preserves impact history very well due to weak erosion",
      "Human missions have landed on and explored it directly",
    ],
    texture: "/assets/textures/2k_moon.jpg",
  },

  phobos: {
    summary:
      "Phobos is the larger and innermost moon of Mars, orbiting unusually close to the planet. It is an irregular, dark body that looks more like a captured asteroid than a spherical moon.",
    composition:
      "Likely a porous mix of rock and carbon-rich material with a rubble-like internal structure. Its low density suggests significant void space or weakly consolidated material.",
    surfaceTemperature:
      "Typical surface temperatures range roughly from about -112°C to -4°C depending on local time and sunlight.",
    atmosphere:
      "Phobos has no meaningful atmosphere. Any released particles quickly escape or fall back due to its very weak gravity.",
    facts: [
      "Orbits Mars faster than Mars rotates",
      "Slowly spirals inward and may eventually break apart or impact Mars",
      "Dominated by the large Stickney crater",
      "Has an irregular potato-like shape",
    ],
    texture: "/assets/textures/1k_phobos.jpg",
  },

  deimos: {
    summary:
      "Deimos is the smaller and more distant moon of Mars. It is an irregular, dark object with a smoother appearance than Phobos because loose dust softens many crater edges.",
    composition:
      "Likely composed of carbon-rich rocky material mixed with porous regolith. Its low density suggests a weakly consolidated interior or significant internal voids.",
    surfaceTemperature:
      "Surface temperatures vary widely and can range from roughly -112°C at night to around -10°C in sunlight.",
    atmosphere: "Deimos has no substantial atmosphere and cannot retain gases around its surface.",
    facts: [
      "Smaller than Phobos and farther from Mars",
      "Likely tidally locked to Mars",
      "Its craters look muted by a blanket of fine dust",
      "Probably formed from captured or impact-related material",
    ],
    texture: "/assets/textures/1k_deimos.png",
  },

  io: {
    summary:
      "Io is the innermost Galilean moon of Jupiter and the most volcanically active body in the Solar System. Its surface is constantly reshaped by eruptions, lava flows, and sulfur-rich deposits.",
    composition:
      "Rocky moon with a silicate mantle and an iron or iron-sulfide core. Strong tidal heating from Jupiter and orbital resonances drives intense internal melting and volcanism.",
    surfaceTemperature:
      "Average surface temperatures are extremely cold overall, but active volcanic hotspots can exceed 1,000°C while non-volcanic regions are far below freezing.",
    atmosphere:
      "Io has a very thin atmosphere dominated by sulfur dioxide, sustained by volcanic outgassing and frost sublimation.",
    facts: [
      "Most volcanically active body in the Solar System",
      "Heated by strong tidal forces from Jupiter and orbital resonances",
      "Surface colors come from sulfur and sulfur compounds",
      "Tidally locked, so one hemisphere always faces Jupiter",
    ],
    texture: "/assets/textures/2k_io.jpg",
  },

  europa: {
    summary:
      "Europa is one of Jupiter's Galilean moons and is famous for its bright icy surface crossed by long fractures. It is one of the top candidates for a subsurface ocean that could potentially support life.",
    composition:
      "Rocky interior covered by a global water-ice shell, with strong evidence for a salty liquid ocean beneath the ice. The interior is heated by tides from Jupiter.",
    surfaceTemperature:
      "Surface temperatures are extremely low, typically around -160°C on average, with regional variation between equator and poles.",
    atmosphere:
      "Europa has a very tenuous oxygen exosphere created when radiation breaks apart surface ice and releases molecules into space.",
    facts: [
      "Likely hides a global ocean beneath its ice shell",
      "Surface has relatively few impact craters, implying geologic renewal",
      "Tidally locked to Jupiter",
      "A major target in the search for extraterrestrial habitability",
    ],
    texture: "/assets/textures/2k_europa.jpg",
  },

  ganymede: {
    summary:
      "Ganymede is Jupiter's largest moon and the largest moon in the Solar System, even bigger than Mercury by diameter. It combines an icy surface with a differentiated interior and a unique magnetic environment.",
    composition:
      "Mixture of rock and water ice with a differentiated structure that includes a metallic core, rocky mantle, and layered ice and possible subsurface ocean regions.",
    surfaceTemperature:
      "Surface temperatures are very low, often around -160°C to -110°C depending on latitude and sunlight.",
    atmosphere:
      "Ganymede has a very thin atmosphere and exosphere, mainly oxygen with traces of other species. It is not breathable and has extremely low pressure.",
    facts: [
      "Largest moon in the Solar System",
      "Only moon known to have its own intrinsic magnetic field",
      "Shows both old dark terrain and younger grooved terrain",
      "Likely hosts a deep subsurface ocean",
    ],
    texture: "/assets/textures/2k_ganymede.jpg",
  },

  callisto: {
    summary:
      "Callisto is the outermost Galilean moon of Jupiter and one of the most heavily cratered worlds in the Solar System. Its ancient surface preserves a long record of impacts with relatively little tectonic resurfacing.",
    composition:
      "A mixture of rock and ice with a partially differentiated interior. It appears less geologically active than Io, Europa, and Ganymede, but may still host a subsurface ocean.",
    surfaceTemperature:
      "Surface temperatures are extremely cold, commonly around -139°C on average with day-night variation.",
    atmosphere:
      "Callisto has an extremely thin atmosphere/exosphere, including carbon dioxide and trace oxygen.",
    facts: [
      "One of the most heavily cratered large bodies known",
      "Outermost of Jupiter's four Galilean moons",
      "Likely tidally locked to Jupiter",
      "Possible subsurface ocean remains under study",
    ],
    texture: "/assets/textures/2k_callisto.jpg",
  },

  mimas: {
    summary:
      "Mimas is a small icy moon of Saturn best known for the enormous Herschel crater, which gives it a striking appearance. Despite its small size, it is an important object for studying Saturn's inner moon system.",
    composition:
      "Primarily water ice with a smaller fraction of rocky material. Its low density indicates an ice-rich body with a cold, rigid outer shell.",
    surfaceTemperature:
      "Surface temperatures are extremely low, often around -200°C, with distinct thermal patterns observed across the surface.",
    atmosphere: "Mimas has no substantial atmosphere and cannot retain gases at its surface.",
    facts: [
      "Known for the giant Herschel impact crater",
      "Tidally locked to Saturn",
      "Composed mostly of water ice",
      "One of Saturn's major inner moons",
    ],
    texture: "/assets/textures/1k_mimas.png",
  },

  enceladus: {
    summary:
      "Enceladus is a small icy moon of Saturn that became one of the most important ocean worlds in planetary science. Its south polar region vents water-rich plumes into space, feeding Saturn's E ring.",
    composition:
      "Ice-rich outer shell over a rocky core, with strong evidence for a global or regional subsurface salty ocean. Internal heating is driven by tidal interactions with Saturn.",
    surfaceTemperature:
      "Most of the surface is extremely cold, often below -190°C, while active fissure zones near the south pole are notably warmer.",
    atmosphere:
      "Enceladus has a very thin atmosphere, largely water vapor, sustained by active cryovolcanic plumes.",
    facts: [
      "South polar plumes eject water vapor and ice particles into space",
      "A key candidate for habitability studies",
      "Feeds material into Saturn's E ring",
      "Has a bright, highly reflective icy surface",
    ],
    texture: "/assets/textures/2k_enceladus.jpg",
  },

  tethys: {
    summary:
      "Tethys is a mid-sized icy moon of Saturn with a bright, cratered surface and dramatic tectonic features. It is a classic example of a cold, ice-dominated satellite in the Saturn system.",
    composition:
      "Mostly water ice with a relatively small rocky fraction. Its low density supports an ice-rich internal makeup with limited internal heating today.",
    surfaceTemperature:
      "Surface temperatures are typically around -187°C on average, with colder and warmer regions depending on illumination.",
    atmosphere: "Tethys has no substantial atmosphere and no stable surface pressure.",
    facts: [
      "Dominated by water ice",
      "Features Ithaca Chasma, a giant canyon system",
      "Contains the large Odysseus impact crater",
      "Tidally locked to Saturn",
    ],
    texture: "/assets/textures/1k_tethys.png",
  },

  dione: {
    summary:
      "Dione is a mid-sized moon of Saturn with a bright icy surface marked by craters and tectonic fractures. It shows evidence of past internal activity and remains an important target for icy moon studies.",
    composition:
      "Primarily water ice with a significant rocky component, likely with a differentiated internal structure. Its geology suggests it was more active in the past.",
    surfaceTemperature:
      "Surface temperatures are extremely cold, typically near -186°C with local variation.",
    atmosphere:
      "Dione has an extremely tenuous exosphere, with trace oxygen and other particles detected in its environment.",
    facts: [
      "Tidally locked to Saturn",
      "Shows bright fractured terrain and older cratered regions",
      "Likely contains a larger rocky fraction than some smaller icy moons",
      "Has a very thin exosphere",
    ],
    texture: "/assets/textures/1k_dione.png",
  },

  rhea: {
    summary:
      "Rhea is Saturn's second-largest moon and a heavily cratered icy world. It represents a large, ancient satellite with a simple but informative geologic history.",
    composition:
      "Mostly water ice with a smaller rocky interior component. The moon is likely differentiated only weakly, with an ice-rich outer structure.",
    surfaceTemperature:
      "Surface temperatures are very low, often around -174°C to -220°C depending on location and sunlight.",
    atmosphere:
      "Rhea has an extremely tenuous exosphere with trace oxygen and carbon dioxide, but no substantial atmosphere.",
    facts: [
      "Second-largest moon of Saturn",
      "Heavily cratered surface preserves ancient impacts",
      "Tidally locked to Saturn",
      "May have a very thin oxygen-carbon dioxide exosphere",
    ],
    texture: "/assets/textures/2k_rhea.jpg",
  },

  titan: {
    summary:
      "Titan is Saturn's largest moon and one of the most complex worlds in the Solar System. It has a dense atmosphere, active weather, and stable liquid lakes and seas, though they are made of hydrocarbons instead of water.",
    composition:
      "A differentiated body with a rocky core, high-pressure ice layers, and likely a subsurface water ocean beneath an icy crust. The surface includes ice bedrock, dunes, and hydrocarbon lakes.",
    surfaceTemperature:
      "Average surface temperature is about -179°C, cold enough for methane and ethane to exist as liquids.",
    atmosphere:
      "Titan has a dense atmosphere mostly of nitrogen with methane and complex organic haze. Surface pressure is higher than on Earth.",
    facts: [
      "Only moon with a dense atmosphere",
      "Has lakes and seas of liquid methane and ethane",
      "Likely hosts a subsurface water ocean",
      "Atmospheric chemistry produces thick orange haze",
    ],
    texture: "/assets/textures/2k_titan.jpg",
  },

  iapetus: {
    summary:
      "Iapetus is a moon of Saturn famous for its dramatic two-tone coloration, with one hemisphere much darker than the other. It also has a distinctive equatorial ridge that makes it geologically unusual.",
    composition:
      "Ice-rich moon with a rocky component and a heavily cratered outer shell. Surface color contrasts are shaped by dust accumulation and ice migration effects.",
    surfaceTemperature:
      "Surface temperatures vary strongly by terrain color, with dark regions warming more than bright icy regions but remaining far below freezing.",
    atmosphere: "Iapetus has no substantial atmosphere and does not retain gases near its surface.",
    facts: [
      "Known for its striking dark-bright hemispheric contrast",
      "Features an unusual equatorial ridge",
      "Tidally locked to Saturn",
      "Distant orbit compared with Saturn's inner major moons",
    ],
    texture: "/assets/textures/2k_iapetus.jpg",
  },

  miranda: {
    summary:
      "Miranda is the smallest of Uranus's major moons and has one of the strangest surfaces in the Solar System. Its patchwork terrain includes giant cliffs, faulted regions, and mixed geologic units.",
    composition:
      "Icy moon with a mixture of water ice and rock. Its unusual terrain suggests past internal activity, tectonics, and possible partial reassembly after major impacts.",
    surfaceTemperature: "Surface temperatures are extremely low, typically near -187°C on average.",
    atmosphere: "Miranda has no substantial atmosphere and no stable surface pressure.",
    facts: [
      "Smallest of Uranus's major round moons",
      "Shows giant cliffs and complex patchwork terrain",
      "Tidally locked to Uranus",
      "Likely experienced significant tectonic reshaping",
    ],
    texture: "/assets/textures/1k_miranda-0.png",
  },

  ariel: {
    summary:
      "Ariel is one of Uranus's major moons and has a relatively bright surface compared with some of its siblings. It displays extensive fault valleys and evidence of past resurfacing.",
    composition:
      "A mix of water ice and rock with a differentiated interior likely possible. Its geology indicates past tectonic and cryovolcanic activity.",
    surfaceTemperature:
      "Surface temperatures are extremely cold, generally around -213°C to -180°C depending on illumination.",
    atmosphere:
      "Ariel has no substantial atmosphere, though trace exospheric particles may exist transiently.",
    facts: [
      "One of the brightest major moons of Uranus",
      "Shows canyons, scarps, and resurfaced terrain",
      "Tidally locked to Uranus",
      "Likely experienced internal heating in the past",
    ],
    texture: "/assets/textures/1k_ariel.png",
  },

  umbriel: {
    summary:
      "Umbriel is a dark, icy moon of Uranus and one of its major satellites. Its ancient cratered surface suggests a relatively quiet geologic history compared with brighter Ariel.",
    composition:
      "Made mostly of water ice mixed with rocky material. The dark surface may include carbon-rich compounds or radiation-processed material.",
    surfaceTemperature:
      "Surface temperatures are extremely low, typically around -200°C or colder depending on location and sunlight.",
    atmosphere:
      "Umbriel has no substantial atmosphere and cannot maintain stable gases at the surface.",
    facts: [
      "Darkest of Uranus's major moons",
      "Heavily cratered and likely geologically old",
      "Tidally locked to Uranus",
      "Known for a bright ring-like feature in Wunda crater",
    ],
    texture: "/assets/textures/1k_umbriel.png",
  },

  titania: {
    summary:
      "Titania is the largest moon of Uranus and a major icy satellite with a heavily cratered but tectonically modified surface. It likely preserves evidence of internal evolution and ancient geologic activity.",
    composition:
      "A mixture of water ice and rocky material, probably with a differentiated structure. Tectonic valleys suggest past internal expansion or freezing of interior layers.",
    surfaceTemperature:
      "Surface temperatures are extremely low, generally around -203°C to -180°C depending on illumination.",
    atmosphere:
      "Titania has no substantial atmosphere, though a very thin transient exosphere may exist.",
    facts: [
      "Largest moon of Uranus",
      "Shows long fault valleys and cratered plains",
      "Tidally locked to Uranus",
      "Likely composed of roughly equal parts ice and rock",
    ],
    texture: "/assets/textures/titania.jpg",
  },

  oberon: {
    summary:
      "Oberon is the outermost major moon of Uranus and the second-largest in the Uranian system. Its surface is old and heavily cratered, with signs of tectonic modification in places.",
    composition:
      "Icy-rocky moon with a likely differentiated interior. The surface is dominated by water ice mixed with darker material and impact ejecta.",
    surfaceTemperature:
      "Surface temperatures are extremely cold, commonly around -200°C or lower depending on local sunlight conditions.",
    atmosphere:
      "Oberon has no substantial atmosphere and only a possible extremely tenuous exosphere.",
    facts: [
      "Outermost of Uranus's major moons",
      "Second-largest moon of Uranus after Titania",
      "Tidally locked to Uranus",
      "Heavily cratered with some bright impact ejecta features",
    ],
    texture: "/assets/textures/1k_oberonmap1.png",
  },

  triton: {
    summary:
      "Triton is Neptune's largest moon and one of the most intriguing icy bodies in the outer Solar System. It likely began as a Kuiper Belt object and was captured by Neptune, which explains its unusual retrograde orbit.",
    composition:
      "A mix of rock and water ice with frozen nitrogen, methane, and carbon monoxide on the surface. It likely has a differentiated interior and may contain a subsurface ocean.",
    surfaceTemperature:
      "Surface temperature is about -235°C, making Triton one of the coldest known planetary bodies with active geology.",
    atmosphere:
      "Triton has a thin atmosphere dominated by nitrogen, with trace methane. Seasonal heating can drive sublimation and surface-atmosphere exchange.",
    facts: [
      "Largest moon of Neptune",
      "Orbits Neptune retrograde, unlike regular moons",
      "Shows active geyser-like plumes and young terrain",
      "Likely a captured Kuiper Belt object",
    ],
    texture: "/assets/textures/2k_triton.jpg",
  },

  proteus: {
    summary:
      "Proteus is a large irregular moon of Neptune with a dark, heavily cratered surface. It is one of Neptune's major inner moons and was imaged in detail by Voyager 2.",
    composition:
      "Likely composed of water ice mixed with darker rocky and carbon-rich material. Its irregular shape suggests it never became fully rounded by self-gravity.",
    surfaceTemperature: "Surface temperatures are extremely low, typically near -220°C or colder.",
    atmosphere: "Proteus has no substantial atmosphere and cannot retain gases near the surface.",
    facts: [
      "Second-largest known moon of Neptune after Triton",
      "Irregular shape rather than spherical",
      "Tidally locked to Neptune",
      "Known for the large crater Pharos",
    ],
    texture: "/assets/textures/1k_proteus.png",
  },

  nereid: {
    summary:
      "Nereid is an outer moon of Neptune with a highly eccentric orbit that sets it apart from Neptune's regular inner moons. It likely records a disturbed dynamical history linked to Triton's capture.",
    composition:
      "Probably a mixture of water ice and rocky material with a darkened surface. Its exact internal structure is uncertain due to limited close-range observations.",
    surfaceTemperature:
      "Surface temperatures are extremely low, generally near -220°C and varying with its great distance from the Sun.",
    atmosphere: "Nereid has no substantial atmosphere and no stable surface pressure.",
    facts: [
      "Has one of the most eccentric orbits among large moons",
      "Orbits far from Neptune compared with inner regular moons",
      "Likely affected dynamically by Triton's capture",
      "Discovered before Voyager 2 but still poorly observed in detail",
    ],
    texture: "/assets/textures/1k_nereid.png",
  },

  charon: {
    summary:
      "Charon is Pluto's largest moon and forms a tightly coupled system with Pluto that behaves almost like a binary world. It is large relative to Pluto, making the pair one of the most balanced planet-moon systems in the Solar System.",
    composition:
      "Primarily a mix of water ice and rock, with a less volatile-rich surface than Pluto. Its geology includes tectonic fractures, craters, and broad plains.",
    surfaceTemperature:
      "Surface temperatures are extremely low, typically around -220°C to -230°C depending on season and illumination.",
    atmosphere:
      "Charon has no known stable atmosphere and only a possible extremely tenuous transient exosphere.",
    facts: [
      "Largest moon of Pluto by far",
      "Pluto and Charon are mutually tidally locked",
      "The system's barycenter lies outside Pluto",
      "Surface is dominated by water ice rather than Pluto's volatile ices",
    ],
    texture: "/assets/textures/1k_charon.png",
  },
};

export const astronomicalSidebarContent = {
  ...astronomicalMoonSidebarContent,
  ...astronomicalSidebarPlanetContent,
};
