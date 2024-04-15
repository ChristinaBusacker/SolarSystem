import { AstronomicalObject } from "../interfaces/astronomicalObject.interface";
import { AstronomicalEntry } from "../interfaces/entry.interfaces";
import { Earth } from "../objects/earth.object";
import { Jupiter } from "../objects/jupiter.object";
import { Mars } from "../objects/mars.object";
import { Mercury } from "../objects/mercury.object";
import { Saturn } from "../objects/saturn.object";
import { Sun } from "../objects/sun.object";
import { Venus } from "../objects/venus.object";

export class AstronomicalManager {
    private entrys: Array<AstronomicalEntry> = [
        { selector: 'Sun', object: new Sun() },
        { selector: 'Mercury', object: new Mercury() },
        { selector: 'Venus', object: new Venus() },
        { selector: 'Earth', object: new Earth() },
        { selector: 'Mars', object: new Mars() },
        { selector: 'Jupiter', object: new Jupiter() },
        { selector: 'Saturn', object: new Saturn() }
    ]

    constructor(scene: THREE.Scene) {
        this.initObjects(scene)
    }

    private initObjects(scene: THREE.Scene) {
        this.entrys.forEach((entry) => {
            scene.add(entry.object.orbitalGroup);
        });
    }

    public getEntry(selector: string): AstronomicalEntry | undefined {
        return this.entrys.find(entry => entry.selector === selector)
    }

    public render(delta: number, camera?: THREE.PerspectiveCamera, scene?: THREE.Scene) {
        this.entrys.forEach(entry => {
            entry.object.render(delta, camera, scene)
        });
    }
}