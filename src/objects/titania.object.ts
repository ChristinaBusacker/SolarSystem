import { titaniaRawData } from "../../data/raw-object.data";
import { Astronomical } from "./astronomical.object";

export class Titania extends Astronomical {
    public isMoon = true;

    constructor() {
        super(["/assets/textures/titania.jpg"], "/assets/normals/2k_mars.png", titaniaRawData, false);
    }

    public init() {
        super.init();
        this.generateMaterials()
        this.isInit = true;
    }


    public render(delta: number) {
        super.render(delta);
    }
}
