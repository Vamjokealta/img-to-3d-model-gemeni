/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { logger } from './logger';

export class MeshCleanup {
  /**
   * Ultra-Fast Laplacian Smoothing
   * Uses flat typed arrays and direct indexed neighbor accumulation without allocating Set objects.
   */
  public static smoothMesh(
    geometry: THREE.BufferGeometry,
    iterations: number = 2,
    strength: number = 0.5
  ): THREE.BufferGeometry {
    const startTime = performance.now();
    const cloned = geometry.clone();
    const posAttr = cloned.getAttribute('position');
    const indexAttr = cloned.getIndex();

    if (!posAttr) return geometry;

    const vertexCount = posAttr.count;
    const positions = posAttr.array as Float32Array;

    if (!indexAttr) {
      cloned.computeVertexNormals();
      return cloned;
    }

    const indices = indexAttr.array;
    const numIndices = indices.length;

    const sumX = new Float32Array(vertexCount);
    const sumY = new Float32Array(vertexCount);
    const sumZ = new Float32Array(vertexCount);
    const count = new Uint16Array(vertexCount);
    const tempPositions = new Float32Array(positions.length);

    for (let iter = 0; iter < iterations; iter++) {
      tempPositions.set(positions);
      sumX.fill(0);
      sumY.fill(0);
      sumZ.fill(0);
      count.fill(0);

      // Accumulate neighbor positions
      for (let i = 0; i < numIndices; i += 3) {
        const a = indices[i];
        const b = indices[i + 1];
        const c = indices[i + 2];

        const ax = tempPositions[a * 3];
        const ay = tempPositions[a * 3 + 1];
        const az = tempPositions[a * 3 + 2];

        const bx = tempPositions[b * 3];
        const by = tempPositions[b * 3 + 1];
        const bz = tempPositions[b * 3 + 2];

        const cx = tempPositions[c * 3];
        const cy = tempPositions[c * 3 + 1];
        const cz = tempPositions[c * 3 + 2];

        sumX[a] += bx + cx;
        sumY[a] += by + cy;
        sumZ[a] += bz + cz;
        count[a] += 2;

        sumX[b] += ax + cx;
        sumY[b] += ay + cy;
        sumZ[b] += az + cz;
        count[b] += 2;

        sumX[c] += ax + bx;
        sumY[c] += ay + by;
        sumZ[c] += az + bz;
        count[c] += 2;
      }

      // Displace towards neighbor averages
      for (let i = 0; i < vertexCount; i++) {
        const cnt = count[i];
        if (cnt === 0) continue;

        const avgX = sumX[i] / cnt;
        const avgY = sumY[i] / cnt;
        const avgZ = sumZ[i] / cnt;

        const currX = tempPositions[i * 3];
        const currY = tempPositions[i * 3 + 1];
        const currZ = tempPositions[i * 3 + 2];

        positions[i * 3] = currX + (avgX - currX) * strength;
        positions[i * 3 + 1] = currY + (avgY - currY) * strength;
        positions[i * 3 + 2] = currZ + (avgZ - currZ) * strength;
      }
    }

    posAttr.needsUpdate = true;
    cloned.computeVertexNormals();

    const elapsed = Math.round(performance.now() - startTime);
    logger.info(`Laplacian smoothing applied (${elapsed}ms)`, `Iterations: ${iterations}, Strength: ${strength}`);

    return cloned;
  }

