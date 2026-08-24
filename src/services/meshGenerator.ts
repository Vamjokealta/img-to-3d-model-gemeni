/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { DepthMapData, DepthSettings, MeshSettings, MeshStats } from '../types';
import { logger } from './logger';

export class MeshGenerator {
  /**
   * Generates a full 3D BufferGeometry from depth map and parameters
   * Highly optimized with pre-allocated TypedArrays to minimize RAM allocations.
   */
  public static generateMesh(
    depthMap: DepthMapData,
    depthSettings: DepthSettings,
    meshSettings: MeshSettings,
    imageAspect: number = 1.0
  ): THREE.BufferGeometry {
    const startTime = performance.now();

    const resX = Math.max(8, Math.min(meshSettings.resolutionX, depthMap.width));
    const resY = Math.max(8, Math.min(meshSettings.resolutionY, depthMap.height));

    const stepX = (depthMap.width - 1) / (resX - 1);
    const stepY = (depthMap.height - 1) / (resY - 1);

    const numSurfaceVertices = resX * resY;
    const numSurfaceQuads = (resX - 1) * (resY - 1);
    const numSurfaceTriangles = numSurfaceQuads * 2;

    const includeSkirt = Boolean(meshSettings.generateBaseSkirt);
    let totalVertices = numSurfaceVertices;
    let totalTriangles = numSurfaceTriangles;

    if (includeSkirt) {
      const perimeterSegments = (resX - 1) * 2 + (resY - 1) * 2;
      const skirtQuads = perimeterSegments;
      const bottomTriangles = (resX - 1) * (resY - 1) * 2;
      const bottomVertices = resX * resY;
      totalVertices = numSurfaceVertices + bottomVertices;
      totalTriangles += skirtQuads * 2 + bottomTriangles;
    }

    const positions = new Float32Array(totalVertices * 3);
    const uvs = new Float32Array(totalVertices * 2);
    const indices = totalVertices >= 65536 ? new Uint32Array(totalTriangles * 3) : new Uint16Array(totalTriangles * 3);
    let indexPtr = 0;

    // Aspect ratio scaling
    const aspect = isFinite(imageAspect) && imageAspect > 0 ? imageAspect : 1.0;
    const halfWidth = aspect >= 1.0 ? 1.0 : aspect;
    const halfHeight = aspect >= 1.0 ? 1.0 / aspect : 1.0;

    const minBaseZ = -0.05 - (meshSettings.baseThickness || 0.2);

    // 1. Generate Surface Vertices
    for (let y = 0; y < resY; y++) {
      const v = y / (resY - 1);
      const posY = (0.5 - v) * 2.0 * halfHeight;
      const srcY = Math.min(Math.round(y * stepY), depthMap.height - 1);

      for (let x = 0; x < resX; x++) {
        const u = x / (resX - 1);
        const posX = (u - 0.5) * 2.0 * halfWidth;
        const srcX = Math.min(Math.round(x * stepX), depthMap.width - 1);

        const depthIdx = srcY * depthMap.width + srcX;
        let rawD = depthMap.data[depthIdx];
        if (isNaN(rawD) || !isFinite(rawD)) rawD = 0.5;

        // Depth transformation
        if (depthSettings.invert) {
          rawD = 1.0 - rawD;
        }

        // Contrast adjustment
        if (depthSettings.contrast !== 1.0) {
          rawD = Math.pow(Math.max(0.0, Math.min(1.0, rawD)), depthSettings.contrast);
        }

        // Background Floor Flattening (nearClip threshold)
        // If nearClip is set (> 0.0), any depth below nearClip is smoothly clamped to flat plane to cleanly isolate subject from background
        if (depthSettings.nearClip && depthSettings.nearClip > 0.0) {
          const threshold = depthSettings.nearClip;
          if (rawD <= threshold) {
            rawD = 0.0;
          } else {
            // Smooth ramp for remaining foreground values
            rawD = (rawD - threshold) / (1.0 - threshold);
          }
        }

        // Far clip clamp
        if (depthSettings.farClip && depthSettings.farClip < 1.0) {
          rawD = Math.min(depthSettings.farClip, rawD);
        }

        // Smooth Edge Attenuation if requested
        if (depthSettings.smoothEdges) {
          const edgeDistX = Math.min(u, 1.0 - u);
          const edgeDistY = Math.min(v, 1.0 - v);
          const edgeDist = Math.min(edgeDistX, edgeDistY);
          const edgeFactor = Math.min(1.0, edgeDist * 10.0);
          rawD *= edgeFactor;
        }

        // Depth strength, scale, and offset
        const z = (rawD * depthSettings.strength * depthSettings.scale) + depthSettings.offset;

        const vertexIndex = y * resX + x;
        const pIdx = vertexIndex * 3;
        positions[pIdx] = posX;
        positions[pIdx + 1] = posY;
        positions[pIdx + 2] = isNaN(z) ? 0.0 : z;

        const uvIdx = vertexIndex * 2;
        uvs[uvIdx] = u;
        uvs[uvIdx + 1] = 1.0 - v;
      }
    }

    // 2. Generate Surface Triangles
    for (let y = 0; y < resY - 1; y++) {
      for (let x = 0; x < resX - 1; x++) {
        const a = y * resX + x;
        const b = y * resX + (x + 1);
        const c = (y + 1) * resX + x;
        const d = (y + 1) * resX + (x + 1);

        // Counter-clockwise winding
        indices[indexPtr++] = a;
        indices[indexPtr++] = c;
        indices[indexPtr++] = b;

        indices[indexPtr++] = b;
        indices[indexPtr++] = c;
        indices[indexPtr++] = d;
      }
    }

    // 3. Optional Solid Watertight Skirt & Bottom Base for 3D Printing
    if (includeSkirt) {
      const bottomOffset = numSurfaceVertices;

      // Bottom plane vertices
      for (let y = 0; y < resY; y++) {
        const v = y / (resY - 1);
        const posY = (0.5 - v) * 2.0 * halfHeight;

        for (let x = 0; x < resX; x++) {
          const u = x / (resX - 1);
          const posX = (u - 0.5) * 2.0 * halfWidth;

          const vertexIndex = bottomOffset + (y * resX + x);
          const pIdx = vertexIndex * 3;
          positions[pIdx] = posX;
          positions[pIdx + 1] = posY;
          positions[pIdx + 2] = minBaseZ;

          const uvIdx = vertexIndex * 2;
          uvs[uvIdx] = u;
          uvs[uvIdx + 1] = 1.0 - v;
        }
      }

      // Bottom Triangles (downward facing)
      for (let y = 0; y < resY - 1; y++) {
        for (let x = 0; x < resX - 1; x++) {
          const a = bottomOffset + (y * resX + x);
          const b = bottomOffset + (y * resX + (x + 1));
          const c = bottomOffset + ((y + 1) * resX + x);
          const d = bottomOffset + ((y + 1) * resX + (x + 1));

          indices[indexPtr++] = a;
          indices[indexPtr++] = b;
          indices[indexPtr++] = c;

          indices[indexPtr++] = b;
          indices[indexPtr++] = d;
          indices[indexPtr++] = c;
        }
      }

      // Side Wall: Top Edge (y = 0)
      for (let x = 0; x < resX - 1; x++) {
        const topA = x;
        const topB = x + 1;
        const botA = bottomOffset + x;
        const botB = bottomOffset + (x + 1);
        indices[indexPtr++] = topA;
        indices[indexPtr++] = topB;
        indices[indexPtr++] = botA;

        indices[indexPtr++] = topB;
        indices[indexPtr++] = botB;
        indices[indexPtr++] = botA;
      }

      // Side Wall: Bottom Edge (y = resY - 1)
      const lastRow = (resY - 1) * resX;
      for (let x = 0; x < resX - 1; x++) {
        const topA = lastRow + x;
        const topB = lastRow + (x + 1);
        const botA = bottomOffset + lastRow + x;
        const botB = bottomOffset + lastRow + (x + 1);
        indices[indexPtr++] = topA;
        indices[indexPtr++] = botA;
        indices[indexPtr++] = topB;

        indices[indexPtr++] = topB;
        indices[indexPtr++] = botA;
        indices[indexPtr++] = botB;
      }

      // Side Wall: Left Edge (x = 0)
      for (let y = 0; y < resY - 1; y++) {
        const topA = y * resX;
        const topB = (y + 1) * resX;
        const botA = bottomOffset + (y * resX);
        const botB = bottomOffset + ((y + 1) * resX);
        indices[indexPtr++] = topA;
        indices[indexPtr++] = botA;
        indices[indexPtr++] = topB;

        indices[indexPtr++] = topB;
        indices[indexPtr++] = botA;
        indices[indexPtr++] = botB;
      }

      // Side Wall: Right Edge (x = resX - 1)
      for (let y = 0; y < resY - 1; y++) {
        const topA = y * resX + (resX - 1);
        const topB = (y + 1) * resX + (resX - 1);
        const botA = bottomOffset + (y * resX + (resX - 1));
        const botB = bottomOffset + ((y + 1) * resX + (resX - 1));
        indices[indexPtr++] = topA;
        indices[indexPtr++] = topB;
        indices[indexPtr++] = botA;

        indices[indexPtr++] = topB;
        indices[indexPtr++] = botB;
        indices[indexPtr++] = botA;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));

    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const elapsed = Math.round(performance.now() - startTime);
    logger.success(
      `3D Mesh generated (${elapsed}ms)`,
      `Vertices: ${positions.length / 3}, Triangles: ${indexPtr / 3}`
    );

    return geometry;
  }

  public static getStats(geometry: THREE.BufferGeometry | null): MeshStats {
    if (!geometry) {
      return {
        vertexCount: 0,
        triangleCount: 0,
        faceCount: 0,
        boundingBox: { width: 0, height: 0, depth: 0 },
        estimatedMemoryBytes: 0,
      };
    }

    const pos = geometry.getAttribute('position');
    const vertexCount = pos ? pos.count : 0;
    const index = geometry.getIndex();
    const triangleCount = index ? index.count / 3 : vertexCount / 3;

    geometry.computeBoundingBox();
    const bbox = geometry.boundingBox || new THREE.Box3();
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Approximate memory in bytes (position Float32(3) + normal Float32(3) + uv Float32(2) + index Uint16/32(1))
    const estimatedMemoryBytes =
      vertexCount * (3 * 4 + 3 * 4 + 2 * 4) + (index ? index.count * 4 : 0);

    return {
      vertexCount,
      triangleCount: Math.round(triangleCount),
      faceCount: Math.round(triangleCount),
      boundingBox: {
        width: Number(size.x.toFixed(3)),
        height: Number(size.y.toFixed(3)),
        depth: Number(size.z.toFixed(3)),
      },
      estimatedMemoryBytes,
    };
  }
}
