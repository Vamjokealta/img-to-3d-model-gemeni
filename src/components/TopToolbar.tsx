/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Box,
  Cpu,
  Download,
  FolderOpen,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Menu,
  MoreVertical,
  Redo2,
  Save,
  Settings,
  Sparkles,
  Tv,
  Undo2,
  X,
} from 'lucide-react';
import { DepthMapData, MaterialSettings, ModelMetadata } from '../types';

interface TopToolbarProps {
  hasImage: boolean;
  hasMesh: boolean;
  isProcessing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  modelMetadata: ModelMetadata;
  depthMap: DepthMapData | null;
  materialSettings: MaterialSettings;
  mobileTab: 'controls' | 'viewport';
  onMobileTabChange: (tab: 'controls' | 'viewport') => void;
  onImportImageClick: () => void;
  onLoadModelClick: () => void;
  onRunDepthEstimation: () => void;
  onToggleTexture: () => void;
  onOpenProjectClick: () => void;
  onSaveProjectClick: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExportModal: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenDepthView: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  hasImage,
  hasMesh,
  isProcessing,
  canUndo,
  canRedo,
  modelMetadata,
  depthMap,
  materialSettings,
  mobileTab,
  onMobileTabChange,
  onImportImageClick,
  onLoadModelClick,
  onRunDepthEstimation,
  onToggleTexture,
  onOpenProjectClick,
  onSaveProjectClick,
  onUndo,
  onRedo,
  onOpenExportModal,
  onOpenSettings,
  onOpenHelp,
  onOpenDepthView,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header
      id="top-toolbar"
      className="h-14 bg-[#14171c] border-b border-[#262c36] px-2.5 sm:px-4 flex items-center justify-between select-none z-30 shrink-0 text-gray-200"
    >
      {/* Brand / Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
          <Box className="w-5 h-5 text-white" />
        </div>
        <div className="hidden min-[480px]:block">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs sm:text-sm tracking-wide text-white">ImageTo3D</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              OFFLINE
            </span>
          </div>
          <p className="text-[10px] text-gray-400 hidden sm:block">AI Depth to 3D Mesh Studio</p>
        </div>
      </div>

      {/* Mobile Tab Switcher (Visible only on < md screens) */}
      <div className="flex md:hidden items-center bg-[#1e2430] p-1 rounded-lg border border-[#2e3745]">
        <button
          onClick={() => onMobileTabChange('viewport')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            mobileTab === 'viewport'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>3D View</span>
        </button>
        <button
          onClick={() => onMobileTabChange('controls')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
            mobileTab === 'controls'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Tools</span>
        </button>
      </div>

      {/* Main Action Buttons (Desktop and responsive tablets) */}
      <div className="hidden md:flex items-center gap-1.5">
        <button
          id="btn-toolbar-import"
          onClick={onImportImageClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1f242d] hover:bg-[#282f3a] text-xs font-medium text-gray-200 border border-[#313a48] transition-colors"
          title="Import Image (PNG, JPG, WEBP, BMP)"
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>Import Image</span>
        </button>

        <button
          id="btn-toolbar-load-model"
          onClick={onLoadModelClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1f242d] hover:bg-[#282f3a] text-xs font-medium text-gray-200 border border-[#313a48] transition-colors"
          title="Load ONNX Model from local disk"
        >
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>{modelMetadata.isLoaded ? 'ONNX Active' : 'Load ONNX'}</span>
        </button>

        {/* Generate 3D Mesh Button */}
        <button
          id="btn-toolbar-run-ai"
          onClick={onRunDepthEstimation}
          disabled={!hasImage || isProcessing}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all ${
            hasImage && !isProcessing
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-900/30 cursor-pointer'
              : 'bg-gray-800 text-gray-500 border border-gray-700/50 cursor-not-allowed'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : 'text-amber-300'}`} />
          <span>{isProcessing ? 'Estimating Depth...' : 'Generate 3D'}</span>
        </button>

        {/* Dedicated Texture Map Quick Toggle */}
        <button
          id="btn-toolbar-toggle-texture"
          onClick={onToggleTexture}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
            materialSettings.showTexture
              ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
              : 'bg-[#1f242d] border-[#313a48] text-gray-300 hover:bg-[#282f3a]'
          }`}
          title="Toggle Image Texture Map on Mesh (T)"
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          <span>{materialSettings.showTexture ? 'Texture: ON' : 'Texture: OFF'}</span>
        </button>

        {depthMap && (
          <button
            id="btn-toolbar-view-depth"
            onClick={onOpenDepthView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1f242d] hover:bg-[#282f3a] text-xs font-medium text-gray-200 border border-[#313a48] transition-colors"
            title="Inspect 2D Depth Map"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Depth Map</span>
          </button>
        )}

        <div className="h-5 w-px bg-[#262c36] mx-1" />

        {/* Undo / Redo */}
        <button
          id="btn-toolbar-undo"
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 rounded-md transition-colors ${
            canUndo ? 'text-gray-300 hover:bg-[#282f3a]' : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          id="btn-toolbar-redo"
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 rounded-md transition-colors ${
            canRedo ? 'text-gray-300 hover:bg-[#282f3a]' : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-[#262c36] mx-1" />

        {/* Project Operations */}
        <button
          id="btn-toolbar-open-project"
          onClick={onOpenProjectClick}
          className="p-1.5 rounded-md text-gray-300 hover:bg-[#282f3a] transition-colors"
          title="Open .my3d Project File"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        <button
          id="btn-toolbar-save-project"
          onClick={onSaveProjectClick}
          disabled={!hasImage}
          className={`p-1.5 rounded-md transition-colors ${
            hasImage ? 'text-gray-300 hover:bg-[#282f3a]' : 'text-gray-600 cursor-not-allowed'
          }`}
          title="Save .my3d Project"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      {/* Right Tools: Export & Overflow Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Export Button */}
        <button
          id="btn-toolbar-export"
          onClick={onOpenExportModal}
          disabled={!hasMesh}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            hasMesh
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-950/40'
              : 'bg-gray-800 text-gray-500 border border-gray-700/50 cursor-not-allowed'
          }`}
          title="Export 3D Model (OBJ, STL, GLB, PLY)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export 3D</span>
        </button>

        {/* Desktop Settings & Help */}
        <div className="hidden md:flex items-center gap-1">
          <button
            id="btn-toolbar-settings"
            onClick={onOpenSettings}
            className="p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-[#1f242d] transition-colors"
            title="Studio Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            id="btn-toolbar-help"
            onClick={onOpenHelp}
            className="p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-[#1f242d] transition-colors"
            title="Model Setup & Documentation Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile More Options Button */}
        <div className="relative md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-md text-gray-300 hover:bg-[#1f242d] transition-colors"
            title="More Options"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <MoreVertical className="w-4 h-4" />}
          </button>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-11 w-56 bg-[#161a22] border border-[#2c3543] rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
              <button
                onClick={() => {
                  onImportImageClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#202734] text-left text-gray-200"
              >
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span>Import Image</span>
              </button>

              <button
                onClick={() => {
                  onToggleTexture();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#202734] text-left text-gray-200"
              >
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span>Toggle Texture: {materialSettings.showTexture ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => {
                  onRunDepthEstimation();
                  setIsMobileMenuOpen(false);
                }}
                disabled={!hasImage || isProcessing}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[#202734] text-left text-indigo-300 font-semibold"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate 3D Mesh</span>
              </button>

              <div className="h-px bg-[#262c36] my-1" />

              <button
                onClick={() => {
                  onUndo();
                  setIsMobileMenuOpen(false);
                }}
                disabled={!canUndo}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202734] text-left text-gray-300"
              >
                <Undo2 className="w-4 h-4" />
                <span>Undo</span>
              </button>

              <button
                onClick={() => {
                  onRedo();
                  setIsMobileMenuOpen(false);
                }}
                disabled={!canRedo}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202734] text-left text-gray-300"
              >
                <Redo2 className="w-4 h-4" />
                <span>Redo</span>
              </button>

              <div className="h-px bg-[#262c36] my-1" />

              <button
                onClick={() => {
                  onOpenProjectClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202734] text-left text-gray-300"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Open Project (.my3d)</span>
              </button>

              <button
                onClick={() => {
                  onSaveProjectClick();
                  setIsMobileMenuOpen(false);
                }}
                disabled={!hasImage}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202734] text-left text-gray-300"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Save Project</span>
              </button>

              <div className="h-px bg-[#262c36] my-1" />

              <button
                onClick={() => {
                  onOpenSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202734] text-left text-gray-300"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  onOpenHelp();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#202734] text-left text-gray-300"
              >
                <HelpCircle className="w-4 h-4 text-gray-400" />
                <span>Help & Docs</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
