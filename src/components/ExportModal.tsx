/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  Check,
  Code2,
  Copy,
  Download,
  Eye,
  FileBox,
  FileCode2,
  Globe,
  Layers,
  Maximize2,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';
import { ExportService } from '../services/exportService';
import {
  CodeExportService,
  HtmlCssExportOptions,
  GeneratedCodeResult,
} from '../services/codeExportService';
import { DepthMapData, MeshStats } from '../types';

interface ExportModalProps {
  geometry: THREE.BufferGeometry | null;
  imageDataUrl: string | null;
  depthMap: DepthMapData | null;
  meshStats: MeshStats;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  geometry,
  imageDataUrl,
  depthMap,
  meshStats,
  onClose,
}) => {
  // Main Tab: '3d-files' or 'html-css'
  const [activeMainTab, setActiveMainTab] = useState<'3d-files' | 'html-css'>('3d-files');

  // 3D File Options
  const [format, setFormat] = useState<'obj' | 'stl' | 'glb' | 'ply'>('obj');
  const [baseName, setBaseName] = useState('model_3d');
  const [stlBinary, setStlBinary] = useState(true);
  const [bundleObjTextures, setBundleObjTextures] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // HTML & CSS Code Export State
  const [codeOptions, setCodeOptions] = useState<HtmlCssExportOptions>({
    theme: 'dark-glass',
    embedType: 'threejs-embed',
    autoRotate: true,
    mouseParallax: true,
    showTexture: true,
    wireframe: false,
    containerWidth: '100%',
    containerHeight: '420px',
    borderRadius: '16px',
  });

  const [activeCodeTab, setActiveCodeTab] = useState<'all' | 'html' | 'css'>('all');
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCodeResult | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Generate code on option changes
  useEffect(() => {
    if (!geometry || activeMainTab !== 'html-css') return;

    let isMounted = true;
    setIsGeneratingCode(true);

    const mesh = new THREE.Mesh(geometry);

    CodeExportService.generateFullDocument(mesh, codeOptions, imageDataUrl)
      .then((res) => {
        if (isMounted) {
          setGeneratedCode(res);
          setIsGeneratingCode(false);
        }
      })
      .catch((err) => {
        console.error('Error generating HTML/CSS code:', err);
        if (isMounted) setIsGeneratingCode(false);
      });

    return () => {
      isMounted = false;
    };
  }, [geometry, codeOptions, imageDataUrl, activeMainTab]);

  if (!geometry) return null;

  const handleExport3DFile = async () => {
    setIsExporting(true);
    try {
      const mesh = new THREE.Mesh(geometry);

      if (format === 'obj') {
        await ExportService.exportOBJ(mesh, baseName, bundleObjTextures ? imageDataUrl || undefined : undefined);
      } else if (format === 'stl') {
        ExportService.exportSTL(mesh, baseName, stlBinary);
      } else if (format === 'glb') {
        await ExportService.exportGLB(mesh, baseName);
      } else if (format === 'ply') {
        ExportService.exportPLY(mesh, baseName, true);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyCode = async (type: 'html' | 'css' | 'all') => {
    if (!generatedCode) return;
    let textToCopy = '';
    if (type === 'html') textToCopy = generatedCode.html;
    else if (type === 'css') textToCopy = generatedCode.css;
    else textToCopy = generatedCode.fullHtmlDocument;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      // Fallback copy
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(null), 2500);
    }
  };

  const handleDownloadHtmlFile = () => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode.fullHtmlDocument], { type: 'text/html;charset=utf-8' });
    ExportService.triggerDownload(blob, `${baseName}_3d_embed.html`);
  };

  return (
    <div
      id="modal-export-3d"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 select-none"
    >
      <div className="bg-[#141822] border border-[#272f3d] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with Main Tabs */}
        <div className="h-14 bg-[#181d2a] px-4 md:px-6 flex items-center justify-between border-b border-[#272f3d] text-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex bg-[#0e121a] p-1 rounded-xl border border-[#272f3d]">
              <button
                onClick={() => setActiveMainTab('3d-files')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMainTab === '3d-files'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <FileBox className="w-3.5 h-3.5" />
                <span>3D File Formats</span>
              </button>
              <button
                onClick={() => setActiveMainTab('html-css')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeMainTab === 'html-css'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>HTML & CSS Code</span>
                <span className="bg-blue-500/30 text-blue-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  NEW
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#252c38] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 text-xs text-gray-200 custom-scrollbar">
          {activeMainTab === '3d-files' ? (
            /* 3D FILE FORMATS TAB */
            <div className="space-y-4 max-w-xl mx-auto">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Output File Name</label>
                <input
                  type="text"
                  value={baseName}
                  onChange={(e) => setBaseName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0f1318] border border-[#2b3340] text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1.5 font-medium">Select 3D Format</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'obj',
                      name: 'Wavefront .OBJ',
                      desc: 'Includes MTL & Texture Bundle in ZIP',
                      icon: FileBox,
                    },
                    {
                      id: 'stl',
                      name: 'STL (3D Printing)',
                      desc: 'Binary / ASCII for slicers',
                      icon: Printer,
                    },
                    {
                      id: 'glb',
                      name: 'GLB / glTF 2.0',
                      desc: 'Embedded PBR Material & textures',
                      icon: FileCode2,
                    },
                    {
                      id: 'ply',
                      name: 'Polygon .PLY',
                      desc: 'Dense vertex / point cloud geometry',
                      icon: Layers,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = format === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setFormat(item.id as any)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                            : 'bg-[#12151c] border-[#252b36] hover:bg-[#1a1f28]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-gray-400'}`} />
                          <span className="font-bold text-xs">{item.name}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {format === 'obj' && (
                <div className="bg-[#12151c] p-3 rounded-lg border border-[#252b36]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bundleObjTextures}
                      onChange={(e) => setBundleObjTextures(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Package OBJ, MTL & diffuse texture into a ZIP bundle</span>
                  </label>
                </div>
              )}

              {format === 'stl' && (
                <div className="bg-[#12151c] p-3 rounded-lg border border-[#252b36]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={stlBinary}
                      onChange={(e) => setStlBinary(e.target.checked)}
                      className="accent-emerald-500 rounded"
                    />
                    <span>Binary STL format (compact file size for 3D printers)</span>
                  </label>
                </div>
              )}

              {/* Model Statistics Snapshot */}
              <div className="bg-[#0f1318] p-3.5 rounded-xl border border-[#252b36] flex justify-between text-[11px] font-mono text-gray-400">
                <div>
                  Vertices: <span className="text-gray-200 font-semibold">{meshStats.vertexCount.toLocaleString()}</span>
                </div>
                <div>
                  Faces: <span className="text-gray-200 font-semibold">{meshStats.triangleCount.toLocaleString()}</span>
                </div>
                <div>
                  Size:{' '}
                  <span className="text-gray-200 font-semibold">
                    {meshStats.boundingBox.width}×{meshStats.boundingBox.height}×{meshStats.boundingBox.depth}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* HTML & CSS CODE GENERATOR TAB */
            <div className="space-y-4">
              {/* Type of Web Component */}
              <div>
                <label className="block text-gray-400 mb-1.5 font-medium">Embed Type</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'threejs-embed',
                      title: 'Interactive 3D Embed',
                      desc: 'HTML + CSS + WebGL Canvas with Orbit & Parallax',
                      icon: Globe,
                    },
                    {
                      id: 'css-parallax-card',
                      title: 'Pure CSS 3D Card',
                      desc: 'Zero-JS HTML + CSS 3D Perspective & Depth tilt',
                      icon: Layers,
                    },
                    {
                      id: 'css-mesh-gradient',
                      title: 'CSS Mesh Topology',
                      desc: 'Pure CSS radial mesh gradient background',
                      icon: Sparkles,
                    },
                  ].map((item) => {
                    const isSelected = codeOptions.embedType === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() =>
                          setCodeOptions((prev) => ({ ...prev, embedType: item.id as any }))
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white shadow-md'
                            : 'bg-[#10141d] border-[#222938] hover:bg-[#161c28] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                          <span className="font-bold text-xs">{item.title}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">{item.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controls & Configuration Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0e121a] p-3 rounded-xl border border-[#222938]">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">CSS Theme</label>
                  <select
                    value={codeOptions.theme}
                    onChange={(e) =>
                      setCodeOptions((prev) => ({ ...prev, theme: e.target.value as any }))
                    }
                    className="w-full bg-[#181d2a] border border-[#2d3546] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="dark-glass">Dark Glassmorphism</option>
                    <option value="cyber-glow">Cyberpunk Neon</option>
                    <option value="minimal-light">Clean Minimal Light</option>
                    <option value="studio-black">Studio Deep Black</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Container Height</label>
                  <select
                    value={codeOptions.containerHeight}
                    onChange={(e) =>
                      setCodeOptions((prev) => ({ ...prev, containerHeight: e.target.value }))
                    }
                    className="w-full bg-[#181d2a] border border-[#2d3546] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="360px">Compact (360px)</option>
                    <option value="420px">Standard (420px)</option>
                    <option value="520px">Large (520px)</option>
                    <option value="100vh">Full Viewport (100vh)</option>
                  </select>
                </div>

                {codeOptions.embedType === 'threejs-embed' && (
                  <>
                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-1.5 text-gray-300">
                        <input
                          type="checkbox"
                          checked={codeOptions.autoRotate}
                          onChange={(e) =>
                            setCodeOptions((prev) => ({ ...prev, autoRotate: e.target.checked }))
                          }
                          className="accent-blue-500 rounded"
                        />
                        <span>Auto-Rotate</span>
                      </label>
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer pb-1.5 text-gray-300">
                        <input
                          type="checkbox"
                          checked={codeOptions.mouseParallax}
                          onChange={(e) =>
                            setCodeOptions((prev) => ({ ...prev, mouseParallax: e.target.checked }))
                          }
                          className="accent-blue-500 rounded"
                        />
                        <span>Mouse Parallax</span>
                      </label>
                    </div>
                  </>
                )}
              </div>

              {/* Live Preview Toggle & Code Tabs */}
              <div className="flex items-center justify-between border-b border-[#272f3d] pb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveCodeTab('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeCodeTab === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#181d2a] text-gray-400 hover:text-white'
                    }`}
                  >
                    Complete HTML File
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('html')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeCodeTab === 'html'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#181d2a] text-gray-400 hover:text-white'
                    }`}
                  >
                    HTML Code
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('css')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeCodeTab === 'css'
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#181d2a] text-gray-400 hover:text-white'
                    }`}
                  >
                    CSS Code
                  </button>
                </div>

                <button
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                    showLivePreview
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                      : 'bg-[#181d2a] text-gray-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showLivePreview ? 'Hide Live Sandbox' : 'Show Live Sandbox'}</span>
                </button>
              </div>

              {/* Code Box & Live Sandbox Grid */}
              <div className={`grid ${showLivePreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {/* Code Viewer */}
                <div className="relative bg-[#0b0e14] rounded-xl border border-[#222938] overflow-hidden flex flex-col h-80">
                  <div className="h-9 bg-[#121620] px-3 flex items-center justify-between border-b border-[#222938] text-gray-400 font-mono text-[11px]">
                    <span>
                      {activeCodeTab === 'all'
                        ? 'index.html (Self-Contained)'
                        : activeCodeTab === 'html'
                        ? 'markup.html'
                        : 'styles.css'}
                    </span>
                    <button
                      onClick={() => handleCopyCode(activeCodeTab)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#202736] hover:bg-blue-600 hover:text-white text-gray-200 transition-colors cursor-pointer"
                    >
                      {copyFeedback === activeCodeTab ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="flex-1 p-3 overflow-auto font-mono text-[11px] text-gray-300 custom-scrollbar leading-relaxed whitespace-pre select-text">
                    {isGeneratingCode ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Generating optimized code snippet...
                      </div>
                    ) : generatedCode ? (
                      activeCodeTab === 'all'
                        ? generatedCode.fullHtmlDocument
                        : activeCodeTab === 'html'
                        ? generatedCode.html
                        : generatedCode.css
                    ) : null}
                  </pre>
                </div>

                {/* Live Sandbox Preview */}
                {showLivePreview && (
                  <div className="bg-[#0b0e14] rounded-xl border border-[#222938] overflow-hidden flex flex-col h-80">
                    <div className="h-9 bg-[#121620] px-3 flex items-center justify-between border-b border-[#222938] text-gray-400 font-mono text-[11px]">
                      <span className="flex items-center gap-1.5 text-blue-400">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Live Sandbox Preview</span>
                      </span>
                      <span className="text-[10px] text-gray-500">Interactive Canvas / CSS</span>
                    </div>
                    <div className="flex-1 w-full h-full bg-[#0e121a]">
                      {generatedCode?.previewSrcDoc ? (
                        <iframe
                          title="HTML/CSS 3D Preview"
                          srcDoc={generatedCode.previewSrcDoc}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          Rendering interactive sandbox...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="h-16 bg-[#181d2a] px-4 md:px-6 flex items-center justify-between border-t border-[#272f3d] shrink-0">
          <div className="text-[11px] text-gray-400 font-mono hidden sm:block">
            {activeMainTab === '3d-files'
              ? 'Files exported directly to your computer'
              : 'Self-contained code ready to copy-paste into Webflow, WordPress, or React'}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#252c38] hover:bg-[#313a4a] text-xs text-gray-300 font-medium transition-colors cursor-pointer"
            >
              Close
            </button>

            {activeMainTab === '3d-files' ? (
              <button
                onClick={handleExport3DFile}
                disabled={isExporting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exporting...' : `Export .${format.toUpperCase()}`}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyCode('all')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2b3548] hover:bg-[#38455e] text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  {copyFeedback === 'all' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copyFeedback === 'all' ? 'Copied Full HTML!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={handleDownloadHtmlFile}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .HTML File</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
