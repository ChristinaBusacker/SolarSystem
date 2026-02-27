import * as THREE from "three";
import type { UpdateContext } from "../core/update-context";
import { AstronomicalRawData } from "../interfaces/dataset.interface";
import { Astronomical } from "./astronomical.object";

type SimpleAstronomicalBodyOptions = {
  isMoon?: boolean;
  rotateTextureHalfTurn?: boolean;
  emissive?: boolean;
};

export class SimpleAstronomicalBody extends Astronomical {
  public isMoon = false;

  private readonly rotateTextureHalfTurn: boolean;

  constructor(
    texturePath: string | string[],
    normalPath: string,
    data: AstronomicalRawData,
    options?: SimpleAstronomicalBodyOptions,
  ) {
    super(
      Array.isArray(texturePath) ? texturePath : [texturePath],
      normalPath,
      data,
      options?.emissive ?? false,
    );

    this.isMoon = !!options?.isMoon;
    this.rotateTextureHalfTurn = !!options?.rotateTextureHalfTurn;
  }

  public init(): void {
    super.init();

    if (this.rotateTextureHalfTurn) {
      this.mesh.rotation.y = (-1 * Math.PI) / 2;
    }

    this.generateMaterials();
    this.isInit = true;
  }

  public getCurrentPosition(): THREE.Vector3 | null {
    return this.group?.position?.clone() ?? null;
  }

  public render(ctx: UpdateContext): void {
    super.render(ctx);
  }
}
