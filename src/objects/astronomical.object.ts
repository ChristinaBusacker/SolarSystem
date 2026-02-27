import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import { APP } from "..";
import { PURE_BLACK_MATERIAL } from "../constant/pureBlackMaterial.constant";
import { SimpleControl } from "../controls/simple.control";
import { AstronomicalObject } from "../interfaces/astronomicalObject.interface";
import { AstronomicalDataset, AstronomicalRawData } from "../interfaces/dataset.interface";
import { AstronomicalDataParser } from "../parser/astronomical-data.parser";
import { router } from "../router/router";
import { astronomicalDisplacementShader } from "../shader/astronomical-displacement.shader";
import { astronomicalShader } from "../shader/astronomical.shader";
import { earthShader } from "../shader/earth.shader";

export class Astronomical implements AstronomicalObject {
  public data?: AstronomicalDataset;

  public texture: THREE.Texture;
  public texturePath: Array<string>;
  public material: THREE.ShaderMaterial;
  public bloomMaterial: THREE.ShaderMaterial;
  public mesh: THREE.Mesh<THREE.SphereGeometry>;
  public camera: THREE.PerspectiveCamera;
  public group = new THREE.Group();
  public marker: Line2;

  public cssObject: CSS2DObject;
  public angle = 0;
  public planetaryGroup = new THREE.Group();
  public orbitalGroup = new THREE.Group();
  public atmosphereMesh?: THREE.Mesh;
  public atmosphereMaterial?: THREE.ShaderMaterial;
  public control: SimpleControl;
  public specMap: THREE.Texture;
  public moons: Array<AstronomicalObject> = [];
  public orbitingParent?: AstronomicalObject;
  public isMoon = false;
  public displacementMap?: THREE.Texture;
  public displacementHeight?: number;

  public materials: Array<THREE.ShaderMaterial> = [];

  private initialOffset = 7000000 * 9;

  public emissive = false;

  public isInit = false;

  private orbitTrailPointCount = 0;
  private orbitTrailParams?: Float32Array;
  private orbitBaseColor = new THREE.Color();

  public constructor(
    texturePath: Array<string>,
    normalPath: string,
    data: AstronomicalRawData,
    emissive = false,
  ) {
    this.data = AstronomicalDataParser.parse(data);
    const textureLoader = new THREE.TextureLoader();
    this.texturePath = texturePath;
    this.texture = textureLoader.load(texturePath[0]);

    this.emissive = emissive;

    this.angle = this.data.isOrbiting ? this.getInitialOrbitAngle() : 0;
  }

  public initDisplacement(displacmentPath: string, height: number) {
    this.displacementHeight = height;

    const textureLoader = new THREE.TextureLoader();
    this.displacementMap = textureLoader.load(displacmentPath);
    this.displacementMap.wrapS = THREE.RepeatWrapping;
    this.displacementMap.wrapT = THREE.ClampToEdgeWrapping;

    // Heightmap sollte nicht als Farbtextur behandelt werden
    this.displacementMap.colorSpace = THREE.NoColorSpace;

    // Optional sinnvoll
    this.displacementMap.minFilter = THREE.LinearMipmapLinearFilter;
    this.displacementMap.magFilter = THREE.LinearFilter;
  }

  private getInitialOrbitAngle(): number {
    const a = Math.abs(this.data.semiMajorAxis);
    const b = Math.abs(this.data.semiMinorAxis);

    if (a <= 0 || b <= 0) return 0;

    const normalizedX = THREE.MathUtils.clamp(this.data.initialPosition.x / a, -1, 1);
    const normalizedZ = THREE.MathUtils.clamp(this.data.initialPosition.z / b, -1, 1);
    const angle = Math.atan2(normalizedZ, normalizedX);

    return Number.isFinite(angle) ? angle : 0;
  }

