import * as THREE from "three";

import { Sizes, Triggers as SizesTriggers } from "./utils/Sizes";
import { Time, Triggers as TimeTriggers } from "./utils/Time";
import { Camera } from "./Camera";
import { Renderer } from "./Renderer";
import { Debug } from "./Debug";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import type { BMFontJSON } from "@/types/bmfont-json";
import { MSDFText } from "@/MSDFText";

export class Experience {
  private static _instance: Experience | null = null;

  public static getInstance(): Experience {
    if (!Experience._instance) {
      throw new Error("Experience must be initialized with a canvas first");
    }
    return Experience._instance;
  }

  // Shorthand static properties
  static get time() { return this._instance!.time; }
  static get scene() { return this._instance!.scene; }
  static get sizes() { return this._instance!.sizes; }
  static get debug() { return this._instance!.debug; }
  static get renderer() { return this._instance!.renderer; }
  static get camera() { return this._instance!.camera; }

  // Classes independent of the experience instance
  readonly canvas = document.createElement("canvas");
  readonly scene = new THREE.Scene();
  readonly time = new Time();
  readonly sizes = new Sizes();

  // Classes dependent on the experience instance
  private debug!: Debug;
  private renderer!: Renderer;
  private camera!: Camera;

  private initialised: boolean = false;

  private mesh!: MSDFText
  private meshBox!: THREE.BoxHelper

  private font!: Font;
  private fontAtlas!: THREE.Texture
  private fontLoader: FontLoader = new FontLoader();
  private textureLoader = new THREE.TextureLoader();

  // region: Constructor
  constructor(readonly parentElement: HTMLElement, debugMode: boolean = false) {
    // Singleton
    if (Experience._instance) return Experience._instance;
    Experience._instance = this;
    
    this.canvas.id = "threejs-canvas"
    parentElement.appendChild(this.canvas);
    this.renderer = new Renderer();    

    this.init().then(() => {
      this.debug = new Debug(debugMode);
      this.camera = new Camera();
      
      this.sizes.on(SizesTriggers.Resize, () => { this.resize() });
      this.time.on(TimeTriggers.Render, (deltaMs: number) => { this.update(deltaMs) });
    
      const textElement = document.getElementById('test-text')!;
      this.mesh = MSDFText.fromDomElement(textElement, { atlas: this.fontAtlas, data: this.font.data as unknown as BMFontJSON })
      // this.mesh = MSDFText.fromString("Lorem ipsum", { atlas: this.fontAtlas, data: this.font.data as unknown as BMFontJSON })
      // this.mesh.scale.set(0.05, 0.05, 0.05)
      // this.mesh.position.set
      
      this.mesh.alignWithElement(this.camera.instance)
      this.scene.add(this.mesh)

      // this.meshBox = new THREE.BoxHelper( this.mesh, 0xffff00 );
      // this.scene.add( this.meshBox );
    });
  }

  // region: Methods
  private async init() {
    await this.renderer.initPromise;
    this.font = await this.fontLoader.loadAsync("/fonts/roboto-regular.json"),
    this.fontAtlas = await this.textureLoader.loadAsync("/fonts/roboto-regular.png")
    this.initialised = true;
  }

  private resize() {
    this.mesh.alignWithElement(this.camera.instance)
    // this.meshBox.update()
    this.camera.resize();
    this.renderer.resize();
  }

  private update(_deltaMs: number) {
    if (!this.initialised) return;

    this.debug.update();
    this.camera.update(_deltaMs);
    this.renderer.update();
  }

  public destroy() {
    this.debug.destroy();
    this.renderer.destroy();
    this.camera.destroy();
    this.scene.clear();
  }
}
