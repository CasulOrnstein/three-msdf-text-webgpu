import * as THREE from "three/webgpu";
import { Debug } from "./Debug";
import { Experience } from "./Experience";

export class Renderer {
  readonly instance!: THREE.WebGPURenderer;

  readonly initPromise: Promise<THREE.WebGPURenderer>;

  constructor() {
    const experience = Experience.getInstance();
    this.instance = new THREE.WebGPURenderer({ canvas: experience.canvas, antialias: true });

    this.instance.setClearColor("#211d20");
    this.instance.setSize(Experience.sizes.width, Experience.sizes.height);
    this.instance.setPixelRatio(Experience.sizes.pixelRatio);

    Debug.stats?.init(this.instance);

    this.initPromise = this.instance.init();
  }

  public resize() {
    this.instance.setSize(Experience.sizes.width, Experience.sizes.height);
    this.instance.setPixelRatio(Experience.sizes.pixelRatio);
  }

  public update() {
    this.instance.render(Experience.scene, Experience.camera.instance);
  }

  public destroy() {
    this.instance.dispose();
  }
}
