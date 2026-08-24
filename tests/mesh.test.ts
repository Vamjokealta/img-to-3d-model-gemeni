/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { MeshGenerator } from '../src/services/meshGenerator';
import { MeshCleanup } from '../src/services/meshCleanup';
import { DepthMapData, DepthSettings, MeshSettings } from '../src/types';

describe('MeshGenerator & MeshCleanup', () => {
  const dummyDepthData: DepthMapData = {
    width: 64,
    height: 64,
    data: new Float32Array(64 * 64).fill(0.5),
    minDepth: 0.0,
    maxDepth: 1.0,
    inferenceTimeMs: 12,
    backendUsed: 'wasm',
  };

  const dummyDepthSettings: DepthSettings = {
    strength: 1.0,
    scale: 1.0,
    offset: 0.0,
    contrast: 1.0,
    invert: false,
    smoothness: 10,
    nearClip: 0.0,
    farClip: 1.0,
    smoothEdges: true,
  };

  const dummyMeshSettings: MeshSettings = {
    resolutionX: 64,
    resolutionY: 64,
    generateBaseSkirt: false,
    baseThickness: 0.2,
    smoothNormals: true,
    simplifyRatio: 1.0,
  };

  test('generates valid BufferGeometry with valid positions and indices', () => {
    const geo = MeshGenerator.generateMesh(
      dummyDepthData,
      dummyDepthSettings,
      dummyMeshSettings,
      1.0
    );

    const pos = geo.getAttribute('position');
    const index = geo.getIndex();

    expect(pos).toBeDefined();
    expect(pos.count).toBe(64 * 64);
    expect(index).toBeDefined();
    expect(index!.count).toBe((64 - 1) * (64 - 1) * 6);

    // Verify no NaNs
    const array = pos.array as Float32Array;
    for (let i = 0; i < array.length; i++) {
      expect(isNaN(array[i])).toBe(false);
      expect(isFinite(array[i])).toBe(true);
    }
  });

  test('cleans and smooths mesh correctly', () => {
    const geo = MeshGenerator.generateMesh(
      dummyDepthData,
      dummyDepthSettings,
      dummyMeshSettings,
      1.0
    );

    const smoothed = MeshCleanup.smoothMesh(geo, 2, 0.5);
    expect(smoothed.getAttribute('position').count).toBe(geo.getAttribute('position').count);

    const decimated = MeshCleanup.decimateMesh(geo, 0.5);
    expect(decimated.getIndex()!.count).toBeLessThan(geo.getIndex()!.count);
  });
});
