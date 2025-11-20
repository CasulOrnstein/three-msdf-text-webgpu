import { PerspectiveCamera } from "three/webgpu";
import { Experience } from "./Experience";

export class Camera {
  readonly instance!: PerspectiveCamera;

  constructor() {
    // Create camera instance
    this.instance = new PerspectiveCamera(35, Experience.sizes.width / Experience.sizes.height, 0.1, 100);
    this.instance.position.set(0, 0, 10);
    Experience.scene.add(this.instance);
  }

  public update(deltaMs: number) {
  }

  public resize() {
    this.instance.aspect = Experience.sizes.width / Experience.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  public destroy() {
    this.instance.removeFromParent();
  }
}