  /**
   * Mesh Decimation / Simplification
   */
  public static decimateMesh(
    geometry: THREE.BufferGeometry,
    targetRatio: number = 0.5
  ): THREE.BufferGeometry {
    if (targetRatio >= 0.99) return geometry.clone();

    const startTime = performance.now();
    const cloned = geometry.clone();
    const posAttr = cloned.getAttribute('position');
    const uvAttr = cloned.getAttribute('uv');
    const indexAttr = cloned.getIndex();

    if (!posAttr || !indexAttr) return geometry;

    const indices = indexAttr.array;
    const triangleCount = Math.floor(indices.length / 3);
    const targetTriangles = Math.max(10, Math.floor(triangleCount * targetRatio));

    const step = Math.max(1, Math.round(1 / targetRatio));
    const validTriangles: [number, number, number][] = [];

    for (let i = 0; i < indices.length; i += 3 * step) {
      if (validTriangles.length >= targetTriangles) break;
      validTriangles.push([indices[i], indices[i + 1], indices[i + 2]]);
    }

    const usedVertices = new Set<number>();
    for (const tri of validTriangles) {
      usedVertices.add(tri[0]);
      usedVertices.add(tri[1]);
      usedVertices.add(tri[2]);
    }

    const oldToNewMap = new Map<number, number>();
    const newPositions: number[] = [];
    const newUvs: number[] = [];

    const oldPos = posAttr.array;
    const oldUv = uvAttr ? uvAttr.array : null;

    let newIdx = 0;
    for (const oldIdx of usedVertices) {
      oldToNewMap.set(oldIdx, newIdx++);
      newPositions.push(oldPos[oldIdx * 3], oldPos[oldIdx * 3 + 1], oldPos[oldIdx * 3 + 2]);
      if (oldUv) {
        newUvs.push(oldUv[oldIdx * 2], oldUv[oldIdx * 2 + 1]);
      }
    }

    const newIndices: number[] = [];
    for (const tri of validTriangles) {
      const a = oldToNewMap.get(tri[0])!;
      const b = oldToNewMap.get(tri[1])!;
      const c = oldToNewMap.get(tri[2])!;
      newIndices.push(a, b, c);
    }

    const newGeo = new THREE.BufferGeometry();
    newGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));
    if (newUvs.length > 0) {
      newGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(newUvs), 2));
    }
    newGeo.setIndex(newIndices);
    newGeo.computeVertexNormals();

    const elapsed = Math.round(performance.now() - startTime);
    logger.info(
      `Mesh Decimation complete (${elapsed}ms)`,
      `Triangles: ${triangleCount} → ${newIndices.length / 3} (${Math.round(targetRatio * 100)}%)`
    );

    return newGeo;
  }

  /**
   * Remove Isolated and Degenerate Triangles
   */
  public static removeIsolatedAndDegenerates(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    const startTime = performance.now();
    const cloned = geometry.clone();
    const posAttr = cloned.getAttribute('position');
    const indexAttr = cloned.getIndex();

    if (!posAttr || !indexAttr) return geometry;

    const positions = posAttr.array;
    const indices = indexAttr.array;
    const cleanIndices: number[] = [];

    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i];
      const b = indices[i + 1];
      const c = indices[i + 2];

      if (a === b || b === c || a === c) continue;

      const ax = positions[a * 3];
      const ay = positions[a * 3 + 1];
      const az = positions[a * 3 + 2];

      const bx = positions[b * 3];
      const by = positions[b * 3 + 1];
      const bz = positions[b * 3 + 2];

      const cx = positions[c * 3];
      const cy = positions[c * 3 + 1];
      const cz = positions[c * 3 + 2];

      // Cross product to find area
      const abx = bx - ax;
      const aby = by - ay;
      const abz = bz - az;

      const acx = cx - ax;
      const acy = cy - ay;
      const acz = cz - az;

      const crossX = aby * acz - abz * acy;
      const crossY = abz * acx - abx * acz;
      const crossZ = abx * acy - aby * acx;

      const areaSq = crossX * crossX + crossY * crossY + crossZ * crossZ;
      if (areaSq > 1e-10) {
        cleanIndices.push(a, b, c);
      }
    }

    cloned.setIndex(cleanIndices);
    cloned.computeVertexNormals();

    const elapsed = Math.round(performance.now() - startTime);
    logger.info(`Cleaned degenerate triangles (${elapsed}ms)`, `Removed ${indices.length / 3 - cleanIndices.length / 3} faces`);
    return cloned;
  }

  /**
   * Recalculate Normals
   */
  public static recalculateNormals(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    const cloned = geometry.clone();
    cloned.computeVertexNormals();
    logger.info('Normals recalculated');
    return cloned;
  }

  /**
   * Weld Close Vertices / Fill Holes
   */
  public static weldVertices(geometry: THREE.BufferGeometry, tolerance: number = 0.001): THREE.BufferGeometry {
    const startTime = performance.now();
    const cloned = geometry.clone();
    const posAttr = cloned.getAttribute('position');
    if (!posAttr) return geometry;

    const positions = posAttr.array;
    const vertexCount = posAttr.count;

    const grid = new Map<string, number>();
    const oldToNew = new Int32Array(vertexCount);
    const newPositions: number[] = [];
    const invTol = 1.0 / tolerance;

    let uniqueCount = 0;
    for (let i = 0; i < vertexCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];

      const key = `${Math.round(x * invTol)},${Math.round(y * invTol)},${Math.round(z * invTol)}`;

      if (grid.has(key)) {
        oldToNew[i] = grid.get(key)!;
      } else {
        const newIdx = uniqueCount++;
        grid.set(key, newIdx);
        oldToNew[i] = newIdx;
        newPositions.push(x, y, z);
      }
    }

    const newGeo = new THREE.BufferGeometry();
    newGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(newPositions), 3));

    const indexAttr = cloned.getIndex();
    if (indexAttr) {
      const oldIndices = indexAttr.array;
      const newIndices: number[] = [];
      for (let i = 0; i < oldIndices.length; i += 3) {
        const a = oldToNew[oldIndices[i]];
        const b = oldToNew[oldIndices[i + 1]];
        const c = oldToNew[oldIndices[i + 2]];
        if (a !== b && b !== c && a !== c) {
          newIndices.push(a, b, c);
        }
      }
      newGeo.setIndex(newIndices);
    }

    newGeo.computeVertexNormals();
    const elapsed = Math.round(performance.now() - startTime);
    logger.info(`Welded duplicate vertices (${elapsed}ms)`, `Vertices: ${vertexCount} → ${uniqueCount}`);

    return newGeo;
  }

  /**
   * Invert Geometry Normals & Winding
   */
  public static flipNormals(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    const cloned = geometry.clone();
    const indexAttr = cloned.getIndex();

    if (indexAttr) {
      const indices = indexAttr.array;
      const newIndices = new (indices instanceof Uint32Array ? Uint32Array : Uint16Array)(indices.length);
      for (let i = 0; i < indices.length; i += 3) {
        newIndices[i] = indices[i];
        newIndices[i + 1] = indices[i + 2];
        newIndices[i + 2] = indices[i + 1];
      }
      cloned.setIndex(new THREE.BufferAttribute(newIndices, 1));
    }

    cloned.computeVertexNormals();
    logger.info('Inverted 3D Mesh Normals');
    return cloned;
  }
}
