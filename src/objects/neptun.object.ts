import { MathUtils } from "three";
import { neptuneData } from "../../data/objects.data";
import { simulationSpeed } from "../../data/settings.data";
import { coronaShader } from "../shader/corona";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";
import { Triton } from "./triton";

export class Neptun extends Astronomical {

    public moons = [
        new Triton()
    ]

    constructor() {
        super(["assets/textures/2k_neptune.jpg"], "assets/normals/2k_neptune.png", neptuneData, false);
    }

    public init() {
        super.init();


        this.moons.forEach(moon => {
            moon.orbitingParent = this;
            moon.init();

            const moonGrp = new THREE.Group();
            moonGrp.add(moon.orbitalGroup);
            moonGrp.rotateX(MathUtils.DEG2RAD * moon.data.orbitalTilt);

            this.group.add(moonGrp);
        })

        this.generateMaterials()
        this.isInit = true;
    }

    public render(delta: number, camera?: THREE.PerspectiveCamera) {
        super.render(delta);

        this.moons.forEach(moon => {
            moon.render(delta, camera);
        })
    }
}
