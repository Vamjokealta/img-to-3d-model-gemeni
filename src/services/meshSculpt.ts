/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { SculptSettings } from '../types';

export class MeshSculpt {
  /**
   * Applies sculpt stroke at the 3D raycast intersection point.
   * High performance: zero-allocation loop using inline vector math.
   */
  public static applySculptBrush(
    geometry: THREE.BufferGeometry,
    hitPoint: THREE.Vector3,
    hitNormal: THREE.Vector3,
    settings: SculptSettings
  ): boolean {
    const posAttr = geometry.getAttribute('position');
    const normAttr = geometry.getAttribute('normal');
    if (!posAttr) return false;

    const positions = posAttr.array as Float32Array;
    const normals = normAttr ? (normAttr.array as Float32Array) : null;
    const vertexCount = posAttr.count;

    const radius = settings.brushRadius;
    const radiusSq = radius * radius;
    const strength = settings.brushStrength;
    const tool = settings.activeTool;

    if (tool === 'none') return false;

    let modified = false;

    // Calculate neighborhood for smoothing
    const affectedIndices: number[] = [];
    let avgX = 0;
    let avgY = 0;
    let avgZ = 0;

    const hx = hitPoint.x;
    const hy = hitPoint.y;
    const hz = hitPoint.z;

    const nx = hitNormal.x;
    const ny = hitNormal.y;
    const nz = hitNormal.z;

    for (let i = 0; i < vertexCount; i++) {
      const vx = positions[i * 3];
      const vy = positions[i * 3 + 1];
      const vz = positions[i * 3 + 2];

      const dx = vx - hx;
      const dy = vy - hy;
      const dz = vz - hz;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq <= radiusSq) {
        affectedIndices.push(i);
        avgX += vx;
        avgY += vy;
        avgZ += vz;
      }
    }

    const numAffected = affectedIndices.length;
    if (numAffected === 0) return false;

    avgX /= numAffected;
    avgY /= numAffected;
    avgZ /= numAffected;

    const invRadius = 1.0 / radius;

    for (let j = 0; j < numAffected; j++) {
      const i = affectedIndices[j];
      const vx = positions[i * 3];
      const vy = positions[i * 3 + 1];
      const vz = positions[i * 3 + 2];

      const dx = vx - hx;
      const dy = vy - hy;
      const dz = vz - hz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const normalizedDist = Math.min(1.0, dist * invRadius);

      // Falloff calculation
      let falloff = 1.0 - normalizedDist;
      if (settings.brushFalloff === 'gaussian') {
        falloff = Math.exp(-Math.pow(normalizedDist * 2, 2));
      } else if (settings.brushFalloff === 'cosine') {
        falloff = (1 + Math.cos(normalizedDist * Math.PI)) * 0.5;
      } else if (settings.brushFalloff === 'sharp') {
        falloff = Math.pow(1.0 - normalizedDist, 3);
      }

      const displacement = strength * falloff * 0.05;

      if (tool === 'push') {
        positions[i * 3] += nx * displacement;
        positions[i * 3 + 1] += ny * displacement;
        positions[i * 3 + 2] += nz * displacement;
        modified = true;
      } else if (tool === 'pull') {
        positions[i * 3] -= nx * displacement;
        positions[i * 3 + 1] -= ny * displacement;
        positions[i * 3 + 2] -= nz * displacement;
        modified = true;
      } else if (tool === 'inflate') {
        let vnx = nx;
        let vny = ny;
        let vnz = nz;
        if (normals) {
          vnx = normals[i * 3];
          vny = normals[i * 3 + 1];
          vnz = normals[i * 3 + 2];
        }
        positions[i * 3] += vnx * displacement;
        positions[i * 3 + 1] += vny * displacement;
        positions[i * 3 + 2] += vnz * displacement;
        modified = true;
      } else if (tool === 'smooth') {
        const factor = strength * falloff * 0.3;
        positions[i * 3] += (avgX - vx) * factor;
        positions[i * 3 + 1] += (avgY - vy) * factor;
        positions[i * 3 + 2] += (avgZ - vz) * factor;
        modified = true;
      } else if (tool === 'flatten') {
        // Project onto hitNormal plane directly
        const distToPlane = (vx - hx) * nx + (vy - hy) * ny + (vz - hz) * nz;
        const projX = vx - distToPlane * nx;
        const projY = vy - distToPlane * ny;
        const projZ = vz - distToPlane * nz;

        const factor = strength * falloff * 0.4;
        positions[i * 3] += (projX - vx) * factor;
        positions[i * 3 + 1] += (projY - vy) * factor;
        positions[i * 3 + 2] += (projZ - vz) * factor;
        modified = true;
      }
    }

    if (modified) {
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();
    }

    return modified;
  }

  /**
   * Crop geometry along Z-depth threshold or bounding box
   */
  public static cropGeometry(
    geometry: THREE.BufferGeometry,
    minZ: number,
    maxZ: number
  ): THREE.BufferGeometry {
    const cloned = geometry.clone();
    const posAttr = cloned.getAttribute('position');
    const indexAttr = cloned.getIndex();
    if (!posAttr || !indexAttr) return geometry;

    const positions = posAttr.array;
    const indices = indexAttr.array;
    const newIndices: number[] = [];

    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i];
      const b = indices[i + 1];
      const c = indices[i + 2];

      const za = positions[a * 3 + 2];
      const zb = positions[b * 3 + 2];
      const zc = positions[c * 3 + 2];

      if (za >= minZ && za <= maxZ && zb >= minZ && zb <= maxZ && zc >= minZ && zc <= maxZ) {
        newIndices.push(a, b, c);
      }
    }

    const newGeo = new THREE.BufferGeometry();
    newGeo.setAttribute('position', posAttr);
    const uvAttr = cloned.getAttribute('uv');
    if (uvAttr) newGeo.setAttribute('uv', uvAttr);
    newGeo.setIndex(newIndices);
    newGeo.computeVertexNormals();

    return newGeo;
  }

  /**
   * Mirror Geometry across X or Y Axis
   */
  public static mirrorGeometry(
    geometry: THREE.BufferGeometry,
    axis: 'x' | 'y'
  ): THREE.BufferGeometry {
    const cloned = geometry.clone();
    const posAttr = cloned.getAttribute('position');
    const indexAttr = cloned.getIndex();
    if (!posAttr) return geometry;

    const positions = posAttr.array as Float32Array;
    const vertexCount = posAttr.count;

    for (let i = 0; i < vertexCount; i++) {
      if (axis === 'x') {
        positions[i * 3] = -positions[i * 3];
      } else {
        positions[i * 3 + 1] = -positions[i * 3 + 1];
      }
    }
    posAttr.needsUpdate = true;

    // Flip index triangle winding so normals point outward correctly
    if (indexAttr) {
      const indices = indexAttr.array;
      for (let i = 0; i < indices.length; i += 3) {
        const temp = indices[i + 1];
        indices[i + 1] = indices[i + 2];
        indices[i + 2] = temp;
      }
      indexAttr.needsUpdate = true;
    }

    cloned.computeVertexNormals();
    return cloned;
  }
}
