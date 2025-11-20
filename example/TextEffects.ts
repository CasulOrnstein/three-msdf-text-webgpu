import * as THREE from 'three/webgpu'
import { add, attribute, clamp, cos, distance, div, float, floor, fwidth, materialOpacity, max, min, mod, mx_hsvtorgb, positionGeometry, positionLocal, positionWorld, sin, sub, time, uv, vec2, vec3 } from "three/tsl";

export const rainbowWave = () => {
  const index = float(attribute('glyphIndices'))
  const strength = index.div(70)
  const zOffset = sin(time.add(index.mul(0.5))).mul(1)
  const position = positionGeometry.add(vec3(0,0,zOffset))

  return { positionNode: position, colorNode: mx_hsvtorgb(vec3(mod(strength.mul(5),1), 1, 0.5))}
 }

 export const boilingLines = (fontAtlas: THREE.Texture, noiseTexture: THREE.Texture) => {
  // Boiling lines
  const scale = vec2(1)
  const offset_multiplier = vec2(Math.PI, Math.E)
  const fps = 3
  const strength = 0.5

  const s = new THREE.TextureNode(fontAtlas)
  const noiseTextureNode = new THREE.TextureNode(noiseTexture)
  const modulate = materialOpacity
  const noise_uv = (positionLocal.xy.sub(positionWorld.xy)).div(vec2(noiseTexture.width, noiseTexture.height).mul(scale))

  const noise_offset = vec2(floor(time.mul(fps))).mul(offset_multiplier)
  const noise_sample = noiseTextureNode.sample(noise_uv.add(noise_offset).mod(1).xy).r.mul(4 * Math.PI)
  const direction = vec2(cos(noise_sample), sin(noise_sample))
  const squiggle_uv = uv().add(direction.mul(strength * 0.005))

  const squiggleSample = s.sample(squiggle_uv).mul(modulate)
  const median = (r: THREE.Node, g: THREE.Node, b: THREE.Node) => max(min(r, g), min(max(r, g), b));

  const sigDist = sub(median(squiggleSample.r, squiggleSample.g, squiggleSample.b), 0.5);
  const alpha = clamp(add(div(sigDist, fwidth(sigDist)), 0.5), 0.0, 1.0);

  return { opacityNode: alpha }
 }

 export const spinText = () => {
  const pos = attribute('position')
  const center = attribute('center')
  const radius = pos.x.sub(center.x)

  const newPosition = vec3(center.x.add(radius.mul(cos(time))), positionGeometry.y, positionGeometry.z)
  return { positionNode: newPosition }
 }