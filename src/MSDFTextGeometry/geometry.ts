import type { BMFontJSON } from "@/types/bmfont-json";
import type { LayoutGlyph } from "./layout";

export function buildGeometryAttributes(options: { glyphs: LayoutGlyph[], font: BMFontJSON, flipY: boolean }) {
  const { glyphs, font } = options;
  const glyphCount = glyphs.length;

  const texWidth = font.common.scaleW;
  const texHeight = font.common.scaleH;
  const flipY = options.flipY ?? true;

  const indices = new Uint32Array(glyphCount * 6)
  const positions = new Float32Array(glyphCount * 4 * 3); // 4 [x,y,z] positions per glyph (tl, tr, br, bl)
  const uvs = new Float32Array(glyphCount * 4 * 2); // 4 [u,v] positions per glyph (tl, tr, br, bl)
  const centers = new Float32Array(glyphCount * 4 * 2); // [x,y] positions for the center of the glyph for each vertex (tl, tr, br, bl)
  const glyphIndices = new Uint32Array(glyphCount * 4); // Index per glyph vertex

  glyphs.forEach((glyph, index) => {
    const { atlas } = glyph;

    const x = glyph.bottomLeftPosition.x;
    const yBottom = glyph.bottomLeftPosition.y;
    const width = glyph.size.width;
    const height = glyph.size.height;
    const yTop = yBottom + height;

    const positionIndex = index * 12; // 4 vertices * 3 components
    const uvIndex = index * 8; // 4 vertices * 2 components
    const centerIndex = index * 8; // 4 vertices * 2 components
    const indicesIndex = index * 6; // 
    const verticesIndex = index * 4;
    const glyphIndicesIndex = index * 4;
    // const layoutIndex = index * 8;

    // Position buffer (y-up in world space, origin at top-left of layout)
    // Top-left
    positions[positionIndex + 0] = x;
    positions[positionIndex + 1] = yTop;
    positions[positionIndex + 2] = 0;

    // Top-right
    positions[positionIndex + 3] = x + width;
    positions[positionIndex + 4] = yTop;
    positions[positionIndex + 5] = 0;

    // Bottom-right
    positions[positionIndex + 6] = x + width;
    positions[positionIndex + 7] = yBottom;
    positions[positionIndex + 8] = 0;

    // Bottom-left
    positions[positionIndex + 9] = x;
    positions[positionIndex + 10] = yBottom;
    positions[positionIndex + 11] = 0;

    // UV buffer
    const u0 = atlas.x / texWidth;
    const v1Raw = atlas.y / texHeight;
    const u1 = (atlas.x + atlas.width) / texWidth;
    const v0Raw = (atlas.y + atlas.height) / texHeight;

    const v0 = flipY ? 1 - v0Raw : v0Raw;
    const v1 = flipY ? 1 - v1Raw : v1Raw;

    // Top-left
    uvs[uvIndex + 0] = u0;
    uvs[uvIndex + 1] = v1;
    // Top-right
    uvs[uvIndex + 2] = u1;
    uvs[uvIndex + 3] = v1;
    // Bottom-right
    uvs[uvIndex + 4] = u1;
    uvs[uvIndex + 5] = v0;
    // Bottom-left
    uvs[uvIndex + 6] = u0;
    uvs[uvIndex + 7] = v0;

    // Centers
    const centerX = x + width / 2;
    const centerY = yBottom + height / 2;

    centers[centerIndex + 0] = centerX;
    centers[centerIndex + 1] = centerY;

    centers[centerIndex + 2] = centerX;
    centers[centerIndex + 3] = centerY;

    centers[centerIndex + 4] = centerX;
    centers[centerIndex + 5] = centerY;

    centers[centerIndex + 6] = centerX;
    centers[centerIndex + 7] = centerY;

    // Glyph Indices
    glyphIndices[glyphIndicesIndex] = index
    glyphIndices[glyphIndicesIndex + 1] = index
    glyphIndices[glyphIndicesIndex + 2] = index
    glyphIndices[glyphIndicesIndex + 3] = index

    // Indices (ccw winding order)
    // Triangle 1: top-left -> bottom-right -> top-right
    indices[indicesIndex] = verticesIndex;
    indices[indicesIndex + 1] = verticesIndex + 2;
    indices[indicesIndex + 2] = verticesIndex + 1;

    // Triangle 2: top-left -> bottom-left -> bottom-right
    indices[indicesIndex + 3] = verticesIndex;
    indices[indicesIndex + 4] = verticesIndex + 3;
    indices[indicesIndex + 5] = verticesIndex + 2;
  });

  return {
    positions,
    uvs,
    centers,
    indices,
    glyphIndices
  };
}