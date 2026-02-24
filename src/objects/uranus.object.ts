import * as THREE from "three";
import { MathUtils } from "three";
import { uranusRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";
import { Titania } from "./titania.object";

export class Uranus extends Astronomical {
    public moons = [
        new Titania()
    ]

    constructor() {
        super(["assets/textures/2k_uranus.jpg"], "assets/normals/2k_uranus.png", uranusRawData, false);
    }

    public init() {
        super.init();
        this.generateMaterials()

        this.moons.forEach(moon => {
            moon.orbitingParent = this;
            moon.init();

            const moonGrp = new THREE.Group();
            moonGrp.add(moon.orbitalGroup);
            moonGrp.rotateX(MathUtils.DEG2RAD * moon.data.orbitalTilt);

            this.group.add(moonGrp);
        })

        this.isInit = true;
    }

    public render(delta: number, camera?: THREE.PerspectiveCamera) {
        super.render(delta);

        this.moons.forEach(moon => {
            moon.render(delta, camera);
        })
    }
}
