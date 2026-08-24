/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { PLYExporter } from 'three/examples/jsm/exporters/PLYExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import JSZip from 'jszip';
import { logger } from './logger';

export class ExportService {
  /**
   * Triggers a browser download for a Blob or string
   */
  public static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    logger.success(`Export downloaded: ${filename}`);
  }

  /**
   * Export as OBJ + MTL + Texture in ZIP
   */
  public static async exportOBJ(
    mesh: THREE.Mesh,
    baseName: string = 'model',
    imageSourceUrl?: string
  ): Promise<void> {
    const exporter = new OBJExporter();
    const objText = exporter.parse(mesh);

    if (imageSourceUrl) {
      const zip = new JSZip();
      const mtlText = [
        `# ImageTo3D Studio Material File`,
        `newmtl material_0`,
        `Ka 0.2 0.2 0.2`,
        `Kd 0.8 0.8 0.8`,
        `Ks 0.0 0.0 0.0`,
        `illum 2`,
        `map_Kd texture.png`,
      ].join('\n');

      const objWithMtl = `mtllib ${baseName}.mtl\nusemtl material_0\n` + objText;

      zip.file(`${baseName}.obj`, objWithMtl);
      zip.file(`${baseName}.mtl`, mtlText);

      // Convert image source dataUrl to blob purely offline
      try {
        let imgBlob: Blob;
        if (imageSourceUrl.startsWith('data:')) {
          const parts = imageSourceUrl.split(',');
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : 'image/png';
          const binaryStr = atob(parts[1]);
          const len = binaryStr.length;
          const u8arr = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            u8arr[i] = binaryStr.charCodeAt(i);
          }
          imgBlob = new Blob([u8arr], { type: mime });
        } else {
          imgBlob = await fetch(imageSourceUrl).then((r) => r.blob());
        }
        zip.file('texture.png', imgBlob);
      } catch (err) {
        logger.warn('Could not bundle texture image into OBJ zip', String(err));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.triggerDownload(zipBlob, `${baseName}_obj_bundle.zip`);
    } else {
      const blob = new Blob([objText], { type: 'text/plain;charset=utf-8' });
      this.triggerDownload(blob, `${baseName}.obj`);
    }
  }

  /**
   * Export as STL (Binary or ASCII)
   */
  public static exportSTL(mesh: THREE.Mesh, baseName: string = 'model', binary: boolean = true): void {
    const exporter = new STLExporter();
    const result = exporter.parse(mesh, { binary });

    const blob =
      result instanceof ArrayBuffer
        ? new Blob([result], { type: 'application/octet-stream' })
        : new Blob([result], { type: 'text/plain' });

    this.triggerDownload(blob, `${baseName}.stl`);
  }

  /**
   * Export as GLB (Binary glTF with embedded textures)
   */
  public static exportGLB(mesh: THREE.Mesh, baseName: string = 'model'): Promise<void> {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        mesh,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            const blob = new Blob([gltf], { type: 'model/gltf-binary' });
            this.triggerDownload(blob, `${baseName}.glb`);
            resolve();
          } else {
            const output = JSON.stringify(gltf, null, 2);
            const blob = new Blob([output], { type: 'application/json' });
            this.triggerDownload(blob, `${baseName}.gltf`);
            resolve();
          }
        },
        (error) => {
          logger.error('Failed to export GLB', String(error));
          reject(error);
        },
        { binary: true, embedImages: true }
      );
    });
  }

  /**
   * Export as PLY (Polygon File Format)
   */
  public static exportPLY(mesh: THREE.Mesh, baseName: string = 'model', binary: boolean = true): void {
    const exporter = new PLYExporter();
    const result = exporter.parse(mesh, () => {}, { binary });

    if (result) {
      const blob =
        result instanceof ArrayBuffer
          ? new Blob([result], { type: 'application/octet-stream' })
          : new Blob([result], { type: 'text/plain' });
      this.triggerDownload(blob, `${baseName}.ply`);
    }
  }

  /**
   * Export Depth Map as PNG image
   */
  public static exportDepthMapPNG(
    depthData: Float32Array,
    width: number,
    height: number,
    colorMode: 'grayscale' | 'heatmap' | 'inverted' = 'grayscale',
    baseName: string = 'depth_map'
  ): void {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;
    const totalPixels = width * height;

    for (let i = 0; i < totalPixels; i++) {
      let d = depthData[i];
      if (colorMode === 'inverted') d = 1.0 - d;

      if (colorMode === 'heatmap') {
        // Turbo / Inferno heatmap colormap
        const r = Math.sin(d * Math.PI) * 255;
        const g = Math.sin(d * Math.PI * 0.8 + 0.5) * 200;
        const b = Math.cos(d * Math.PI * 0.5) * 255;

        data[i * 4] = Math.min(255, Math.max(0, Math.round(r)));
        data[i * 4 + 1] = Math.min(255, Math.max(0, Math.round(g)));
        data[i * 4 + 2] = Math.min(255, Math.max(0, Math.round(b)));
      } else {
        const v = Math.round(Math.min(1.0, Math.max(0.0, d)) * 255);
        data[i * 4] = v;
        data[i * 4 + 1] = v;
        data[i * 4 + 2] = v;
      }
      data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        this.triggerDownload(blob, `${baseName}_${colorMode}.png`);
      }
    }, 'image/png');
  }
}
