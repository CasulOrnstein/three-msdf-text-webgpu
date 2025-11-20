# Three MSDF Text WebGPU

Text rendering in Three.js with WebGPU using MSDF fonts.

Forked from [three-msdf-text-utils](https://github.com/leochocolat/three-msdf-text-utils).

## MSDFs Font

This package requires using MSDF fonts which can be created using either the [msdf-bmfont-xml](https://github.com/soimy/msdf-bmfont-xml) cmd line tool or with [Dom McCurdy's web tool](https://msdf-bmfont.donmccurdy.com/).

## Installation

```bash
npm install three-msdf-text-webgpu
```

## Usage

There are two main methods to create a MSDFText mesh:

### From Text
This method involves manually defining the text string along with various CSS options to determine how the mesh is rendered.

```js
import * as THREE from "three/webgpu";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { MSDFText, type BMFontJSON } from "three-msdf-text-webgpu";

const fontLoader = new FontLoader();
const textureLoader = new THREE.TextureLoader();

// Load generated MSDF font files
const font = await this.fontLoader.loadAsync("/font/Roboto-Regular-msdf.json"), 
const atlas = await this.textureLoader.loadAsync("/font/Roboto-Regular.png")

const options = {
    text: "MSDF Text",
    textStyles: {
      widthPx: 500,
      fontFamily: "Roboto",
      fontSize: 32,
      fontWeight: "400",
      lineHeightPx: 50,
      letterSpacingPx: 0,
      textAlign: 'left',
      whiteSpace: 'normal',
      color: '#ff0000',
      opacity: 1
    }
  }
const textMesh = new MSDFText(options, { atlas, data: font.data })
```

Note: The width/height of the resultant geometry will be equal to the pixel width/height of the rendered text, so the resulting mesh will need to be scaled.

The available options are:
- `text` (string: required)
- `textStyles`

With `textStyles`:
- `widthPx` (number: required) - Width of the text in pixels. Determines where text is wrapped.
- `fontFamily` (string): Default - Roboto
- `fontSize` (number px): Default - 16
- `fontWeight` (string): Default - "400"
- `fontStyle` (string): Default - "normal"
- `lineHeightPx` (number): Default - 16
- `letterSpacingPx` (number): Default - 0
- `textAlign` ("center" | "end" | "left" | "right" | "start"): Default - "left"
- `whiteSpace` ("normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line" | "break-spaces"): Default - "normal"
- `color` (string): Default - "#000000"
- `opacity` (number): Default - 1

The method `.update(options)` can be called with partial options to update the text geometry and material.

### From DOM element
By passing a HTMLElement, the styling of the text will match that of the element.

```js
import * as THREE from "three/webgpu";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { MSDFText, type BMFontJSON } from "three-msdf-text-webgpu";

const fontLoader = new FontLoader();
const textureLoader = new THREE.TextureLoader();

// Load generated MSDF font files
const font = await this.fontLoader.loadAsync("/font/Roboto-Regular-msdf.json"), 
const atlas = await this.textureLoader.loadAsync("/font/Roboto-Regular.png")

const textElement = document.querySelector<HTMLDivElement>('[data-3d]')!;
const textMesh = new SyncMSDFText(
  textElement,
  { atlas, data: font.data as unknown as BMFontJSON },
)
```

Using this method also allows `mesh.update(camera: THREE.Camera)` to be called which will update the transform of the mesh to align with the DOM element in the camera's view at a given depth (5 units by default).

## Examples:

To run the example demo locally, run:
```bash
npm i
npm run example
```

For more information on this package, see this [blog page](https://www.madewithdove.co.uk/blog/webgpu-text).