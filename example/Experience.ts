import * as THREE from "three";

import { Sizes, Triggers as SizesTriggers } from "./utils/Sizes";
import { Time, Triggers as TimeTriggers } from "./utils/Time";
import { Camera } from "./Camera";
import { Renderer } from "./Renderer";
import { Debug } from "./Debug";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import type { BMFontJSON } from "@/types/bmfont-json";
import { MSDFText, MSDFTextOptions, SyncMSDFText } from "@/MSDFText";

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

  public msdfTextOptions: MSDFTextOptions = {
    text: "Lorem Ipsum",
    textStyles: {
      fontSize: 32,
      widthPx: 500,
      lineHeightPx: 50,
      letterSpacingPx: 0,
      whiteSpace: 'normal',
      color: '#ff0000',
      opacity: 1
    }
  }
  public showBoundingBox: boolean = false

  // region: Constructor
  constructor(readonly parentElement: HTMLElement) {
    // Singleton
    if (Experience._instance) return Experience._instance;
    Experience._instance = this;
    
    this.canvas.id = "threejs-canvas"
    parentElement.appendChild(this.canvas);
    this.renderer = new Renderer();    

    this.init().then(() => {
      this.debug = new Debug();
      this.camera = new Camera();
      
      this.sizes.on(SizesTriggers.Resize, () => { this.resize() });
      this.time.on(TimeTriggers.Render, (deltaMs: number) => { this.update(deltaMs) });
    
      const textElement = document.getElementById('test-text')!;
      // this.mesh = new SyncMSDFText(textElement, { atlas: this.fontAtlas, data: this.font.data as unknown as BMFontJSON })
      this.mesh = new MSDFText(this.msdfTextOptions, { atlas: this.fontAtlas, data: this.font.data as unknown as BMFontJSON })
      this.mesh.scale.set(0.01, 0.01, 0.01)
      // this.mesh.position.set
      
      // this.mesh.update(this.camera.instance)
      this.scene.add(this.mesh)

      this.meshBox = new THREE.BoxHelper( this.mesh, 0xffff00 );
      this.scene.add( this.meshBox );
      this.meshBox.visible = this.showBoundingBox

      // Setup Debug
      Debug.pane?.addBinding(this.meshBox, 'visible', { label: 'Show bounding box'})//.on('change', () => { this.meshBox.visible =  )
      Debug.pane?.addBinding(this.msdfTextOptions, 'text').on('change', () => this.updateMSDFText() )
      Debug.pane?.addBinding(this.msdfTextOptions.textStyles!, 'widthPx', { min: 50, max: 1000 }).on('change', () => this.updateMSDFText() )
      Debug.pane?.addBinding(this.msdfTextOptions.textStyles!, 'fontSize', { min: 10, max: 100 }).on('change', () => this.updateMSDFText() )
      Debug.pane?.addBinding(this.msdfTextOptions.textStyles!, 'lineHeightPx', { min: 10, max: 100 }).on('change', () => this.updateMSDFText() )
      Debug.pane?.addBinding(this.msdfTextOptions.textStyles!, 'lineHeightPx', { min: 10, max: 100 }).on('change', () => this.updateMSDFText() )
      Debug.pane?.addBinding(this.msdfTextOptions.textStyles!, 'letterSpacingPx', { min: -5, max: 5 }).on('change', () => this.updateMSDFText() )
      Debug.pane?.addBinding(this.msdfTextOptions.textStyles!, 'whiteSpace', { options: { normal :'normal', pre: 'pre', nowrap: 'nowrap' } }).on('change', () => this.updateMSDFText() )
      
      // Debug.pane?.addBinding(this.msdfTextOptions.textStyles!, 'color').on('change', () => this.updateMSDFText() )
      // Debug.pane?.addBinding(this.msdfTextOptions.textStyles!, 'opacity', { min: 0,  max: 1 }).on('change', () => this.updateMSDFText() )
    });
  }

  private updateMSDFText() {
    this.mesh.update(this.msdfTextOptions)
    this.meshBox.update()
  }

  // region: Methods
  private async init() {
    await this.renderer.initPromise;
    this.font = await this.fontLoader.loadAsync("/fonts/roboto-regular.json"),
    this.fontAtlas = await this.textureLoader.loadAsync("/fonts/roboto-regular.png")
    this.initialised = true;
  }

  private resize() {
    // this.mesh.update(this.camera.instance)
    this.meshBox.update()
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
