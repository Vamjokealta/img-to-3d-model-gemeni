/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  Eraser,
  Eye,
  EyeOff,
  Flame,
  FlipHorizontal,
  FolderUp,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  Move,
  Paintbrush,
  Palette,
  Plus,
  RefreshCw,
  RotateCw,
  Scissors,
  Sliders,
  Sparkles,
  Trash2,
  Wand2,
  Zap,
} from 'lucide-react';
import {
  DepthMapData,
  DepthSettings,
  InferenceBackend,
  MaterialSettings,
  MeshSettings,
  MeshStats,
  ModelMetadata,
  SculptSettings,
  SculptTool,
} from '../types';

interface LeftSidebarProps {
  imageFile: File | null;
  imageDataUrl: string | null;
  imageDimensions: { width: number; height: number } | null;
  modelMetadata: ModelMetadata;
  depthMap: DepthMapData | null;
  depthSettings: DepthSettings;
  meshSettings: MeshSettings;
  meshStats: MeshStats;
  materialSettings: MaterialSettings;
  sculptSettings: SculptSettings;
  isProcessing: boolean;
  onImportImage: () => void;
  onReplaceImage: () => void;
  onRemoveImage: () => void;
  onLoadModel: () => void;
  onRunDepth: () => void;
  onDepthSettingsChange: (settings: Partial<DepthSettings>) => void;
  onMeshSettingsChange: (settings: Partial<MeshSettings>) => void;
  onMaterialSettingsChange: (settings: Partial<MaterialSettings>) => void;
  onSculptSettingsChange: (settings: Partial<SculptSettings>) => void;
  onRegenerateMesh: () => void;
  onResetDepthSettings: () => void;
  onSmoothMesh: (iterations: number, strength: number) => void;
  onDecimateMesh: (ratio: number) => void;
  onCleanMesh: () => void;
  onFlipNormals: () => void;
  onRecalculateNormals: () => void;
  onMirrorMesh: (axis: 'x' | 'y') => void;
  onCropDepthZ: (minZ: number, maxZ: number) => void;
  onQuickExport: (format: 'obj' | 'stl' | 'glb' | 'ply') => void;
  onOpenExportModal?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  imageFile,
  imageDataUrl,
  imageDimensions,
  modelMetadata,
  depthMap,
  depthSettings,
  meshSettings,
  meshStats,
  materialSettings,
  sculptSettings,
  isProcessing,
  onImportImage,
  onReplaceImage,
  onRemoveImage,
  onLoadModel,
  onRunDepth,
  onDepthSettingsChange,
  onMeshSettingsChange,
  onMaterialSettingsChange,
  onSculptSettingsChange,
  onRegenerateMesh,
  onResetDepthSettings,
  onSmoothMesh,
  onDecimateMesh,
  onCleanMesh,
  onFlipNormals,
  onRecalculateNormals,
  onMirrorMesh,
  onCropDepthZ,
  onQuickExport,
  onOpenExportModal,
}) => {
  // Collapsible section state
  const [openSections, setOpenSections] = useState({
    image: true,
    ai: true,
    depth: true,
    material: true,
    mesh: false,
    cleanup: false,
    sculpt: false,
    export: false,
  });

  const [smoothIters, setSmoothIters] = useState(2);
  const [smoothStrength, setSmoothStrength] = useState(0.5);
  const [decimateRatio, setDecimateRatio] = useState(0.5);
  const [cropMinZ, setCropMinZ] = useState(-0.5);
  const [cropMaxZ, setCropMaxZ] = useState(1.5);

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const sculptTools: { tool: SculptTool; label: string; icon: any }[] = [
    { tool: 'push', label: 'Push', icon: Plus },
    { tool: 'pull', label: 'Pull', icon: Minus },
    { tool: 'smooth', label: 'Smooth', icon: Wand2 },
    { tool: 'flatten', label: 'Flatten', icon: Layers },
    { tool: 'inflate', label: 'Inflate', icon: Flame },
    { tool: 'none', label: 'View Only', icon: Move },
  ];

  const clayColorPresets = [
    { name: 'Studio Slate', color: '#a0aec0' },
    { name: 'Alabaster', color: '#f1f5f9' },
    { name: 'Terracotta', color: '#c2785c' },
    { name: 'Bronze', color: '#b48a5c' },
    { name: 'Dark Stone', color: '#334155' },
  ];

  return (
    <aside
      id="left-sidebar"
      className="w-full md:w-80 bg-[#12151a] border-r border-[#262c36] flex flex-col h-full overflow-hidden select-none shrink-0 text-gray-200"
    >
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[#222731]">
        {/* SECTION A: INPUT IMAGE */}
        <div className="p-3">
          <button
            id="toggle-section-image"
            onClick={() => toggleSection('image')}
            className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200"
          >
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Input Image</span>
            </span>
            {openSections.image ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.image && (
            <div className="mt-2.5 space-y-2.5">
              {imageDataUrl ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden border border-[#2b3340] bg-[#1a1f29] group">
                    <img
                      src={imageDataUrl}
                      alt="Source Input"
                      className="w-full h-36 object-contain bg-black/40"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={onReplaceImage}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs text-white font-medium shadow-md"
                      >
                        Replace
                      </button>
                      <button
                        onClick={onRemoveImage}
                        className="p-1 bg-red-600/80 hover:bg-red-600 rounded text-white shadow-md"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {imageDimensions && (
                    <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                      <span>{imageFile?.name || 'Image'}</span>
                      <span className="font-mono">
                        {imageDimensions.width} × {imageDimensions.height} px
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onClick={onImportImage}
                  className="border-2 border-dashed border-[#2f3948] hover:border-blue-500/70 hover:bg-[#161c26] rounded-xl p-5 text-center cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1e2531] text-blue-400 group-hover:text-blue-300 mx-auto flex items-center justify-center mb-2 shadow-inner">
                    <FolderUp className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-200 mb-0.5">Click or Drag & Drop Image</p>
                  <p className="text-[10px] text-gray-400">PNG, JPG, WEBP, BMP</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECTION B: AI INFERENCE */}
        <div className="p-3">
          <button
            id="toggle-section-ai"
            onClick={() => toggleSection('ai')}
            className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200"
          >
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Depth Engine</span>
            </span>
            {openSections.ai ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.ai && (
            <div className="mt-2.5 space-y-2.5 text-xs">
              {/* ONNX Model Status Card */}
              <div className="bg-[#181d26] p-2.5 rounded-lg border border-[#262c36] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        modelMetadata.isLoaded ? 'bg-emerald-400 shadow-emerald-400/50 shadow-sm' : 'bg-amber-400'
                      }`}
                    />
                    <span className="font-semibold text-gray-200 text-xs">
                      {modelMetadata.isLoaded ? modelMetadata.name : 'Built-in Saliency Engine'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {modelMetadata.isLoaded ? 'ONNX Active' : 'Fallback'}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Input Resolution:</span>
                    <span className="text-gray-300 font-mono">518 × 518</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Backend:</span>
                    <span className="text-indigo-300 font-semibold uppercase text-[10px]">
                      WebAssembly SIMD (Offline)
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLoadModel}
                  className="w-full py-1 px-2 rounded bg-[#202734] hover:bg-[#2c3647] text-gray-300 text-[11px] font-medium border border-[#313a48] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span>{modelMetadata.isLoaded ? 'Change ONNX Weights' : 'Load Local ONNX File'}</span>
                </button>
              </div>

              {/* Generate Button */}
              <button
                onClick={onRunDepth}
                disabled={!imageFile && !imageDataUrl || isProcessing}
                className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                  (imageFile || imageDataUrl) && !isProcessing
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white cursor-pointer shadow-indigo-950/50'
                    : 'bg-gray-800 text-gray-500 border border-gray-700/40 cursor-not-allowed'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : 'text-amber-300'}`} />
                <span>{isProcessing ? 'Estimating Depth Map...' : 'Generate 3D Model'}</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION C: MATERIAL & TEXTURE MAPPING */}
        <div className="p-3">
          <button
            id="toggle-section-material"
            onClick={() => toggleSection('material')}
            className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200"
          >
            <span className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400" />
              <span>Texture & Materials</span>
            </span>
            {openSections.material ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.material && (
            <div className="mt-2.5 space-y-3 text-xs">
              {/* Main Texture On/Off Switch Card */}
              <div className="bg-[#181d26] p-3 rounded-lg border border-[#262c36] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="font-semibold text-gray-100 block text-xs">Image Texture Map</span>
                      <span className="text-[10px] text-gray-400">Map original photo onto 3D relief</span>
                    </div>
                  </div>
                  <button
                    id="btn-toggle-texture-sidebar"
                    onClick={() =>
                      onMaterialSettingsChange({ showTexture: !materialSettings.showTexture })
                    }
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      materialSettings.showTexture ? 'bg-blue-600' : 'bg-gray-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        materialSettings.showTexture ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {materialSettings.showTexture ? (
                  <div className="flex items-center gap-2 pt-1 border-t border-[#262c36]">
                    {imageDataUrl ? (
                      <img
                        src={imageDataUrl}
                        alt="Texture thumbnail"
                        className="w-8 h-8 rounded object-cover border border-[#3b4759]"
                      />
                    ) : null}
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                      <Check className="w-3 h-3" />
                      <span>Original image mapped with UV coordinates</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-gray-400 pt-1 border-t border-[#262c36]">
                    Showing untextured solid PBR clay surface to highlight reliefs.
                  </div>
                )}
              </div>

              {/* Clay / Solid Surface Color (when texture is off) */}
              <div>
                <div className="flex justify-between text-gray-400 mb-1.5 text-[11px]">
                  <span>Solid Surface Preset</span>
                  <span className="font-mono text-gray-300">
                    {clayColorPresets.find((p) => p.color === materialSettings.clayColor)?.name || 'Custom'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {clayColorPresets.map((preset) => {
                    const isSelected = materialSettings.clayColor === preset.color;
                    return (
                      <button
                        key={preset.color}
                        onClick={() =>
                          onMaterialSettingsChange({
                            clayColor: preset.color,
                          })
                        }
                        className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center ${
                          isSelected
                            ? 'border-white scale-110 shadow-md ring-2 ring-blue-500/50'
                            : 'border-[#475569] hover:border-gray-300'
                        }`}
                        style={{ backgroundColor: preset.color }}
                        title={preset.name}
                      >
                        {isSelected && <Check className="w-3 h-3 text-black/70 font-bold" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Surface Roughness */}
              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Surface Roughness</span>
                  <span className="font-mono text-gray-200">{materialSettings.roughness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={materialSettings.roughness}
                  onChange={(e) =>
                    onMaterialSettingsChange({ roughness: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
                />
              </div>

              {/* Surface Metalness */}
              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Surface Metalness</span>
                  <span className="font-mono text-gray-200">{materialSettings.metalness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={materialSettings.metalness}
                  onChange={(e) =>
                    onMaterialSettingsChange({ metalness: parseFloat(e.target.value) })
                  }
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
                />
              </div>

              {/* Wireframe Overlay & Double Sided */}
              <div className="space-y-1.5 pt-1 border-t border-[#262c36]">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300 text-[11px]">Wireframe Overlay</span>
                  <input
                    type="checkbox"
                    checked={materialSettings.wireframeOverlay}
                    onChange={(e) =>
                      onMaterialSettingsChange({ wireframeOverlay: e.target.checked })
                    }
                    className="accent-blue-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300 text-[11px]">Double-Sided Rendering</span>
                  <input
                    type="checkbox"
                    checked={materialSettings.doubleSided}
                    onChange={(e) =>
                      onMaterialSettingsChange({ doubleSided: e.target.checked })
                    }
                    className="accent-blue-500 rounded"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* SECTION D: DEPTH ADJUSTMENTS */}
        <div className="p-3">
          <button
            id="toggle-section-depth"
            onClick={() => toggleSection('depth')}
            className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200"
          >
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Depth & Relief</span>
            </span>
            {openSections.depth ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.depth && (
            <div className="mt-2.5 space-y-3 text-xs">
              {/* Strength */}
              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Extrusion Strength</span>
                  <span className="font-mono text-gray-200">{depthSettings.strength.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.05"
                  value={depthSettings.strength}
                  onChange={(e) => onDepthSettingsChange({ strength: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
                />
              </div>

              {/* Scale */}
              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Depth Scale</span>
                  <span className="font-mono text-gray-200">{depthSettings.scale.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="4.0"
                  step="0.05"
                  value={depthSettings.scale}
                  onChange={(e) => onDepthSettingsChange({ scale: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
                />
              </div>

              {/* Offset */}
              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Depth Offset</span>
                  <span className="font-mono text-gray-200">{depthSettings.offset.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-0.8"
                  max="0.8"
                  step="0.02"
                  value={depthSettings.offset}
                  onChange={(e) => onDepthSettingsChange({ offset: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
                />
              </div>

              {/* Contrast */}
              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Depth Contrast</span>
                  <span className="font-mono text-gray-200">{depthSettings.contrast.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={depthSettings.contrast}
                  onChange={(e) => onDepthSettingsChange({ contrast: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
                />
              </div>

              {/* Background Clipping (Isolate Subject) */}
              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Background Isolation (Floor Clip)</span>
                  <span className="font-mono text-gray-200">
                    {depthSettings.nearClip > 0 ? `${(depthSettings.nearClip * 100).toFixed(0)}%` : 'Off'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="0.6"
                  step="0.02"
                  value={depthSettings.nearClip}
                  onChange={(e) => onDepthSettingsChange({ nearClip: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
                  title="Flattens background noise and isolates the main foreground subject"
                />
                <span className="text-[10px] text-gray-400">Flattens background plane to cleanly isolate subject</span>
              </div>

              {/* Invert & Smooth Edges Toggles */}
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Clean Border Falloff</span>
                  <input
                    type="checkbox"
                    checked={depthSettings.smoothEdges}
                    onChange={(e) => onDepthSettingsChange({ smoothEdges: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Invert Depth Direction</span>
                  <input
                    type="checkbox"
                    checked={depthSettings.invert}
                    onChange={(e) => onDepthSettingsChange({ invert: e.target.checked })}
                    className="accent-indigo-500 rounded"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={onResetDepthSettings}
                  className="flex-1 py-1.5 px-2 rounded bg-[#1f242d] hover:bg-[#282f3a] text-gray-300 text-xs border border-[#313a48]"
                >
                  Reset
                </button>
                <button
                  onClick={onRegenerateMesh}
                  className="flex-1 py-1.5 px-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Apply & Rebuild
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION E: MESH SETTINGS */}
        <div className="p-3">
          <button
            id="toggle-section-mesh"
            onClick={() => toggleSection('mesh')}
            className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200"
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mesh Geometry</span>
            </span>
            {openSections.mesh ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.mesh && (
            <div className="mt-2.5 space-y-3 text-xs">
              {/* Mesh Resolution */}
              <div>
                <div className="flex justify-between text-gray-400 mb-1">
                  <span>Mesh Grid Density</span>
                  <span className="font-mono text-gray-200">
                    {meshSettings.resolutionX} × {meshSettings.resolutionY}
                  </span>
                </div>
                <input
                  type="range"
                  min="64"
                  max="518"
                  step="32"
                  value={meshSettings.resolutionX}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onMeshSettingsChange({ resolutionX: val, resolutionY: val });
                  }}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
                />
              </div>

              {/* 3D Printable Solid Watertight Skirt */}
              <div className="bg-[#181d26] p-2.5 rounded-lg border border-[#262c36] space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-gray-200">Watertight Base (3D Print)</span>
                  <input
                    type="checkbox"
                    checked={meshSettings.generateBaseSkirt}
                    onChange={(e) => onMeshSettingsChange({ generateBaseSkirt: e.target.checked })}
                    className="accent-emerald-500 rounded"
                  />
                </label>

                {meshSettings.generateBaseSkirt && (
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1 text-[11px]">
                      <span>Base Thickness</span>
                      <span className="font-mono text-gray-200">
                        {meshSettings.baseThickness.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.8"
                      step="0.05"
                      value={meshSettings.baseThickness}
                      onChange={(e) =>
                        onMeshSettingsChange({ baseThickness: parseFloat(e.target.value) })
                      }
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
                    />
                  </div>
                )}
              </div>

              {/* Mesh Stats Display */}
              <div className="bg-[#181d26] p-2.5 rounded-lg border border-[#262c36] space-y-1 text-[11px] text-gray-400">
                <div className="flex justify-between">
                  <span>Vertices:</span>
                  <span className="text-gray-200 font-mono font-semibold">
                    {meshStats.vertexCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Triangles:</span>
                  <span className="text-gray-200 font-mono font-semibold">
                    {meshStats.triangleCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Dimensions:</span>
                  <span className="text-gray-200 font-mono">
                    {meshStats.boundingBox.width} × {meshStats.boundingBox.height} × {meshStats.boundingBox.depth}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated RAM:</span>
                  <span className="text-gray-200 font-mono">
                    {(meshStats.estimatedMemoryBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION F: MESH CLEANUP */}
        <div className="p-3">
          <button
            id="toggle-section-cleanup"
            onClick={() => toggleSection('cleanup')}
            className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200"
          >
            <span className="flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mesh Cleanup</span>
            </span>
            {openSections.cleanup ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.cleanup && (
            <div className="mt-2.5 space-y-3 text-xs">
              {/* Laplacian Smoothing */}
              <div className="bg-[#181d26] p-2.5 rounded border border-[#262c36] space-y-2">
                <div className="font-medium text-gray-200 flex items-center justify-between">
                  <span>Laplacian Smoothing</span>
                  <span className="text-[10px] text-gray-400">{smoothIters} iters</span>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-[11px] text-gray-400 w-14">Strength</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={smoothStrength}
                    onChange={(e) => setSmoothStrength(parseFloat(e.target.value))}
                    className="flex-1 accent-cyan-500 h-1.5 bg-[#252b36] rounded"
                  />
                  <span className="text-gray-200 font-mono text-[11px] w-8 text-right">
                    {smoothStrength.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => onSmoothMesh(smoothIters, smoothStrength)}
                  className="w-full py-1.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 text-xs font-medium border border-cyan-700/50"
                >
                  Apply Smoothing
                </button>
              </div>

              {/* Decimation */}
              <div className="bg-[#181d26] p-2.5 rounded border border-[#262c36] space-y-2">
                <div className="font-medium text-gray-200 flex items-center justify-between">
                  <span>Mesh Decimation</span>
                  <span className="text-cyan-300 font-mono text-[11px]">
                    {(decimateRatio * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={decimateRatio}
                  onChange={(e) => setDecimateRatio(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-[#252b36] rounded"
                />
                <button
                  onClick={() => onDecimateMesh(decimateRatio)}
                  className="w-full py-1.5 rounded bg-[#1f242d] hover:bg-[#282f3a] text-gray-200 text-xs font-medium border border-[#313a48]"
                >
                  Decimate Faces
                </button>
              </div>

              {/* Quick Topology Tools */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={onCleanMesh}
                  className="p-1.5 rounded bg-[#1f242d] hover:bg-[#282f3a] text-gray-200 text-xs border border-[#313a48] flex items-center justify-center gap-1"
                  title="Remove isolated vertices and degenerate faces"
                >
                  <Eraser className="w-3 h-3 text-cyan-400" />
                  <span>Clean Topology</span>
                </button>

                <button
                  onClick={onFlipNormals}
                  className="p-1.5 rounded bg-[#1f242d] hover:bg-[#282f3a] text-gray-200 text-xs border border-[#313a48] flex items-center justify-center gap-1"
                  title="Invert surface normal vectors"
                >
                  <FlipHorizontal className="w-3 h-3 text-cyan-400" />
                  <span>Flip Normals</span>
                </button>
              </div>

              <button
                onClick={onRecalculateNormals}
                className="w-full py-1.5 rounded bg-[#1f242d] hover:bg-[#282f3a] text-gray-300 text-xs border border-[#313a48]"
              >
                Recalculate Normals
              </button>
            </div>
          )}
        </div>

        {/* SECTION G: SCULPT & BRUSHES */}
        <div className="p-3">
          <button
            id="toggle-section-sculpt"
            onClick={() => toggleSection('sculpt')}
            className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200"
          >
            <span className="flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5 text-rose-400" />
              <span>Sculpt & Brushes</span>
            </span>
            {openSections.sculpt ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.sculpt && (
            <div className="mt-2.5 space-y-3 text-xs">
              {/* Sculpt Tool Selection */}
              <div className="grid grid-cols-3 gap-1.5">
                {sculptTools.map((item) => {
                  const Icon = item.icon;
                  const isActive = sculptSettings.activeTool === item.tool;
                  return (
                    <button
                      key={item.tool}
                      onClick={() => onSculptSettingsChange({ activeTool: item.tool })}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-md border text-[11px] font-medium transition-all ${
                        isActive
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-semibold'
                          : 'bg-[#181d26] border-[#2b3340] text-gray-300 hover:bg-[#202632]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 mb-1" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {sculptSettings.activeTool !== 'none' && (
                <div className="bg-[#181d26] p-2.5 rounded border border-[#262c36] space-y-2.5">
                  {/* Brush Radius */}
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1 text-[11px]">
                      <span>Brush Radius</span>
                      <span className="font-mono text-gray-200">
                        {sculptSettings.brushRadius.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.02"
                      value={sculptSettings.brushRadius}
                      onChange={(e) =>
                        onSculptSettingsChange({ brushRadius: parseFloat(e.target.value) })
                      }
                      className="w-full accent-rose-500 h-1.5 bg-[#252b36] rounded"
                    />
                  </div>

                  {/* Brush Strength */}
                  <div>
                    <div className="flex justify-between text-gray-400 mb-1 text-[11px]">
                      <span>Brush Strength</span>
                      <span className="font-mono text-gray-200">
                        {(sculptSettings.brushStrength * 100).toFixed(0)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={sculptSettings.brushStrength}
                      onChange={(e) =>
                        onSculptSettingsChange({ brushStrength: parseFloat(e.target.value) })
                      }
                      className="w-full accent-rose-500 h-1.5 bg-[#252b36] rounded"
                    />
                  </div>

                  {/* Falloff Curve */}
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-1">Falloff Curve</span>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      {(['gaussian', 'cosine', 'linear'] as const).map((falloff) => (
                        <button
                          key={falloff}
                          onClick={() => onSculptSettingsChange({ brushFalloff: falloff })}
                          className={`py-1 rounded border capitalize ${
                            sculptSettings.brushFalloff === falloff
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-medium'
                              : 'bg-[#1f242d] border-[#313a48] text-gray-400'
                          }`}
                        >
                          {falloff}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Mesh Geometry Transforms */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-gray-400 font-medium">Mirror Symmetry</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onMirrorMesh('x')}
                    className="py-1.5 px-2 rounded bg-[#1f242d] hover:bg-[#282f3a] text-gray-300 text-xs border border-[#313a48]"
                  >
                    Mirror X
                  </button>
                  <button
                    onClick={() => onMirrorMesh('y')}
                    className="py-1.5 px-2 rounded bg-[#1f242d] hover:bg-[#282f3a] text-gray-300 text-xs border border-[#313a48]"
                  >
                    Mirror Y
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION H: EXPORT */}
        <div className="p-3">
          <button
            id="toggle-section-export"
            onClick={() => toggleSection('export')}
            className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-200"
          >
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Quick 3D Export</span>
            </span>
            {openSections.export ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>

          {openSections.export && (
            <div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onQuickExport('obj')}
                  className="p-2 rounded-lg bg-[#181d26] hover:bg-[#222936] border border-[#2b3340] text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-gray-100">.OBJ + MTL</div>
                  <div className="text-[10px] text-gray-400">Mesh & Texture</div>
                </button>

                <button
                  onClick={() => onQuickExport('stl')}
                  className="p-2 rounded-lg bg-[#181d26] hover:bg-[#222936] border border-[#2b3340] text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-gray-100">.STL (Print)</div>
                  <div className="text-[10px] text-gray-400">Binary 3D Model</div>
                </button>

                <button
                  onClick={() => onQuickExport('glb')}
                  className="p-2 rounded-lg bg-[#181d26] hover:bg-[#222936] border border-[#2b3340] text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-gray-100">.GLB (glTF)</div>
                  <div className="text-[10px] text-gray-400">Standard PBR</div>
                </button>

                <button
                  onClick={() => onQuickExport('ply')}
                  className="p-2 rounded-lg bg-[#181d26] hover:bg-[#222936] border border-[#2b3340] text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-gray-100">.PLY</div>
                  <div className="text-[10px] text-gray-400">Polygon Format</div>
                </button>
              </div>

              {onOpenExportModal && (
                <div className="mt-2.5">
                  <button
                    onClick={onOpenExportModal}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/40 hover:to-indigo-600/40 border border-blue-500/40 text-blue-300 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span>Export HTML & CSS Code</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
