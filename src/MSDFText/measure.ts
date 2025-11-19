import { MSDFTextOptions } from "@/MSDFText";

export interface DomTextMetrics {
  text: string;
  fontCssStyles: TextStyles;
  canvasRenderMeasurements: CanvasRenderMeasurements
  widthPx: number;
}

interface CanvasRenderMeasurements {
  width: number;
  actualAscent: number;
  actualDescent: number;
  fontAscent: number;
  fontDescent: number;
  baselineOffsetTop: number;
  baselineOffsetBottom: number;
  lineGap: number;
}

export interface TextStyles {
  widthPx: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: CanvasTextAlign;
  whiteSpace: 'normal' | 'nowrap' | 'pre' | 'pre-wrap' | 'pre-line' | 'break-spaces';
  color: string
  opacity: number
  // TODO: Fix stroke rendering
  // strokeColor: string
  // strokeWidth: number
}

const DEFAULT_FONT_STYLES: TextStyles = {
  widthPx: 500,
  fontFamily: 'Roboto',
  fontSize: 16,
  fontWeight: '400',
  fontStyle: 'normal',
  lineHeight: 16,
  letterSpacing: 0,
  textAlign: 'left',
  whiteSpace: 'normal',
  color: '#000000',
  opacity: 1,
  // strokeColor: '#000000',
  // strokeWidth: 0,
}

let canvasContext: CanvasRenderingContext2D | null = null;

function getContext(): CanvasRenderingContext2D {
    if (canvasContext) {
        return canvasContext;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 2;
    canvasContext = canvas.getContext('2d');
    if (!canvasContext) {
        throw new Error('Unable to acquire 2D context for font measurements.');
    }
    return canvasContext;
}

function parsePx(value: string): number {
  if (value === 'normal' || value === '' || value === 'initial' || value === 'inherit') {
      return NaN;
  }
  if (value.endsWith('px')) {
      return parseFloat(value);
  }
  const numeric = parseFloat(value);
  return Number.isFinite(numeric) ? numeric : NaN;
}

function captureCssStyles(element: HTMLElement): TextStyles {
  const style = window.getComputedStyle(element);
  const { width } = element.getBoundingClientRect()

  return {
      widthPx: width,
      fontFamily: style.fontFamily,
      fontSize: parsePx(style.fontSize) || 16,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      lineHeight: computeLineHeight(style, parsePx(style.fontSize) || 16),
      letterSpacing: parseLetterSpacing(style),
      textAlign: (style.textAlign as CanvasTextAlign) || 'left',
      whiteSpace: (style.whiteSpace as TextStyles['whiteSpace']) || 'normal',
      color: style.color,
      opacity: parseFloat(style.opacity) || 1,
      // strokeColor: style.webkitTextStrokeColor,
      // strokeWidth: parseFloat(style.webkitTextStrokeWidth) || 0,
  };
}

const DEFAULT_LINE_HEIGHT_RATIO = 1.2;

function computeLineHeight(style: CSSStyleDeclaration, fontSize: number): number {
  const parsed = parsePx(style.lineHeight);
  if (Number.isFinite(parsed)) {
      return parsed;
  }
  return fontSize * DEFAULT_LINE_HEIGHT_RATIO;
}

function parseLetterSpacing(style: CSSStyleDeclaration): number {
  const raw = style.letterSpacing;
  if (!raw || raw === 'normal') {
      return 0;
  }
  return parsePx(raw) || 0;
}

function getMeasurementFromCanvas(style: TextStyles, text: string): CanvasRenderMeasurements {
  const ctx = getContext();
  ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  ctx.textAlign = style.textAlign;
  const metrics = ctx.measureText(text);

  const actualAscent = metrics.actualBoundingBoxAscent ?? 0;
  const actualDescent = metrics.actualBoundingBoxDescent ?? 0;
  const fontAscent = metrics.fontBoundingBoxAscent ?? actualAscent;
  const fontDescent = metrics.fontBoundingBoxDescent ?? actualDescent;

  const lineGap = Math.max(0, style.lineHeight - (actualAscent + actualDescent));
  const baselineOffsetTop = actualAscent + lineGap * 0.5;
  const baselineOffsetBottom = actualDescent + lineGap * 0.5;

  return {
      width: metrics.width,
      actualAscent,
      actualDescent,
      fontAscent,
      fontDescent,
      baselineOffsetTop,
      baselineOffsetBottom,
      lineGap,
  };
}

export function collectDomTextMetrics(element: HTMLElement): DomTextMetrics {
  const textStyles = captureCssStyles(element);
  const canvasRenderMeasurements = getMeasurementFromCanvas(textStyles, element.textContent);
  
  const { width } = element.getBoundingClientRect()

  return {
    text: element.textContent,
    fontCssStyles: textStyles,
    canvasRenderMeasurements,
    widthPx: width,
  }
}

export function constructDomTextMetrics(options: MSDFTextOptions): DomTextMetrics {
  const cssStyles: TextStyles = {...DEFAULT_FONT_STYLES, ...options.textStyles }
  const canvasRenderMeasurements = getMeasurementFromCanvas(cssStyles, options.text);

  return {
    text: options.text,
    fontCssStyles: cssStyles,
    canvasRenderMeasurements,
    widthPx: options.textStyles?.widthPx || canvasRenderMeasurements.width,
  }
}