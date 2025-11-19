import * as THREE from "three/webgpu";

import type { BMFontJSON } from "@/types/bmfont-json";
import { collectDomTextMetrics, type DomTextMetrics } from "@/MSDFText/measure";
import { layoutText } from "./layout";
import { buildGeometryAttributes } from "./geometry";

export interface MSDFTextGeometryOptions {
  font: BMFontJSON;
  metrics: DomTextMetrics
}

export class MSDFTextGeometry extends THREE.BufferGeometry {
  private width!: number;
  private height!: number;

  private metrics!: DomTextMetrics
  private font: BMFontJSON
  
  constructor(options: MSDFTextGeometryOptions) {
    super();

    this.font = options.font;
    this._update(options.metrics)
  }

  computeBoundingBox(): void {
    this.boundingBox = new THREE.Box3(
      new THREE.Vector3(0,-this.height,0), // Text anchored from top left, bounding box anchored from bottom left
      new THREE.Vector3(this.width, 0, 0)
    )
  }

  private _update(metrics: DomTextMetrics) {
    // TODO: Compare against previously given metrics before recalculating    
    const { glyphs, width, height } = layoutText({ metrics, font: this.font });
    const { positions, uvs, centers, indices, glpyhIndices } = buildGeometryAttributes({ glyphs, font: this.font, flipY: true })
  
    this.width = width;
    this.height = height;

    this.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    this.setAttribute('center', new THREE.BufferAttribute(centers, 2));
    this.setAttribute('glyphIndices', new THREE.BufferAttribute(glpyhIndices, 1));
    this.setIndex(new THREE.BufferAttribute(indices, 1));

    this.computeBoundingBox();
    this.computeBoundingSphere();

    // Cache the previous metrics used to generate the geometry
    this.metrics = metrics
  }

  public updateFromDomElement(element: HTMLElement) {
    const updatedMetrics = collectDomTextMetrics(element)
    this._update(updatedMetrics)
  }
} 