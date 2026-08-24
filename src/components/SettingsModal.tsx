/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppSettings, InferenceBackend } from '../types';
import { Cpu, HelpCircle, Laptop, Settings, ShieldCheck, X } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSettingsChange,
  onClose,
}) => {
  return (
    <div
      id="modal-settings"
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
    >
      <div className="bg-[#161a22] border border-[#2b3340] rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-xs text-gray-200">
        {/* Header */}
        <div className="h-12 bg-[#1a202c] px-4 flex items-center justify-between border-b border-[#2b3340]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-sm">Studio Preferences & AI Engine</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#252c38] text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* AI Backend */}
          <div>
            <label className="block text-gray-400 mb-1.5 font-medium flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Inference Backend</span>
            </label>
            <select
              value={settings.preferredBackend}
              onChange={(e) =>
                onSettingsChange({ preferredBackend: e.target.value as InferenceBackend })
              }
              className="w-full px-3 py-2 rounded-lg bg-[#0f1318] border border-[#2b3340] text-gray-200 focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="webgpu">WebGPU / DirectML (Hardware Accelerated)</option>
              <option value="wasm">WebAssembly SIMD (Multi-threaded CPU)</option>
              <option value="cpu">Standard CPU Fallback</option>
            </select>
          </div>

          {/* Thread count */}
          <div>
            <div className="flex justify-between text-gray-400 mb-1 font-medium">
              <span>WASM SIMD CPU Threads</span>
              <span className="font-mono text-gray-200">{settings.threadCount} threads</span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              step="1"
              value={settings.threadCount}
              onChange={(e) => onSettingsChange({ threadCount: parseInt(e.target.value, 10) })}
              className="w-full accent-purple-500 h-1.5 bg-[#252b36] rounded"
            />
          </div>

          {/* Default Export Format */}
          <div>
            <label className="block text-gray-400 mb-1.5 font-medium">Default Export Format</label>
            <div className="grid grid-cols-4 gap-1.5 font-mono">
              {(['obj', 'stl', 'glb', 'ply'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => onSettingsChange({ defaultExportFormat: fmt })}
                  className={`py-1.5 rounded border uppercase text-center font-bold ${
                    settings.defaultExportFormat === fmt
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-[#12151c] border-[#252b36] text-gray-400 hover:text-white'
                  }`}
                >
                  .{fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-fit camera */}
          <div className="bg-[#12151c] p-3 rounded-lg border border-[#252b36] space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span>Auto-fit camera on 3D mesh generation</span>
              <input
                type="checkbox"
                checked={settings.autoFitCamera}
                onChange={(e) => onSettingsChange({ autoFitCamera: e.target.checked })}
                className="accent-purple-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>32-bit floating point depth tensor precision</span>
              <input
                type="checkbox"
                checked={settings.highPrecisionDepth}
                onChange={(e) => onSettingsChange({ highPrecisionDepth: e.target.checked })}
                className="accent-purple-500 rounded"
              />
            </label>
          </div>

          {/* Security note */}
          <div className="bg-[#0f1318] p-3 rounded-lg border border-emerald-800/30 flex items-start gap-2.5 text-[11px] text-emerald-300/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Offline Isolation Active: No data or telemetry leaves your local system. All model weights, inference tensors, and vertex buffers operate strictly in memory.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 bg-[#1a202c] px-4 flex items-center justify-end border-t border-[#2b3340]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
