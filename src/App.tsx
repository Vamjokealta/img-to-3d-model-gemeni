/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import {
  AppSettings,
  DepthMapData,
  DepthSettings,
  MaterialSettings,
  MeshSettings,
  MeshStats,
  ModelMetadata,
  SculptSettings,
} from './types';
import { aiDepthService } from './services/aiDepthService';
import { MeshGenerator } from './services/meshGenerator';
import { MeshCleanup } from './services/meshCleanup';
import { MeshSculpt } from './services/meshSculpt';
import { ExportService } from './services/exportService';
import { ProjectService } from './services/projectService';
import { logger } from './services/logger';

import { TopToolbar } from './components/TopToolbar';
import { LeftSidebar } from './components/LeftSidebar';
import { Viewport3D } from './components/Viewport3D';
import { BottomStatusBar } from './components/BottomStatusBar';
import { DepthPreviewModal } from './components/DepthPreviewModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { FirstRunGuide } from './components/FirstRunGuide';

export default function App() {
  // 1. Image State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [textureImageElement, setTextureImageElement] = useState<HTMLImageElement | null>(null);

  // 2. AI & Depth State
  const [modelMetadata, setModelMetadata] = useState<ModelMetadata>(aiDepthService.getMetadata());
  const [depthMap, setDepthMap] = useState<DepthMapData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 3. Settings State
  const [depthSettings, setDepthSettings] = useState<DepthSettings>({
    strength: 1.0,
    scale: 1.0,
    offset: 0.0,
    contrast: 1.0,
    invert: false,
    smoothness: 10,
    nearClip: 0.0,
    farClip: 1.0,
    smoothEdges: true,
  });

  const [meshSettings, setMeshSettings] = useState<MeshSettings>({
    resolutionX: 256,
    resolutionY: 256,
    generateBaseSkirt: false,
    baseThickness: 0.2,
    smoothNormals: true,
    simplifyRatio: 1.0,
  });

  const [materialSettings, setMaterialSettings] = useState<MaterialSettings>({
    showTexture: true,
    textureIntensity: 1.0,
    roughness: 0.5,
    metalness: 0.1,
    wireframeOverlay: false,
    clayColor: '#a0aec0',
    doubleSided: true,
  });

  const [sculptSettings, setSculptSettings] = useState<SculptSettings>({
    activeTool: 'none',
    brushRadius: 0.25,
    brushStrength: 0.4,
    brushFalloff: 'gaussian',
    mirrorX: false,
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    preferredBackend: 'wasm',
    threadCount: 4,
    defaultExportFormat: 'obj',
    autoFitCamera: true,
    theme: 'dark',
    highPrecisionDepth: true,
  });

  // Mobile layout state: toggle between 'controls' and 'viewport' on small screens
  const [mobileTab, setMobileTab] = useState<'controls' | 'viewport'>('viewport');

  // 4. Mesh Geometry & History State
  const [currentGeometry, setCurrentGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [meshStats, setMeshStats] = useState<MeshStats>({
    vertexCount: 0,
    triangleCount: 0,
    faceCount: 0,
    boundingBox: { width: 0, height: 0, depth: 0 },
    estimatedMemoryBytes: 0,
  });

  const historyStack = useRef<THREE.BufferGeometry[]>([]);
  const historyIndex = useRef<number>(-1);
  const [, setHistoryVersion] = useState(0);

  // 5. Modals State
  const [isDepthModalOpen, setIsDepthModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  // Hidden File Inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Update Mesh Stats on geometry change
  useEffect(() => {
    if (currentGeometry) {
      const stats = MeshGenerator.getStats(currentGeometry);
      setMeshStats(stats);
    } else {
      setMeshStats({
        vertexCount: 0,
        triangleCount: 0,
        faceCount: 0,
        boundingBox: { width: 0, height: 0, depth: 0 },
        estimatedMemoryBytes: 0,
      });
    }
  }, [currentGeometry]);

  // Memory-Safe History Stack (capped at 6 items, explicitly disposes discarded BufferGeometries)
  const pushHistory = useCallback((geo: THREE.BufferGeometry) => {
    // Dispose forward redo geometries that are discarded
    if (historyIndex.current < historyStack.current.length - 1) {
      const discarded = historyStack.current.slice(historyIndex.current + 1);
      discarded.forEach((g) => g.dispose());
    }

    const newStack = historyStack.current.slice(0, historyIndex.current + 1);
    while (newStack.length >= 6) {
      const shifted = newStack.shift();
      shifted?.dispose();
    }

    newStack.push(geo.clone());
    historyStack.current = newStack;
    historyIndex.current = newStack.length - 1;
    setHistoryVersion((v) => v + 1);
  }, []);

  const clearHistory = useCallback(() => {
    historyStack.current.forEach((g) => g.dispose());
    historyStack.current = [];
    historyIndex.current = -1;
    setHistoryVersion((v) => v + 1);
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndex.current > 0) {
      historyIndex.current -= 1;
      const prevGeo = historyStack.current[historyIndex.current].clone();
      setCurrentGeometry((old) => {
        old?.dispose();
        return prevGeo;
      });
      setHistoryVersion((v) => v + 1);
      logger.info('Undo performed');
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndex.current < historyStack.current.length - 1) {
      historyIndex.current += 1;
      const nextGeo = historyStack.current[historyIndex.current].clone();
      setCurrentGeometry((old) => {
        old?.dispose();
        return nextGeo;
      });
      setHistoryVersion((v) => v + 1);
      logger.info('Redo performed');
    }
  }, []);

  // Depth Estimation Pipeline
  const triggerDepthEstimation = useCallback(
    async (
      imgElem: HTMLImageElement | null = textureImageElement,
      overrideDims?: { width: number; height: number }
    ) => {
      if (!imgElem) return;

      setIsProcessing(true);
      logger.info('Starting AI depth map inference...');

      try {
        const dMap = await aiDepthService.estimateDepth(imgElem, 518);
        setDepthMap(dMap);

        // Calculate aspect ratio safely
        const w = overrideDims?.width || imageDimensions?.width || imgElem.naturalWidth || imgElem.width || 1;
        const h = overrideDims?.height || imageDimensions?.height || imgElem.naturalHeight || imgElem.height || 1;
        const aspect = Math.max(0.1, w / Math.max(1, h));

        const geo = MeshGenerator.generateMesh(dMap, depthSettings, meshSettings, aspect);
        setCurrentGeometry((old) => {
          old?.dispose();
          return geo;
        });
        pushHistory(geo);

        // On mobile, switch to 3D Viewport to inspect generated mesh
        setMobileTab('viewport');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error('Depth estimation error', msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [depthSettings, meshSettings, imageDimensions, textureImageElement, pushHistory]
  );

  // Image Import Handler
  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      logger.warn('Selected file is not an image format', file.name);
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageDataUrl(dataUrl);

      const img = new Image();
      img.onload = () => {
        const dims = {
          width: img.naturalWidth || img.width || 512,
          height: img.naturalHeight || img.height || 512,
        };
        setImageDimensions(dims);
        setTextureImageElement(img);
        logger.success(`Imported image: ${file.name}`, `${dims.width}×${dims.height}px`);

        // Automatically trigger depth estimation on new image with accurate dimensions
        triggerDepthEstimation(img, dims);
      };
      img.onerror = () => {
        logger.error('Failed to parse imported image format');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      logger.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }, [triggerDepthEstimation]);

  // ONNX Model Load Handler
  const handleModelFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.onnx')) {
      logger.warn('Please select a valid .onnx model file', file.name);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const meta = await aiDepthService.loadModelFromBuffer(
        buffer,
        file.name,
        appSettings.preferredBackend
      );
      setModelMetadata(meta);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Failed to load ONNX model', msg);
    }
  }, [appSettings.preferredBackend]);

  // Re-generate Mesh from existing depth map
  const handleRegenerateMesh = () => {
    if (!depthMap) return;
    const aspect = (imageDimensions?.width || 1) / (imageDimensions?.height || 1);
    const geo = MeshGenerator.generateMesh(depthMap, depthSettings, meshSettings, aspect);
    setCurrentGeometry((old) => {
      old?.dispose();
      return geo;
    });
    pushHistory(geo);
    setMobileTab('viewport');
  };

  // Cleanup Operations
  const handleSmoothMesh = (iterations: number, strength: number) => {
    if (!currentGeometry) return;
    const smoothed = MeshCleanup.smoothMesh(currentGeometry, iterations, strength);
    setCurrentGeometry((old) => {
      old?.dispose();
      return smoothed;
    });
    pushHistory(smoothed);
  };

  const handleDecimateMesh = (ratio: number) => {
    if (!currentGeometry) return;
    const decimated = MeshCleanup.decimateMesh(currentGeometry, ratio);
    setCurrentGeometry((old) => {
      old?.dispose();
      return decimated;
    });
    pushHistory(decimated);
  };

  const handleCleanMesh = () => {
    if (!currentGeometry) return;
    const cleaned = MeshCleanup.removeIsolatedAndDegenerates(currentGeometry);
    setCurrentGeometry((old) => {
      old?.dispose();
      return cleaned;
    });
    pushHistory(cleaned);
  };

  const handleFlipNormals = () => {
    if (!currentGeometry) return;
    const flipped = MeshCleanup.flipNormals(currentGeometry);
    setCurrentGeometry((old) => {
      old?.dispose();
      return flipped;
    });
    pushHistory(flipped);
  };

  const handleRecalculateNormals = () => {
    if (!currentGeometry) return;
    const recalculated = MeshCleanup.recalculateNormals(currentGeometry);
    setCurrentGeometry((old) => {
      old?.dispose();
      return recalculated;
    });
    pushHistory(recalculated);
  };

  const handleMirrorMesh = (axis: 'x' | 'y') => {
    if (!currentGeometry) return;
    const mirrored = MeshSculpt.mirrorGeometry(currentGeometry, axis);
    setCurrentGeometry((old) => {
      old?.dispose();
      return mirrored;
    });
    pushHistory(mirrored);
  };

  const handleCropDepthZ = (minZ: number, maxZ: number) => {
    if (!currentGeometry) return;
    const cropped = MeshSculpt.cropGeometry(currentGeometry, minZ, maxZ);
    setCurrentGeometry((old) => {
      old?.dispose();
      return cropped;
    });
    pushHistory(cropped);
  };

  const handleMeshModified = (modifiedGeo: THREE.BufferGeometry) => {
    setCurrentGeometry((old) => {
      old?.dispose();
      return modifiedGeo;
    });
    pushHistory(modifiedGeo);
  };

  // Quick Export
  const handleQuickExport = async (fmt: 'obj' | 'stl' | 'glb' | 'ply') => {
    if (!currentGeometry) return;
    const mesh = new THREE.Mesh(currentGeometry);
    if (fmt === 'obj') {
      await ExportService.exportOBJ(mesh, 'model_3d', imageDataUrl || undefined);
    } else if (fmt === 'stl') {
      ExportService.exportSTL(mesh, 'model_3d', true);
    } else if (fmt === 'glb') {
      await ExportService.exportGLB(mesh, 'model_3d');
    } else if (fmt === 'ply') {
      ExportService.exportPLY(mesh, 'model_3d', true);
    }
  };

  // Project Save & Load
  const handleSaveProject = () => {
    if (!imageDataUrl) return;
    ProjectService.saveProject(
      imageFile ? imageFile.name : 'project',
      imageDataUrl,
      depthMap,
      depthSettings,
      meshSettings,
      'ImageTo3D_Project.my3d'
    );
  };

  const handleOpenProject = async (file: File) => {
    try {
      const data = await ProjectService.loadProject(file);
      setImageDataUrl(data.imageDataUrl);
      setDepthSettings(data.depthSettings);
      setMeshSettings(data.meshSettings);

      const img = new Image();
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        setImageDimensions(dims);
        setTextureImageElement(img);

        if (data.depthMap) {
          setDepthMap(data.depthMap);
          const aspect = img.naturalWidth / img.naturalHeight;
          const geo = MeshGenerator.generateMesh(
            data.depthMap,
            data.depthSettings,
            data.meshSettings,
            aspect
          );
          setCurrentGeometry((old) => {
            old?.dispose();
            return geo;
          });
          pushHistory(geo);
          setMobileTab('viewport');
        }
      };
      img.src = data.imageDataUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error('Failed to load project file', msg);
    }
  };

  // Global Drag & Drop Handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.onnx')) {
        handleModelFile(file);
      } else if (file.name.endsWith('.my3d') || file.name.endsWith('.json')) {
        handleOpenProject(file);
      } else if (file.type.startsWith('image/')) {
        handleImageFile(file);
      }
    }
  };

  // Initial Sample Generator for immediate demonstration
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Create a high relief geometric medallion pattern
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#cbd5e1');
    grad.addColorStop(0.7, '#475569');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Center Emblem Relief
    ctx.beginPath();
    ctx.arc(256, 256, 140, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(256, 256, 100, 0, Math.PI * 2);
    ctx.fillStyle = '#334155';
    ctx.fill();

    // Central star
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x = 256 + Math.cos(angle) * 75;
      const y = 256 + Math.sin(angle) * 75;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();

    const dataUrl = canvas.toDataURL('image/png');
    setImageDataUrl(dataUrl);

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: 512, height: 512 });
      setTextureImageElement(img);
      triggerDepthEstimation(img, { width: 512, height: 512 });
    };
    img.src = dataUrl;
  }, []);

  return (
    <div
      id="image-to-3d-app"
      className="flex flex-col h-screen w-screen bg-[#0e1116] text-gray-200 overflow-hidden font-sans select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden File Inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/bmp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
          e.target.value = '';
        }}
      />

      <input
        ref={modelInputRef}
        type="file"
        accept=".onnx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleModelFile(e.target.files[0]);
          e.target.value = '';
        }}
      />

      <input
        ref={projectInputRef}
        type="file"
        accept=".my3d,.json"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleOpenProject(e.target.files[0]);
          e.target.value = '';
        }}
      />

      {/* Top Toolbar */}
      <TopToolbar
        hasImage={!!imageDataUrl}
        hasMesh={!!currentGeometry}
        isProcessing={isProcessing}
        canUndo={historyIndex.current > 0}
        canRedo={historyIndex.current < historyStack.current.length - 1}
        modelMetadata={modelMetadata}
        depthMap={depthMap}
        materialSettings={materialSettings}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        onImportImageClick={() => imageInputRef.current?.click()}
        onLoadModelClick={() => modelInputRef.current?.click()}
        onRunDepthEstimation={() => triggerDepthEstimation(textureImageElement)}
        onToggleTexture={() =>
          setMaterialSettings((prev) => ({ ...prev, showTexture: !prev.showTexture }))
        }
        onOpenProjectClick={() => projectInputRef.current?.click()}
        onSaveProjectClick={handleSaveProject}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenHelp={() => setIsGuideModalOpen(true)}
        onOpenDepthView={() => setIsDepthModalOpen(true)}
      />

      {/* Main Workspace (Left Sidebar + 3D Viewport) */}
      <main id="main-workspace" className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Shown on Desktop, or on Mobile when mobileTab === 'controls' */}
        <div
          className={`${
            mobileTab === 'controls' ? 'flex w-full absolute inset-0 z-20 md:relative md:w-80' : 'hidden md:flex md:w-80'
          } h-full shrink-0`}
        >
          <LeftSidebar
            imageFile={imageFile}
            imageDataUrl={imageDataUrl}
            imageDimensions={imageDimensions}
            modelMetadata={modelMetadata}
            depthMap={depthMap}
            depthSettings={depthSettings}
            meshSettings={meshSettings}
            meshStats={meshStats}
            materialSettings={materialSettings}
            sculptSettings={sculptSettings}
            isProcessing={isProcessing}
            onImportImage={() => imageInputRef.current?.click()}
            onReplaceImage={() => imageInputRef.current?.click()}
            onRemoveImage={() => {
              clearHistory();
              setImageFile(null);
              setImageDataUrl(null);
              setImageDimensions(null);
              setTextureImageElement(null);
              setDepthMap(null);
              setCurrentGeometry((old) => {
                old?.dispose();
                return null;
              });
            }}
            onLoadModel={() => modelInputRef.current?.click()}
            onRunDepth={() => triggerDepthEstimation(textureImageElement)}
            onDepthSettingsChange={(s) => setDepthSettings((prev) => ({ ...prev, ...s }))}
            onMeshSettingsChange={(s) => setMeshSettings((prev) => ({ ...prev, ...s }))}
            onMaterialSettingsChange={(s) => setMaterialSettings((prev) => ({ ...prev, ...s }))}
            onSculptSettingsChange={(s) => setSculptSettings((prev) => ({ ...prev, ...s }))}
            onRegenerateMesh={handleRegenerateMesh}
            onResetDepthSettings={() =>
              setDepthSettings({
                strength: 1.0,
                scale: 1.0,
                offset: 0.0,
                contrast: 1.0,
                invert: false,
                smoothness: 10,
                nearClip: 0.0,
                farClip: 1.0,
                smoothEdges: true,
              })
            }
            onSmoothMesh={handleSmoothMesh}
            onDecimateMesh={handleDecimateMesh}
            onCleanMesh={handleCleanMesh}
            onFlipNormals={handleFlipNormals}
            onRecalculateNormals={handleRecalculateNormals}
            onMirrorMesh={handleMirrorMesh}
            onCropDepthZ={handleCropDepthZ}
            onQuickExport={handleQuickExport}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        </div>

        {/* 3D Viewport: Always kept mounted to preserve WebGL context, full width on desktop or when mobileTab === 'viewport' */}
        <div
          className={`flex-1 h-full w-full ${
            mobileTab === 'viewport' ? 'block' : 'hidden md:block'
          }`}
        >
          <Viewport3D
            geometry={currentGeometry}
            textureImage={textureImageElement}
            materialSettings={materialSettings}
            onMaterialSettingsChange={(s) => setMaterialSettings((prev) => ({ ...prev, ...s }))}
            sculptSettings={sculptSettings}
            onMeshModified={handleMeshModified}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </div>
      </main>

      {/* Bottom Status Bar with Console Drawer */}
      <BottomStatusBar
        meshStats={meshStats}
        depthMap={depthMap}
        modelMetadata={modelMetadata}
        isProcessing={isProcessing}
      />

      {/* Modals */}
      {isDepthModalOpen && (
        <DepthPreviewModal depthMap={depthMap} onClose={() => setIsDepthModalOpen(false)} />
      )}

      {isExportModalOpen && (
        <ExportModal
          geometry={currentGeometry}
          imageDataUrl={imageDataUrl}
          depthMap={depthMap}
          meshStats={meshStats}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          settings={appSettings}
          onSettingsChange={(s) => setAppSettings((prev) => ({ ...prev, ...s }))}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}

      {isGuideModalOpen && <FirstRunGuide onClose={() => setIsGuideModalOpen(false)} />}
    </div>
  );
}
