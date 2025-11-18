import * as THREE from 'three/webgpu'

import type { BMFontJSON } from '@/types/bmfont-json'
import { MSDFTextGeometry } from '@/MSDFTextGeometry';
import { MSDFTextNodeMaterial } from '@/MSDFTextMaterial';
import { collectDomTextMetrics, constructDomTextMetrics, type DomTextMetrics, type MetricsContsructionOptions } from '@/MSDFText/measure';

export class MSDFText extends THREE.Mesh<MSDFTextGeometry, MSDFTextNodeMaterial> {
  readonly element: HTMLElement | undefined
  
  constructor(metrics: DomTextMetrics, font: { atlas: THREE.Texture, data: BMFontJSON }) {
    const isSmooth = metrics.fontCssStyles.fontSize < 20 ? 1 : 0;
    
    const geometry = new MSDFTextGeometry({ metrics, font: font.data })
    const material = new MSDFTextNodeMaterial(font.atlas, { color: metrics.fontCssStyles.color, isSmooth })
    
    super(geometry, material)
    
    this.element = metrics.element
  }

  public static fromString(text: string, font: { atlas: THREE.Texture, data: BMFontJSON }, styleOptions?: MetricsContsructionOptions) {
    const metrics = constructDomTextMetrics(text, styleOptions)
    return new MSDFText(metrics, font)
  }

  public static fromDomElement(element: HTMLElement, font: { atlas: THREE.Texture, data: BMFontJSON }) {
    const metrics = collectDomTextMetrics(element)
    return new MSDFText(metrics, font)
  }

  // Update the transform of the mesh to match the position of a DOM element on a perpendicular plane at a given depth from the camera
  public alignWithElement(camera: { position: THREE.Vector3, quaternion: THREE.Quaternion, fov: number, aspect: number }, depthFromCamera: number = 5) {
    if (!this.element) {
      console.log("Unable to align MSDFText with element when using the fromString constructor")
      return
    }
    
    const { top, left } = this.element.getBoundingClientRect()

    const yFovRadians = camera.fov * (Math.PI / 180);
    const window3DHeight = 2 * Math.abs(depthFromCamera) * Math.tan(yFovRadians / 2);
    const window3DWidth = window3DHeight * camera.aspect;

    const positionCameraSpace = new THREE.Vector3(
      -(window3DWidth / 2) + (left / window.innerWidth)*window3DWidth,
      (window3DHeight / 2) - (top / window.innerHeight)*window3DHeight,
      -depthFromCamera,
    )

    const matrixWorld = new THREE.Matrix4();
    matrixWorld.compose(camera.position, camera.quaternion, new THREE.Vector3(1,1,1));
  
    const positionWorldSpace = positionCameraSpace.clone().applyMatrix4(matrixWorld)
    const quaternionWorldSpace = new THREE.Quaternion().setFromRotationMatrix(matrixWorld);

    const scaleX = (window3DWidth / window.innerWidth)

    this.scale.set(scaleX, scaleX, 1)
    this.position.copy(positionWorldSpace)
    this.quaternion.copy(quaternionWorldSpace)

    // Update geometry
    this.geometry.update()
  }
}