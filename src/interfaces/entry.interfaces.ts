import * as THREE from "three";
import { AstronomicalObject } from "./astronomicalObject.interface";
import { SimpleControl } from "../controls/simple.control";

export interface CameraEntry {
    selector: string;
    camera: THREE.PerspectiveCamera,
    control: SimpleControl
}

export interface AstronomicalEntry {
    selector: string;
    object: AstronomicalObject
}