import * as THREE from "three/webgpu";

import { Sizes, Triggers as SizesTriggers } from "./utils/Sizes";
import { Time, Triggers as TimeTriggers } from "./utils/Time";
import { Camera } from "./Camera";
import { Renderer } from "./Renderer";
import { Debug } from "./Debug";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import type { BMFontJSON } from "@/types/bmfont-json";
import { MSDFText, MSDFTextOptions, SyncMSDFText } from "@/MSDFText";
import { FolderApi } from "tweakpane";
import { materialColor, materialOpacity, positionGeometry } from "three/tsl";
import { boilingLines, rainbowWave, spinText } from "./TextEffects";

type TextEffectType = 'none' | 'rainbow' | 'boiling' | 'spin'

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
  private domElement: HTMLElement = document.getElementById('test-text')!

  private msdfTextMesh!: MSDFText
  private syncMsdfTextMesh!: SyncMSDFText
  
  private msdfTextMeshBox!: THREE.BoxHelper
  private syncMsdfTextMeshBox!: THREE.BoxHelper

  public showSyncMsdfText: boolean = false
  public showBoundingBox: boolean = false
  public showDomElement: boolean = false

  private font!: Font;
  private fontAtlas!: THREE.Texture
  private noiseTexture!: THREE.Texture
  private fontLoader: FontLoader = new FontLoader();
  private textureLoader = new THREE.TextureLoader();


  public currentEffect: TextEffectType = 'none'
  private textEffectsMap: Partial<Record<TextEffectType, { positionNode?: THREE.Node, opacityNode?: THREE.Node, colorNode?: THREE.Node }>> = {}

  private standaloneMeshFolder?: FolderApi
  private domSyncMeshFolder?: FolderApi

  public msdfTextOptions: MSDFTextOptions = {
    text: "MSDF Text",
    textStyles: {
      fontSize: 32,
      widthPx: 500,
      lineHeightPx: 50,
      letterSpacingPx: 0,
      whiteSpace: 'normal'
    }
  }

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
    
      // MSDF Text Meshes
      this.msdfTextMesh = new MSDFText(this.msdfTextOptions, { atlas: this.fontAtlas, data: this.font.data as unknown as BMFontJSON })
      this.msdfTextMesh.material.side = THREE.DoubleSide
      this.msdfTextMesh.visible = !this.showSyncMsdfText
      this.msdfTextMesh.scale.set(0.01, 0.01, 1)
      this.msdfTextMesh.position.set(-1, 0, 0) // Somewhat center the text (it has a top left pivot)
      this.scene.add(this.msdfTextMesh)

      this.syncMsdfTextMesh = new SyncMSDFText(this.domElement, { atlas: this.fontAtlas, data: this.font.data as unknown as BMFontJSON })
      this.syncMsdfTextMesh.material.side = THREE.DoubleSide
      this.syncMsdfTextMesh.visible = this.showSyncMsdfText
      this.syncMsdfTextMesh.update(this.camera.instance)
      this.scene.add(this.syncMsdfTextMesh)

      // Bounding boxes
      this.msdfTextMeshBox = new THREE.BoxHelper(this.msdfTextMesh, 0xffff00,);
      this.syncMsdfTextMeshBox = new THREE.BoxHelper(this.syncMsdfTextMesh, 0xffff00,);
      this.updateBoundingBoxVisibilty()
      this.scene.add( this.msdfTextMeshBox );
      this.scene.add( this.syncMsdfTextMeshBox );

      // Text effects
      this.textEffectsMap['none'] = {}
      this.textEffectsMap['rainbow'] = rainbowWave()
      this.textEffectsMap['boiling'] = boilingLines(this.fontAtlas, this.noiseTexture)
      this.textEffectsMap['spin'] = spinText()

      // Setup Debug
      Debug.pane?.addBinding(this, 'showSyncMsdfText', { label: 'Mesh Type', options: { "DOM-Synced": true, "Standalone": false }}).on('change', (val) => {
        this.msdfTextMesh.visible = !this.showSyncMsdfText
        this.syncMsdfTextMesh.visible = this.showSyncMsdfText 
        this.updateBoundingBoxVisibilty()
        this.updateMSDFText()

        if (this.standaloneMeshFolder) {
          this.standaloneMeshFolder.hidden = this.showSyncMsdfText
        }
        if (this.domSyncMeshFolder) {
          this.domSyncMeshFolder.hidden = !this.showSyncMsdfText
        }
      })

      Debug.pane?.addBinding(this, 'showBoundingBox', { label: 'Show Bounding Box'}).on('change', () => { this.updateBoundingBoxVisibilty() })
      Debug.pane?.addBinding(this, 'currentEffect', { label: 'Shader Effect', options: { "None": 'none', "Rainbow Wave": 'rainbow', "Boiling Lines": 'boiling', "Spinning Letters": 'spin' }}).on("change", (ev) => {
        const { positionNode, opacityNode, colorNode } = this.textEffectsMap[ev.value]!
        this.msdfTextMesh.material.positionNode = positionNode || positionGeometry;
        this.msdfTextMesh.material.opacityNode = opacityNode || this.msdfTextMesh.material.defaultOpacityNode;
        this.msdfTextMesh.material.colorNode = colorNode || this.msdfTextMesh.material.defaultColorNode;
        this.msdfTextMesh.material.needsUpdate = true
        
        this.syncMsdfTextMesh.material.positionNode = positionNode || positionGeometry;
        this.syncMsdfTextMesh.material.opacityNode = opacityNode || this.msdfTextMesh.material.defaultOpacityNode;
        this.syncMsdfTextMesh.material.colorNode = colorNode || this.msdfTextMesh.material.defaultColorNode;
        this.syncMsdfTextMesh.material.needsUpdate = true
      } )
      
      this.standaloneMeshFolder = Debug.pane?.addFolder({ title: 'Standalone Text Options', hidden: this.showSyncMsdfText })
      this.standaloneMeshFolder?.addBinding(this.msdfTextOptions, 'text', { label: 'Text'}).on('change', () => this.updateMSDFText() )
      this.standaloneMeshFolder?.addBinding(this.msdfTextOptions.textStyles!, 'widthPx', { label: 'Width (px)', min: 50, max: 1000 }).on('change', () => this.updateMSDFText() )
      this.standaloneMeshFolder?.addBinding(this.msdfTextOptions.textStyles!, 'fontSize', { label: 'Font Size (px)', min: 10, max: 100 }).on('change', () => this.updateMSDFText() )
      this.standaloneMeshFolder?.addBinding(this.msdfTextOptions.textStyles!, 'lineHeightPx', { label: 'Line Height (px)', min: 10, max: 100 }).on('change', () => this.updateMSDFText() )
      this.standaloneMeshFolder?.addBinding(this.msdfTextOptions.textStyles!, 'letterSpacingPx', { label: 'Letter Spacing (px)', min: -5, max: 5 }).on('change', () => this.updateMSDFText() )
      this.standaloneMeshFolder?.addBinding(this.msdfTextOptions.textStyles!, 'whiteSpace', { label: 'Whitespace', options: { normal :'normal', pre: 'pre', nowrap: 'nowrap' } }).on('change', () => this.updateMSDFText() )
      
      this.standaloneMeshFolder?.addBinding(this.msdfTextMesh.material!, 'color', { label: 'Color' })
      this.standaloneMeshFolder?.addBinding(this.msdfTextMesh.material!, 'opacity', { label: 'Opacity', min: 0,  max: 1 })
      
      this.standaloneMeshFolder?.addBinding(this.msdfTextMesh.material!, 'isSmooth', { label: 'Is Smooth? (small text)'})
      this.standaloneMeshFolder?.addBinding(this.msdfTextMesh.material!, 'threshold', { label: 'Smoothing Threshold', min: 0, max: 1 })
    
      this.domSyncMeshFolder = Debug.pane?.addFolder({ title: 'DOM-Synced Text Options', hidden: !this.showSyncMsdfText })
      this.domSyncMeshFolder?.addBinding(this, 'showDomElement', { label: 'Show DOM Element' }).on('change', (val) => {
        if (val.value) { this.domElement.classList.add('show')
        } else { this.domElement.classList.remove('show') }
      })
      this.domSyncMeshFolder?.addButton({ title: 'Sync with DOM', label: 'Adjust the CSS props of the element in DevTools then ->' }).on("click", () => { this.updateMSDFText() })

    });
  }

  private updateMSDFText() {
    if (this.showSyncMsdfText) {
      this.syncMsdfTextMesh.update(this.camera.instance)
      this.syncMsdfTextMeshBox.update()
    } else {
      this.msdfTextMesh.update(this.msdfTextOptions)
      this.msdfTextMeshBox.update()
    }
  }

  private updateBoundingBoxVisibilty() {
    this.msdfTextMeshBox.visible = this.showBoundingBox && !this.showSyncMsdfText
    this.syncMsdfTextMeshBox.visible = this.showBoundingBox && this.showSyncMsdfText
  }

  // region: Methods
  private async init() {
    await this.renderer.initPromise;
    this.font = await this.fontLoader.loadAsync("/fonts/roboto-regular.json"),
    this.fontAtlas = await this.textureLoader.loadAsync("/fonts/roboto-regular.png")
    this.noiseTexture = await this.textureLoader.loadAsync("/seamless_perlin2_256.png")
    this.initialised = true;
  }

  private resize() {
    this.updateMSDFText()
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
