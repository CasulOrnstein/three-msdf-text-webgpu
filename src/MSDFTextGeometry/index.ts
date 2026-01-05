import * as THREE from "three/webgpu";

import type { BMFontJSON } from "@/types/bmfont-json";
import { collectDomTextMetrics, TextStyles, type DomTextMetrics } from "@/MSDFText/measure";
import { layoutText } from "./layout";
import { buildGeometryAttributes } from "./geometry";

export interface MSDFTextGeometryOptions {
  font: BMFontJSON;
  metrics: DomTextMetrics
}

export class MSDFTextGeometry extends THREE.BufferGeometry {
  private width!: number;
  private height!: number;
  private verticalAlign: 'top' | 'center' | 'bottom' = 'top';
  private textAlign: 'left' | 'center' | 'right' | 'start' | 'end' = 'left';

  private currentMetrics!: DomTextMetrics // Metrics last used to generate the geometry
  private currentGlyphCount: number | null = null
  private font: BMFontJSON

  get textStyles(): Omit<Partial<TextStyles>, 'color' | 'opacity'> {
    const { opacity, color, ...geometryStyles } = this.currentMetrics?.fontCssStyles || {}
    return geometryStyles
  }
  get text(): string {
    return this.currentMetrics?.text
  }

  constructor(options: MSDFTextGeometryOptions) {
    super();

    this.font = options.font;
    this.update(options.metrics)
  }

  computeBoundingBox(): void {
    const xOffset = this.textAlign === 'center' ? -this.width / 2 : (this.textAlign === 'right' || this.textAlign === 'end') ? -this.width : 0;
    const yOffset = this.verticalAlign === 'center' ? -this.height / 2 : this.verticalAlign === 'top' ? -this.height : 0;

    this.boundingBox = new THREE.Box3(
      new THREE.Vector3(xOffset, yOffset, 0),
      new THREE.Vector3(xOffset + this.width, yOffset + this.height, 0)
    )
  }

  public update(metrics: DomTextMetrics) {
    // TODO: Compare against previously given metrics before recalculating
    const { glyphs, width, height } = layoutText({ metrics, font: this.font });
    const { positions, uvs, centers, indices, glyphIndices, glyphCount } = buildGeometryAttributes({ glyphs, font: this.font, flipY: true })

    this.width = width;
    this.height = height;
    this.verticalAlign = metrics.fontCssStyles.verticalAlign;
    this.textAlign = metrics.fontCssStyles.textAlign;

    // If number of glyphs is the same, attr array lengths are the same and can update in place
    // Slightly more efficient as reuses existing GPU buffer
    if (this.currentGlyphCount == glyphCount) {
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
    this.currentGlyphCount = glyphCount
  }
} 