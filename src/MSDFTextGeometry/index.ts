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

  private currentMetrics: DomTextMetrics | null = null // Metrics last used to generate the geometry
  private font: BMFontJSON
  
  constructor(options: MSDFTextGeometryOptions) {
    super();

    this.font = options.font;
    this.update(options.metrics)
  }

  computeBoundingBox(): void {
    this.boundingBox = new THREE.Box3(
      new THREE.Vector3(0,-this.height,0), // Text anchored from top left, bounding box anchored from bottom left
      new THREE.Vector3(this.width, 0, 0)
    )
  }

  public update(metrics: DomTextMetrics) {
    // TODO: Compare against previously given metrics before recalculating    
    const { glyphs, width, height } = layoutText({ metrics, font: this.font });
    const { positions, uvs, centers, indices, glyphIndices } = buildGeometryAttributes({ glyphs, font: this.font, flipY: true })
  
    this.width = width;
    this.height = height;

    // If number of glyphs is the same, attr array lengths are the same and can update in place
    // Slightly more efficient as reuses existing GPU buffer
    if (this.currentMetrics?.text.length == metrics.text.length) {
      this.attributes.position.array.set(positions)
      this.attributes.uv.array.set(uvs)
      this.attributes.center.array.set(centers)

      this.attributes.position.needsUpdate = true;
      this.attributes.uv.needsUpdate = true;
      this.attributes.center.needsUpdate = true;
    } else {
      this.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      this.setAttribute('center', new THREE.BufferAttribute(centers, 2));
      this.setAttribute('glyphIndices', new THREE.BufferAttribute(glyphIndices, 1));
      this.setIndex(new THREE.BufferAttribute(indices, 1));
    }

    this.computeBoundingBox();
    this.computeBoundingSphere();

    // Cache the previous metrics used to generate the geometry
    this.currentMetrics = metrics
  }

  // Update text only while reusing existing styles
  public updateText(text: string) {
    if (!this.currentMetrics) {
      console.warn("Unable to update text of MSDFGeometry, no previous generated metrics.")
      return
    }
    const updatedMetrics: DomTextMetrics = { ...this.currentMetrics, text }
    this.update(updatedMetrics)
  }

  public updateFromDomElement(element: HTMLElement) {
    const updatedMetrics = collectDomTextMetrics(element)
    this.update(updatedMetrics)
  }
} 