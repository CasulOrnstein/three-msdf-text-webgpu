// THREE WEBGPU
import * as THREE from 'three/webgpu'
import { uv, mix, uniform, texture, fwidth, clamp, smoothstep, max, min, div, sub, add, mul, oneMinus, materialOpacity } from 'three/tsl';

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

  private colorUniform: THREE.UniformNode<THREE.Color> = uniform(new THREE.Color('#000000'))
  private isSmoothUniform: THREE.UniformNode<number> = uniform(0)
  private thresholdUniform: THREE.UniformNode<number> = uniform(0.2)

  // Getters & Setters
  public get color() { return `#${this.colorUniform.value.getHexString()}` }
  public set color(val: THREE.ColorRepresentation) { this.colorUniform.value.set(val) }

  public get isSmooth() { return Boolean(this.isSmoothUniform.value) }
  public set isSmooth(val: boolean) { this.isSmoothUniform.value = val ? 1 : 0 }

  public get threshold() { return this.thresholdUniform.value }
  public set threshold(val: number) { this.thresholdUniform.value = THREE.MathUtils.clamp(val, 0, 1) }

  constructor(options: { fontAtlas: THREE.Texture, metrics: DomTextMetrics }) {
    super();

    const { fontAtlas, metrics } = options

    // Set defaults
    this.alphaTest = 0.01
    this.transparent = true
    this.map = fontAtlas;

    this.update(metrics)


    // Set default is smooth
    const defaultIsSmooth = metrics.fontCssStyles.fontSize < 20 ? 1 : 0;
    this.isSmoothUniform.value = defaultIsSmooth

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
    const smoothAlpha = smoothstep(sub(this.thresholdUniform, afwidth), add(this.thresholdUniform, afwidth), sigDist);
    alpha = mix(alpha, smoothAlpha, this.isSmoothUniform);

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
    const smoothOutset = smoothstep(sub(this.thresholdUniform, afwidth), add(this.thresholdUniform, afwidth), sigDistOutset);
    const smoothInset = oneMinus(smoothstep(sub(this.thresholdUniform, afwidth), add(this.thresholdUniform, afwidth), sigDistInset));

    outset = mix(outset, smoothOutset, this.isSmoothUniform);
    inset = mix(inset, smoothInset, this.isSmoothUniform);

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
    this.colorNode = mix(this.colorUniform, strokeColor, border);
    this.opacityNode = mul(materialOpacity, add(alpha, border));
  }

  public update(metrics: DomTextMetrics) {
    this.colorUniform.value.set(metrics.fontCssStyles.color)
    this.opacity = metrics.fontCssStyles.opacity

    this.needsUpdate = true
  }
}
