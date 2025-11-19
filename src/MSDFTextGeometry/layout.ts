import wordWrap, { type WordWrapMode } from 'word-wrapper';

import type { BMFontChar, BMFontJSON } from "@/types/bmfont-json";
import type { DomTextMetrics } from "@/MSDFText/measure";

interface LayoutOptions {
  metrics: DomTextMetrics;
  font: BMFontJSON;
}

type GlyphLookup = Map<number, BMFontChar>
type FirstCharId = number;
type SecondCharId = number;
type KerningLookup = Map<FirstCharId, Map<SecondCharId, number>>;

// Create lookup maps for glpyhs and kernings, keyed by char code
function buildGlyphAndKerningLookups(font: BMFontJSON): { glyphLookup: GlyphLookup, kerningLookup: KerningLookup } {
  const glyphLookup = new Map<number, BMFontChar>();
  const kerningLookup = new Map<number, Map<number, number>>(); // first -> second -> amount

  // Construct glyph map
  for (const glyph of font.chars) {
      glyphLookup.set(glyph.id, glyph);
  }

  const kernings = font.kernings ?? [];
  for (const { first, second, amount } of kernings) {
      if (!kerningLookup.has(first)) {
          kerningLookup.set(first, new Map<number, number>());
      }
      kerningLookup.get(first)!.set(second, amount);
  }

  return { glyphLookup, kerningLookup };
}

function getKerningAmount(kerningLookup: KerningLookup, left: BMFontChar | null, right: BMFontChar | null): number {
  if (!left || !right) return 0;
  const row = kerningLookup.get(left.id);
  if (!row) return 0;
  return row.get(right.id) ?? 0;
}

// Measure function for word-wrapper to determine when to wrap the line
function measureRange(
  glyphLookup: GlyphLookup,
  kerningLookup: KerningLookup,
  letterSpacing: number,
  text: string,
  start: number,
  end: number,
  width: number,
): { start: number; end: number; width: number } {
  let penX = 0;
  let maxX = 0;
  let lastGlyph: BMFontChar | null = null;
  const glyphCount = Math.min(text.length, end);

  let i = start;
  for (; i < glyphCount; i++) {
      const charCode = text.charCodeAt(i);
      const glyph = glyphLookup.get(charCode);
      if (!glyph) {
          lastGlyph = null;
          continue;
      }

      // Move the pen by the kerning amount
      penX += getKerningAmount(kerningLookup, lastGlyph, glyph);

      const left = penX + glyph.xoffset;
      const right = left + glyph.width;
      const advance = glyph.xadvance + letterSpacing;

      if (right > width && width !== Number.MAX_VALUE) {
          break;
      }

      maxX = Math.max(maxX, right);
      penX += advance;
      lastGlyph = glyph;
  }

  return {
      start,
      end: i,
      width: maxX,
  };
}

export interface LayoutGlyph {
  index: number;
  char: string;
  code: number;
  lineIndex: number;
  bottomLeftPosition: {
      x: number;
      y: number;
  };
  size: {
      width: number;
      height: number;
  };
  atlas: BMFontChar;
}

export function layoutText(options: LayoutOptions) {
  const { font, metrics } = options;

  const { glyphLookup, kerningLookup } = buildGlyphAndKerningLookups(font);

  // Check if wrap mode is supported
  const supportedWrapModes = ['pre', 'nowrap'];
  let wrapMode: WordWrapMode | undefined = undefined
  if (supportedWrapModes.includes(metrics.fontCssStyles.whiteSpace)) {
    wrapMode = metrics.fontCssStyles.whiteSpace as WordWrapMode
  }

  const fontSizeScale = metrics.fontCssStyles.fontSize / font.info?.size!

  // const wrapMode = wordWrapMode(metrics.style.whiteSpace);
  const lines = wordWrap.lines(metrics.text, {
      width: metrics.size.width / fontSizeScale,
      mode: wrapMode,
      measure: (src: string, start: number, end: number, width: number) =>
        measureRange(glyphLookup, kerningLookup,  metrics.fontCssStyles.letterSpacing, src, start, end, width),
  });

  const layoutGlyphs: LayoutGlyph[] = [];
  
  const fontLineHeight = metrics.fontCssStyles.lineHeight || font.common.lineHeight
  const fontBase = font.common.base;
  
  // Offset to align baseline with canvas render
  const yOffset = (fontBase * fontSizeScale) - metrics.canvasRenderMeasurements.baselineOffsetTop 
  
  let glyphIndex = 0;
  // Get glyph bounding boxes
  lines.forEach((line, lineIndex) => {
    let penX = 0;
    let lineWidth = 0;
    // Use BMFont's base value for baseline position within each line
    const topLineY = -(lineIndex * fontLineHeight)
    const lineStart = line.start;
    const lineEnd = line.end;

    // Add glyphs per line
    let lastGlyph: BMFontChar | null = null;
    for (let i = lineStart; i < lineEnd; i++) {
        const charCode = metrics.text.charCodeAt(i);
        const glyph = glyphLookup.get(charCode);
        if (!glyph) {
            lastGlyph = null;
            continue;
        }

        penX += getKerningAmount(kerningLookup, lastGlyph, glyph);

        // Determine glyph bounding box
        const glyphLeft = penX + (glyph.xoffset * fontSizeScale);
        const glyphTop = topLineY - (glyph.yoffset * fontSizeScale);
        const glyphBottom = glyphTop - (glyph.height  * fontSizeScale)
        const glyphWidth = glyph.width * fontSizeScale;
        const glyphHeight = glyph.height * fontSizeScale;

        const bottomLeftPosition = {
            x: glyphLeft,
            y: glyphBottom + yOffset,
        }

        layoutGlyphs.push({
            index: glyphIndex++,
            char: glyph.char || String.fromCharCode(charCode),
            code: charCode,
            lineIndex,
            bottomLeftPosition,
            size: {
                width: glyphWidth,
                height: glyphHeight,
            },
            atlas: glyph,
        });

        const glyphRight = glyphLeft + glyphWidth;
        lineWidth = Math.max(lineWidth, glyphRight);
        penX += glyph.xadvance * fontSizeScale + metrics.fontCssStyles.letterSpacing;
        lastGlyph = glyph;
    }
  });

  const height = fontLineHeight * lines.length;

  return {
      glyphs: layoutGlyphs,
      lines,
      width: metrics.size.width,
      // height: metrics.size.height,
      height,
  };
}