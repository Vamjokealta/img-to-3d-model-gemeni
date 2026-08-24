/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, CheckCircle2, Cpu, FolderArchive, Layers, Sparkles, X } from 'lucide-react';

interface FirstRunGuideProps {
  onClose: () => void;
}

export const FirstRunGuide: React.FC<FirstRunGuideProps> = ({ onClose }) => {
  return (
    <div
      id="modal-first-run-guide"
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#161a22] border border-[#2b3340] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col text-xs text-gray-200">
        {/* Header */}
        <div className="h-12 bg-[#1a202c] px-4 flex items-center justify-between border-b border-[#2b3340]">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm">ImageTo3D User Guide & AI Model Setup</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#252c38] text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Quick Start Workflow */}
          <div className="bg-[#12151c] p-3.5 rounded-lg border border-[#252b36] space-y-2">
            <h4 className="font-bold text-gray-100 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Standard 3D Workflow</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-[#181d26] p-2 rounded border border-[#262c36]">
                <div className="font-bold text-blue-400 mb-1">1. Import Image</div>
                <p className="text-gray-400">Drag & drop or load any PNG, JPG, WEBP, or BMP file.</p>
              </div>
              <div className="bg-[#181d26] p-2 rounded border border-[#262c36]">
                <div className="font-bold text-purple-400 mb-1">2. AI Depth</div>
                <p className="text-gray-400">Run local Depth Anything V2 or built-in Saliency AI.</p>
              </div>
              <div className="bg-[#181d26] p-2 rounded border border-[#262c36]">
                <div className="font-bold text-emerald-400 mb-1">3. Sculpt & Clean</div>
                <p className="text-gray-400">Smooth, decimate, or sculpt contours with brushes.</p>
              </div>
              <div className="bg-[#181d26] p-2 rounded border border-[#262c36]">
                <div className="font-bold text-yellow-400 mb-1">4. Export</div>
                <p className="text-gray-400">Export real 3D OBJ, STL, GLB, or PLY files.</p>
              </div>
            </div>
          </div>

          {/* ONNX Model Placement Guide */}
          <div className="bg-[#12151c] p-3.5 rounded-lg border border-[#252b36] space-y-2.5">
            <h4 className="font-bold text-gray-100 flex items-center gap-1.5 text-xs">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Depth Anything V2 ONNX Model Placement</span>
            </h4>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              The application works completely offline. You can click{' '}
              <strong className="text-purple-300">Load ONNX</strong> in the toolbar at any time to select any Depth Anything V2 `.onnx` model file directly from your disk, or place it inside:
            </p>
            <div className="p-2 rounded bg-[#0b0e14] border border-gray-800 font-mono text-[11px] text-emerald-400">
              models/depth-anything-v2/depthanythingv2.onnx
            </div>
            <p className="text-gray-400 text-[11px]">
              Supported model formats: Depth Anything V2 Small/Base/Large ONNX (`[1, 3, 518, 518]` tensor input with ImageNet normalization).
            </p>
          </div>

          {/* 3D Printing & Watertight Base */}
          <div className="bg-[#12151c] p-3.5 rounded-lg border border-[#252b36] space-y-2">
            <h4 className="font-bold text-gray-100 flex items-center gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>3D Printing with Solid Watertight Skirt</span>
            </h4>
            <p className="text-gray-400 text-[11px] leading-relaxed">
              To 3D-print a bas-relief or lithophane model, enable{' '}
              <strong className="text-emerald-300">Watertight Base</strong> in the Mesh Geometry panel. This extrudes side walls and a flat base to create a closed, manifold STL model ready for 3D slicers.
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-[#12151c] p-3.5 rounded-lg border border-[#252b36] space-y-2">
            <h4 className="font-bold text-gray-100 text-xs">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
              <div><kbd className="px-1.5 py-0.5 bg-[#252c38] rounded font-mono">F</kbd> Fit model to view</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#252c38] rounded font-mono">R</kbd> Reset camera view</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#252c38] rounded font-mono">W</kbd> Toggle wireframe</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#252c38] rounded font-mono">G</kbd> Toggle grid</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#252c38] rounded font-mono">Ctrl+Z</kbd> Undo sculpt/edit</div>
              <div><kbd className="px-1.5 py-0.5 bg-[#252c38] rounded font-mono">Ctrl+Y</kbd> Redo sculpt/edit</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-[#1a202c] px-4 flex items-center justify-end border-t border-[#2b3340]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