  public addMarker(a: number, b: number): Line2 {
    const orbitCurve = new THREE.EllipseCurve(0, 0, a, b, 0, 2 * Math.PI, false, 0);

    // Higher tessellation noticeably reduces the apparent wobble of Line2 on
    // projected ellipses. We keep planet orbits very dense and moons a bit lighter.
    const approxCirc = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
    const minSegments = this.isMoon ? 768 : 2048;
    const maxSegments = this.isMoon ? 4096 : 16384;
    const byCircumference = Math.ceil(approxCirc * 0.12);
    const byAngleStep = Math.ceil((Math.PI * 2) / 0.0035); // ~0.2° per segment
    const segments = Math.max(
      minSegments,
      Math.min(maxSegments, Math.max(byCircumference, byAngleStep)),
    );

    const points = orbitCurve.getPoints(segments);

    const positions: number[] = [];
    const colorCarrier: number[] = [];
    const pointCount = points.length;

    // We use vertex colors as a static carrier for the normalized orbit parameter t.
    // The actual trail fade gets updated per-frame by tinting the segment colors.
    for (let i = 0; i < pointCount; i++) {
      const p = points[i];
      const t = i / Math.max(1, pointCount - 1);
      positions.push(p.x, 0, p.y);
      colorCarrier.push(t, t, t);
    }

    const geometry = new LineGeometry();

    geometry.setPositions(positions);
    geometry.setColors(colorCarrier);

    const material = new LineMaterial({
      color: new THREE.Color(this.data.color),
      linewidth: 2,
      transparent: true,
      opacity: 1,
      depthTest: true,
      depthWrite: false,
      vertexColors: true,
      alphaToCoverage: false,
      blending: THREE.NormalBlending,
    });

    material.onBeforeCompile = shader => {
      const target = "gl_FragColor = vec4( diffuseColor.rgb, alpha );";

      if (!shader.fragmentShader.includes(target)) {
        console.warn("[OrbitTrail] Shader patch not applied (gl_FragColor target not found)");
        return;
      }

      shader.fragmentShader = shader.fragmentShader.replace(
        target,
        `
    // diffuseColor.rgb wurde durch #include <color_fragment> bereits mit Vertex-Farbe multipliziert.
    // Diese Vertex-Farbe ist bei uns die Trail-Maske (1 = sichtbar, 0 = unsichtbar).
    float diffuseMax = max(diffuse.r, max(diffuse.g, diffuse.b));
    float shadedMax = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));

    // Maske aus dem "abgedunkelten" RGB zurückgewinnen
    float trailAlpha = (diffuseMax > 1e-5) ? clamp(shadedMax / diffuseMax, 0.0, 1.0) : 1.0;

    // Orbit-Farbe behalten (nicht schwarz werden lassen)
    gl_FragColor = vec4(diffuse, alpha * trailAlpha);
    `,
      );
    };

    const viewport = document.getElementById("scene-root");
    const rect = viewport?.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect?.width ?? window.innerWidth));
    const h = Math.max(1, Math.floor(rect?.height ?? window.innerHeight));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    material.resolution.set(Math.floor(w * dpr), Math.floor(h * dpr));

    const line = new Line2(geometry, material);
    line.computeLineDistances();
    line.frustumCulled = false;

    this.orbitTrailPointCount = pointCount;
    this.orbitTrailParams = new Float32Array(pointCount);
    for (let i = 0; i < pointCount; i++) {
      this.orbitTrailParams[i] = i / Math.max(1, pointCount - 1);
    }
    this.orbitBaseColor.set(this.data.color);
    this.updateOrbitTrailColors();

    return line;
  }

  private updateOrbitTrailColors(): void {
    if (!this.marker || !this.orbitTrailParams || this.orbitTrailPointCount < 2) return;

    const geometry = this.marker.geometry as unknown as THREE.InstancedBufferGeometry;
    const cStart = geometry.getAttribute("instanceColorStart") as
      | THREE.InterleavedBufferAttribute
      | undefined;
    const cEnd = geometry.getAttribute("instanceColorEnd") as
      | THREE.InterleavedBufferAttribute
      | undefined;
    if (!cStart || !cEnd) return;

    const pointCount = this.orbitTrailPointCount;

    const route = router.getCurrent();
    const selectedBodyName =
      route.name === "planet" ? route.planet : route.name === "moon" ? route.moon : null;
    const hideTrailForSelected =
      !!selectedBodyName &&
      (selectedBodyName === this.data.slug || selectedBodyName === this.data.name);

    if (hideTrailForSelected) {
      for (let seg = 0; seg < pointCount - 1; seg++) {
        cStart.setXYZW(seg, 0, 0, 0, 0);
        cEnd.setXYZW(seg, 0, 0, 0, 0);
      }
      cStart.data.needsUpdate = true;
      cEnd.data.needsUpdate = true;
      return;
    }

    const current = THREE.MathUtils.euclideanModulo(this.angle, Math.PI * 2) / (Math.PI * 2);

    const visibleArc = 0.5;
    const headGap = 0;
    const headSolidArc = 0.2;

    const fadeForBehind = (d: number): number => {
      // außerhalb des Trail-Bereichs komplett unsichtbar
      const fadeStart = headGap + headSolidArc;
      const x = THREE.MathUtils.clamp((d - fadeStart) / (visibleArc - fadeStart), 0, 1);
      // 1 -> 0 smooth fade (tail only)
      return x * x * (3 - 2 * x);
    };

    for (let seg = 0; seg < pointCount - 1; seg++) {
      const t0 = this.orbitTrailParams[seg];
      const t1 = this.orbitTrailParams[seg + 1];

      // Planet motion in this app goes towards decreasing angle.
      // Use the segment midpoint so the first visible segment does not fade-in/blink.
      let tm = (t0 + t1) * 0.5;
      if (t1 < t0) tm = (tm + 0.5) % 1;

      let d = current - tm;
      if (d < 0) d += 1;

      const f = fadeForBehind(d);
      cStart.setXYZW(seg, f, f, f, f);
      cEnd.setXYZW(seg, f, f, f, f);
    }

    cStart.data.needsUpdate = true;
    cEnd.data.needsUpdate = true;
  }

  private setInitialPosition() {
    this.group.position.set(
      this.data.initialPosition.x,
      this.data.initialPosition.y,
      this.data.initialPosition.z,
    );
  }

  private initOrbit() {
    this.marker = this.addMarker(this.data.semiMajorAxis, this.data.semiMinorAxis);

    this.orbitalGroup.add(this.marker);
    this.orbitalGroup.rotateX(THREE.MathUtils.DEG2RAD * this.data.orbitalTilt);
    this.orbitalGroup.position.set(
      this.data.orbitCenter.x,
      this.data.orbitCenter.y,
      this.data.orbitCenter.z,
    );
  }

  public initCameraAndControl() {
    if (!this.data.denyCamera) {
      this.camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.01,
        90000000,
      );

      this.control = new SimpleControl(
        Math.max(this.data.size * 1.5, 0.012),
        Math.max(this.data.size * 64, 0.15),
        this.camera,
      );

      this.group.add(this.control.group);

      APP.cameraManager.addCamera(this.data.slug, this.camera, this.control);
    }
  }

  public addAtmosphere(texturePath: string, size: number) {
    const atmosphereTexture = new THREE.TextureLoader().load(texturePath);

    const { vertexShader, fragmentShader } = astronomicalShader;

    const casterOptions: any = {
      casterPosition1: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius1: { value: 0.0 },
      casterPosition2: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius2: { value: 0.0 },
      casterPosition3: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius3: { value: 0.0 },
      casterPosition4: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius4: { value: 0.0 },
    };

    const options = {
      dayTexture: { value: atmosphereTexture },
      sunPosition: { value: new THREE.Vector3(0, 0, 0) },
      lightIntensity: { value: 1.0 },
      shininess: { value: 16 },
      ...casterOptions,
    };

    this.atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ...options,
        lightColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    const atmosphereGeometry = new THREE.SphereGeometry(size / 2 + 0.0001, 128, 128); // Atmosphäre leicht größer als die Oberfläche
    this.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, this.atmosphereMaterial);

    this.materials.push(this.atmosphereMaterial);
    this.atmosphereMesh.name = this.data.name + " Atmo";

    this.planetaryGroup.add(this.atmosphereMesh);
  }

  public addInteractions() {
    const div = document.createElement("div");
    div.style.width = "5px";
    div.style.height = "5px";
    div.style.backgroundColor = this.data.color;
    div.style.border = "2px solid " + this.data.color;
    div.style.borderRadius = "50%";
    div.style.cursor = "pointer";
    div.style.opacity = "0.5";

    div.dataset.body = this.data.name;
    div.dataset.kind = this.isMoon ? "moon" : "planet";

    div.classList.add(
      "object",
      this.isMoon ? "moon" : "planet",
      this.isMoon ? this.orbitingParent.data.slug : this.data.slug,
      this.data.slug,
    );

    const p = document.createElement("p");
    p.style.color = "white";
    p.innerText = this.data.name;
    p.dataset.baseLabel = this.data.name;
    div.appendChild(p);

    div.onclick = ev => {
      ev.stopPropagation();

      if (this.isMoon) router.goMoon(this.data.slug);
      else router.goPlanet(this.data.slug);
    };

    document.body.appendChild(div);

    this.cssObject = new CSS2DObject(div);
    return this.cssObject;
  }

  public getShadowCasters() {
    const shadowCasters = this.isMoon
      ? [this.orbitingParent, ...this.orbitingParent.moons.filter(moon => moon !== this)]
      : this.moons;

    return shadowCasters.map(caster => {
      const position = new THREE.Vector3();
      caster.mesh.getWorldPosition(position);

      return {
        radius: caster.data.size,
        name: caster.data.name,
        position: [position.x, position.y, position.z],
      };
    });
  }

  public generateMaterials() {
    const { vertexShader, fragmentShader } =
      this.texturePath.length < 2
        ? this.displacementMap
          ? astronomicalDisplacementShader
          : astronomicalShader
        : earthShader;

    const casterOptions: Record<string, unknown> = {
      casterPosition1: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius1: { value: 0.0 },
      casterPosition2: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius2: { value: 0.0 },
      casterPosition3: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius3: { value: 0.0 },
      casterPosition4: { value: new THREE.Vector3(0, 0, 0) },
      casterRadius4: { value: 0.0 },
    };

    const options = {
      dayTexture: { value: this.texturePath[0] ? this.texture : null },
      nightTexture: {
        value: this.texturePath[1]
          ? new THREE.TextureLoader().load(this.texturePath[1])
          : this.texturePath[0]
            ? this.texture
            : null,
      },
      sunPosition: { value: new THREE.Vector3(0, 0, 0) },
      lightIntensity: { value: 1.0 },
      specMap: { value: this.specMap },
      displacementMap: this.displacementMap ? { value: this.displacementMap } : undefined,
      displacementHeight: this.displacementMap ? { value: this.displacementHeight } : undefined,
      shininess: { value: 16 },
      ...casterOptions,
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        ...options,
        lightColor: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
    });

    this.bloomMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ...options,
        lightColor: { value: new THREE.Color(0xaaaaaa) },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
    });

    this.materials.push(this.material);
    this.materials.push(this.bloomMaterial);
    this.mesh.material = this.material;
  }

  public init() {
    const geometry = new THREE.SphereGeometry(this.data.size / 2, 64, 32);

    this.mesh = new THREE.Mesh(geometry);
    this.mesh.name = this.data.slug;
    this.group.name = this.data.slug + " Gruppe";
    this.planetaryGroup.name = this.data.slug + " planetaryGroup";
    this.orbitalGroup.name = this.data.slug + " orbitalGroup";

    this.planetaryGroup.add(this.mesh);
    this.planetaryGroup.rotateX(this.data.planetaryTilt * THREE.MathUtils.DEG2RAD * 0.5);

    this.group.add(this.addInteractions());

    this.setInitialPosition();
    this.initOrbit();
    this.initCameraAndControl();

    this.group.add(this.planetaryGroup);

    this.orbitalGroup.add(this.group);
  }

  public preBloom(): void {
    if (!this.emissive) {
      this.mesh.material = this.bloomMaterial;
      (this.marker.material as LineMaterial).color.set(0x000000);
      if (this.atmosphereMesh) {
        this.atmosphereMesh.material = PURE_BLACK_MATERIAL;
      }
    }
  }

  public postBloom(): void {
    if (!this.emissive) {
      this.mesh.material = this.material;
      (this.marker.material as LineMaterial).color.set(this.data.color);

      if (this.atmosphereMesh) {
        this.atmosphereMesh.material = this.atmosphereMaterial;
      }
    }
  }

  public render(delta: number, activeCamera?: THREE.PerspectiveCamera) {
    if (!this.isInit) return;

    if ((this.orbitingParent || this.moons.length > 0) && this.material) {
      const shadowCasters = this.getShadowCasters();

      this.materials.forEach(material => {
        const params: any = {};

        shadowCasters.forEach((caster, i) => {
          params[`casterPosition${i + 1}`] = { value: caster.position };
          params[`casterRadius${i + 1}`] = { value: caster.radius };
        });

        Object.assign(material.uniforms, params);
      });
    }

    if (this.data.isOrbiting) {
      const deltaAngle = this.data.orbitalSpeed * delta * 60 * APP.simulationSpeed;

      // Keep angle bounded to avoid precision loss over long runtimes.
      this.angle = THREE.MathUtils.euclideanModulo(this.angle - deltaAngle, Math.PI * 2);

      this.group.position.set(
        this.data.semiMajorAxis * Math.cos(this.angle),
        0,
        this.data.semiMinorAxis * Math.sin(this.angle),
      );
    }

    this.updateOrbitTrailColors();

    this.planetaryGroup.rotation.y += this.data.rotationSpeed * 60 * delta * APP.simulationSpeed;

    if (activeCamera && this.cssObject) {
      this.cssObject.lookAt(activeCamera.position);
    }
  }
}
