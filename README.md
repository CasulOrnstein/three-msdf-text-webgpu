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

const textMesh = MSDFText.fromString(
  "Lorem ipsum",
  { atlas, data: font.data as unknown as BMFontJSON },
  { width: 300, color: '#FFFFFF', fontFamily: 'Roboto' }
)
```

Note: The width/height of the resultant geometry will be equal to the pixel width/height of the rendered text, so the resulting mesh will need to be scaled.

The available options are:
- `width` (number: required) - Width of the text in pixels. Determines where text is wrapped.
- `height` (number: required)
- `cssStyles` (see below)

With `cssStyles`:
- `fontFamily` (string): Default - Roboto
- `fontSize` (number px): Default - 16
- `fontWeight` (string): Default - "400"
- `fontStyle` (string): Default - "normal"
- `lineHeight` (number px): Default - 16
- `letterSpacing` (number px): Default - 0
- `textAlign` ("center" | "end" | "left" | "right" | "start"): Default - "left"
- `whiteSpace` ("normal" | "nowrap" | "pre" | "pre-wrap" | "pre-line" | "break-spaces"): Default - "normal"
- `color` (string): Default - "#000000"

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
const textMesh = MSDFText.fromDomElement(
  textElement,
  { atlas, data: font.data as unknown as BMFontJSON },
)
```

Using this method also allows `mesh.alignWithElement(camera: THREE.Camera)` to be called which will update the transform of the mesh to align with the DOM element in the camera's view at a given depth (5 units by default).

## Examples:

See this [blog page](https://www.madewithdove.co.uk/blog/webgpu-text) for an example of the package in action.