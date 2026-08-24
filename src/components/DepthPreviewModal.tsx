/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { DepthMapData } from '../types';
import { Download, Layers, X } from 'lucide-react';
import { ExportService } from '../services/exportService';

interface DepthPreviewModalProps {
  depthMap: DepthMapData | null;
  onClose: () => void;
}

export const DepthPreviewModal: React.FC<DepthPreviewModalProps> = ({ depthMap, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorMode, setColorMode] = useState<'grayscale' | 'heatmap' | 'inverted'>('heatmap');
  const [hoverDepth, setHoverDepth] = useState<number | null>(null);

  useEffect(() => {
    if (!depthMap || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = depthMap.width;
    canvas.height = depthMap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(depthMap.width, depthMap.height);
    const data = imgData.data;
    const total = depthMap.width * depthMap.height;

    for (let i = 0; i < total; i++) {
      let d = depthMap.data[i];
      if (colorMode === 'inverted') d = 1.0 - d;

      if (colorMode === 'heatmap') {
        // Turbo colormap approximation
        const r = Math.sin(d * Math.PI) * 255;
        const g = Math.sin(d * Math.PI * 0.8 + 0.5) * 210;
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
  }, [depthMap, colorMode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!depthMap || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * depthMap.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * depthMap.height);

    if (x >= 0 && x < depthMap.width && y >= 0 && y < depthMap.height) {
      const idx = y * depthMap.width + x;
      setHoverDepth(depthMap.data[idx]);
    }
  };

  const handleDownload = () => {
    if (!depthMap) return;
    ExportService.exportDepthMapPNG(
      depthMap.data,
      depthMap.width,
      depthMap.height,
      colorMode,
      'depth_map'
    );
  };

  if (!depthMap) return null;

  return (
    <div
      id="modal-depth-preview"
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#161a22] border border-[#2b3340] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 bg-[#1a202c] px-4 flex items-center justify-between border-b border-[#2b3340] text-gray-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-sm">2D AI Depth Map Inspector</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#252c38] text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col items-center gap-4">
          <div className="relative border border-[#2b3340] rounded-lg overflow-hidden bg-black aspect-square max-w-[380px] w-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoverDepth(null)}
              className="w-full h-full object-contain cursor-crosshair"
            />

            {hoverDepth !== null && (
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[11px] font-mono text-amber-300 border border-gray-700">
                Depth: {hoverDepth.toFixed(4)}
              </div>
            )}
          </div>

          {/* Color Mode Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Palette:</span>
            <div className="flex bg-[#0f1318] p-1 rounded-lg border border-[#2b3340] text-xs">
              {(
                [
                  { id: 'heatmap', label: 'Turbo Heatmap' },
                  { id: 'grayscale', label: 'Grayscale' },
                  { id: 'inverted', label: 'Inverted' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setColorMode(mode.id)}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    colorMode === mode.id
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meta specs */}
          <div className="w-full bg-[#12151c] p-3 rounded-lg border border-[#222833] text-xs text-gray-400 flex justify-around font-mono">
            <div>
              Width: <span className="text-gray-200">{depthMap.width}px</span>
            </div>
            <div>
              Height: <span className="text-gray-200">{depthMap.height}px</span>
            </div>
            <div>
              Backend: <span className="text-purple-300 uppercase">{depthMap.backendUsed}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 bg-[#1a202c] px-4 flex items-center justify-between border-t border-[#2b3340]">
          <span className="text-[11px] text-gray-400">Floating-point normalized tensor [0.0, 1.0]</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#252c38] hover:bg-[#313a4a] text-xs text-gray-300 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save Depth Map PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
