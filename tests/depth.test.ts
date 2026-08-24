/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { aiDepthService } from '../src/services/aiDepthService';

describe('AIDepthService Fallback & Normalization', () => {
  test('initializes and provides metadata', () => {
    const meta = aiDepthService.getMetadata();
    expect(meta).toBeDefined();
    expect(meta.name).toContain('Depth Anything');
  });

  test('runs geometric fallback depth estimation safely without throwing', () => {
    // Create a mock canvas
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 64, 64);

    const result = aiDepthService.runGeometricDepthFallback(canvas, 64, performance.now());
    expect(result.width).toBe(64);
    expect(result.height).toBe(64);
    expect(result.data.length).toBe(64 * 64);

    // Verify all depth values are within [0.0, 1.0]
    for (let i = 0; i < result.data.length; i++) {
      expect(result.data[i]).toBeGreaterThanOrEqual(0.0);
      expect(result.data[i]).toBeLessThanOrEqual(1.0);
      expect(isNaN(result.data[i])).toBe(false);
    }
  });
});
