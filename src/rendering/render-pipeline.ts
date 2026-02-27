import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

import { mixPassShader } from "../shader/mixpass.shader";

export type RenderPipelineInit = {
  camera: THREE.Camera;
  width: number;
  height: number;
  dpr: number;
  bloomStrength: number;
  bloomRadius: number;
  bloomThreshold: number;
};

/**
 * Wrapper around EffectComposer + postprocessing passes.
 *
 * Keeps Application focused on orchestration instead of pass wiring.
 * Rendering logic is intentionally conservative (no behavior changes).
 */
export class RenderPipeline {
  public readonly bloomComposer: EffectComposer;
  public readonly finalComposer: EffectComposer;

  private renderPass?: RenderPass;
  private smaaPass?: SMAAPass;

  private lastDpr = 1;

  public constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
  ) {
    this.bloomComposer = new EffectComposer(this.renderer);
    this.finalComposer = new EffectComposer(this.renderer);
  }

  public init(cfg: RenderPipelineInit): void {
    const { width, height, dpr } = cfg;

    this.lastDpr = dpr;

    // Reset passes if init is called again.
    this.bloomComposer.passes.length = 0;
    this.finalComposer.passes.length = 0;

    this.renderPass = new RenderPass(this.scene, cfg.camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      cfg.bloomStrength,
      cfg.bloomRadius,
      cfg.bloomThreshold,
    );

    this.bloomComposer.addPass(this.renderPass);
    this.bloomComposer.addPass(bloomPass);
    this.bloomComposer.renderToScreen = false;

    const { vertexShader, fragmentShader } = mixPassShader;

    const mixPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture },
        },
        vertexShader,
        fragmentShader,
        defines: {},
      }),
      "baseTexture",
    );
    mixPass.needsSwap = true;

    const outputPass = new OutputPass();

    this.smaaPass = new SMAAPass();
    this.smaaPass.setSize(Math.floor(width * dpr), Math.floor(height * dpr));

    this.finalComposer.addPass(this.renderPass);
    this.finalComposer.addPass(mixPass);
    this.finalComposer.addPass(this.smaaPass);
    this.finalComposer.addPass(outputPass);

    this.setPixelRatio(dpr);
    this.setSize(width, height);
  }

  public setCamera(camera: THREE.Camera): void {
    if (!this.renderPass) return;
    this.renderPass.camera = camera;
  }

  public setPixelRatio(dpr: number): void {
    this.lastDpr = dpr;
    this.bloomComposer.setPixelRatio?.(dpr);
    this.finalComposer.setPixelRatio?.(dpr);
  }

  public setSize(width: number, height: number): void {
    this.bloomComposer.setSize(width, height);
    this.finalComposer.setSize(width, height);

    this.smaaPass?.setSize(Math.floor(width * this.lastDpr), Math.floor(height * this.lastDpr));
  }

  public renderBloom(delta: number): void {
    this.bloomComposer.render(delta);
  }

  public renderFinal(delta: number): void {
    this.finalComposer.render(delta);
  }
}
