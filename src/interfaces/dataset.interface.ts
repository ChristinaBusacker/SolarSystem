export interface AstronomicalDataset {
    title: string,
    name: string,
    description: string
    size: number,
    distanceToOrbiting: number,
    orbitalSpeed: number,
    rotationSpeed: number,
    initialPosition: THREE.Vector3,
    planetaryTilt: number,
    orbitalTilt: number,
    maxDistanceToOrbiting: number,
    minDistanceToOrbiting: number
    orbitCenter: THREE.Vector3,
    semiMajorAxis: number,
    semiMinorAxis: number,
    color: string
    denyCamera?: boolean
}