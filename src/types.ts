/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type InferenceBackend = 'webgpu' | 'wasm' | 'cpu';

export interface ModelMetadata {
  name: string;
  version: string;
  fileName: string;
  fileSize?: number;
  inputName?: string;
  inputShape?: number[]; // e.g. [1, 3, 518, 518]
  outputName?: string;
  outputShape?: number[]; // e.g. [1, 518, 518] or [1, 1, 518, 518]
  isLoaded: boolean;
  loadError?: string;
}

export interface DepthMapData {
  width: number;
  height: number;
  data: Float32Array; // raw normalized depth values [0.0, 1.0]
  minDepth: number;
  maxDepth: number;
  inferenceTimeMs: number;
  backendUsed: InferenceBackend | 'fallback-geometric';
}

export interface DepthSettings {
  strength: number; // 0.0 to 3.0 (default 1.0)
  scale: number; // 0.01 to 10.0 (default 1.0)
  offset: number; // -1.0 to 1.0 (default 0.0)
  contrast: number; // 0.5 to 2.5 (default 1.0)
  invert: boolean;
  smoothness: number; // 0 to 100
  nearClip: number; // 0.0 to 1.0 (removes background plane below threshold)
  farClip: number; // 0.0 to 1.0
  smoothEdges: boolean; // Clean border falloff
}

export interface MeshSettings {
  resolutionX: number; // e.g. 256 or 518
  resolutionY: number;
  generateBaseSkirt: boolean; // Creates solid bottom for 3D printing
  baseThickness: number; // Base depth thickness
  smoothNormals: boolean;
  simplifyRatio: number; // 0.1 to 1.0 (1.0 = 100% full mesh)
}

export interface MaterialSettings {
  showTexture: boolean; // Toggle texture map on/off
  textureIntensity: number; // 0.0 to 1.0 (opacity / mix)
  roughness: number; // 0.0 to 1.0
  metalness: number; // 0.0 to 1.0
  wireframeOverlay: boolean;
  clayColor: string; // Hex color for untextured / solid display
  doubleSided: boolean;
}

export interface MeshStats {
  vertexCount: number;
  triangleCount: number;
  faceCount: number;
  boundingBox: {
    width: number;
    height: number;
    depth: number;
  };
  estimatedMemoryBytes: number;
}

export type RenderMode =
  | 'textured'
  | 'solid'
  | 'wireframe'
  | 'points'
  | 'normals'
  | 'depth'
  | 'matcap';

export type CameraPreset = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'perspective' | 'orthographic';

export type SculptTool = 'push' | 'pull' | 'smooth' | 'flatten' | 'inflate' | 'none';

export interface SculptSettings {
  activeTool: SculptTool;
  brushRadius: number; // 0.05 to 2.0
  brushStrength: number; // 0.01 to 1.0
  brushFalloff: 'gaussian' | 'linear' | 'cosine' | 'sharp';
  mirrorX: boolean;
}

export interface AppSettings {
  preferredBackend: InferenceBackend;
  threadCount: number;
  defaultExportFormat: 'obj' | 'stl' | 'glb' | 'ply';
  autoFitCamera: boolean;
  theme: 'dark' | 'light';
  highPrecisionDepth: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: string;
}

export interface ProjectState {
  version: string;
  createdAt: string;
  imageName: string;
  imageDataUrl: string;
  depthSettings: DepthSettings;
  meshSettings: MeshSettings;
  hasDepthMap: boolean;
  depthData?: number[]; // serializable array
  depthWidth?: number;
  depthHeight?: number;
}
