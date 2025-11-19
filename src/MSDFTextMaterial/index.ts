// THREE WEBGPU
import * as THREE from 'three/webgpu'
import { uv, mix, uniform, texture, fwidth, clamp, smoothstep, max, min, div, sub, add, mul, oneMinus } from 'three/tsl';

// THREE
import { Color } from 'three';
import { DomTextMetrics } from '@/MSDFText/measure';

export interface MSDFTextNodeMaterialOptions {
  transparent: boolean,
  alphaTest: number,
  isSmooth: number,
  threshold: number,
}

export class MSDFTextNodeMaterial extends THREE.NodeMaterial {
  private map: THREE.Texture // MSDF atlas texture

  constructor(options: { fontAtlas: THREE.Texture, metrics: DomTextMetrics, materialOptions?: Partial<MSDFTextNodeMaterialOptions> }) {
    super();

    
    const { fontAtlas, metrics, materialOptions } = options
    console.log(metrics)

    const defaultOptions: MSDFTextNodeMaterialOptions = {
      transparent: true,
      alphaTest: 0.01,
      threshold: 0.2,
      isSmooth: metrics.fontCssStyles.fontSize < 20 ? 1 : 0 // Default isSmooth to true if font size is <20px
  };

    /**
     * Build in properties
     */
    this.transparent = materialOptions?.transparent || defaultOptions.transparent;
    this.alphaTest = materialOptions?.alphaTest || defaultOptions.alphaTest;

    /**
     * Uniforms: basic
     */
    const opacity = uniform(metrics.fontCssStyles.opacity);
    const color = uniform(new Color(metrics.fontCssStyles.color));
    this.map = fontAtlas;

    /**
     * Uniforms small font sizes
     */
    const defaultIsSmooth = metrics.fontCssStyles.fontSize < 20 ? 1 : 0;

    const isSmooth = uniform(materialOptions?.isSmooth || defaultIsSmooth);
    const threshold = uniform(materialOptions?.threshold || defaultOptions.threshold);

    /**
     * Uniforms: stroke
     */
    // TODO: Fix stroke rendering
    const _strokeColor = new THREE.Color('#000000') // metrics.fontCssStyles.strokeColor
    const _stokeWidth = 0 // metrics.fontCssStyles.strokeWidth
    const strokeColor = uniform(_strokeColor);
    const strokeOutsetWidth = uniform(_stokeWidth);
    // const strokeInsetWidth = uniform(options.strokeInsetWidth || defaultOptions.strokeInsetWidth);

    const afwidth = 1.4142135623730951 / 2.0;
    const median = (r: THREE.Node, g: THREE.Node, b: THREE.Node) => max(min(r, g), min(max(r, g), b));

    /**
     * Texture Sampling
     */
    const s = texture(this.map, uv());

    /**
     * Fill
     */
    const sigDist = sub(median(s.r, s.g, s.b), 0.5);
    let alpha = clamp(add(div(sigDist, fwidth(sigDist)), 0.5), 0.0, 1.0);

    /**
     * Fill Smooth
     */
    const smoothAlpha = smoothstep(sub(threshold, afwidth), add(threshold, afwidth), sigDist);
    alpha = mix(alpha, smoothAlpha, isSmooth);

    /**
     * Strokes
     */
    const sigDistOutset = add(sigDist, mul(strokeOutsetWidth, 0.5));
    const sigDistInset = add(sigDist, mul(strokeOutsetWidth, 0.5));

    let outset = clamp(add(div(sigDistOutset, fwidth(sigDistOutset)), 0.5), 0.0, 1.0);
    let inset = oneMinus(clamp(add(div(sigDistInset, fwidth(sigDistInset)), 0.5), 0.0, 1.0));

    /**
     * Strokes Smooth
     */
    const smoothOutset = smoothstep(sub(threshold, afwidth), add(threshold, afwidth), sigDistOutset);
    const smoothInset = oneMinus(smoothstep(sub(threshold, afwidth), add(threshold, afwidth), sigDistInset));

    outset = mix(outset, smoothOutset, isSmooth);
    inset = mix(inset, smoothInset, isSmooth);

    const border = mul(outset, inset);

    /**
     * Outputs: filled
     */
    // this.colorNode = this.color;
    // this.opacityNode = mul(this.opacity, alpha);

    /**
     * Outputs: stroked
     */
    // this.colorNode = this.strokeColor;
    // this.opacityNode = mul(this.opacity, border);

    /**
     * Outputs: Filled + stroked
     */
    this.colorNode = mix(color, strokeColor, border);
    this.opacityNode = mul(opacity, add(alpha, border));
  }
}
