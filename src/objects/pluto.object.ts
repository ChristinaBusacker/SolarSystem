import { charonRawData, plutoRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";
import * as THREE from "three";
import { MathUtils } from "three";
import { SimpleAstronomicalBody } from "./simple-astronomical.object";

export class Pluto extends Astronomical {
    public cameraPosition = new THREE.Vector3(1, 1, 1);

    public moons = [
      new SimpleAstronomicalBody("assets/textures/1k_charon.png", "assets/normals/2k_moon.png", charonRawData, { isMoon: true }),
    ];

    constructor() {
        super(["assets/textures/2k_pluto.jpg"], "assets/normals/2k_mars.png", plutoRawData, false);
    }

    public init() {
        super.init();

        this.moons.forEach((moon) => {
          moon.orbitingParent = this;
          moon.init();

          const moonGrp = new THREE.Group();
          moonGrp.add(moon.orbitalGroup);
          moonGrp.rotateX(MathUtils.DEG2RAD * moon.data.orbitalTilt);

          this.group.add(moonGrp);
        });

        this.generateMaterials()
        this.isInit = true;
    }


    public render(delta: number, camera?: THREE.PerspectiveCamera) {
        super.render(delta);

        this.moons.forEach((moon) => {
          moon.render(delta, camera);
        });
    }
}
