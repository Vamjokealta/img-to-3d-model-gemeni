# ImageTo3D Studio

> **100% Offline Desktop & Web 3D Mesh Generator powered by AI Depth Estimation & Three.js**

ImageTo3D Studio converts 2D images (PNG, JPG, WEBP, BMP) into usable 3D meshes (`.OBJ`, `.STL`, `.GLB`, `.PLY`) using local Depth Anything V2 neural networks and real-time 3D geometry generation.

---

## Key Features

1. **Local AI Depth Estimation**:
   - Depth Anything V2 ONNX support with hardware-accelerated WebGPU/DirectML and multi-threaded WASM SIMD backends.
   - Built-in multi-scale Saliency & Geometric Depth Estimator fallback for immediate offline generation.
   - Raw 32-bit floating-point depth buffer processing.
2. **Real 3D Mesh Generation**:
   - Converts depth map tensors into actual 3D `BufferGeometry` (vertices, faces, UVs, and computed vertex normals).
   - Optional **Watertight Solid Base Skirt** extrusion for direct 3D printing (Cura, PrusaSlicer, Bambu Studio).
3. **Professional 3D Viewport**:
   - Full Three.js interactive renderer with OrbitControls (Orbit, Pan, Zoom, Fit `F`, Reset `R`).
   - Multiple render modes: Textured PBR, Flat/Smooth Solid, Wireframe (`W`), Point Cloud, Surface Normals, MatCap.
   - Camera presets: Front, Back, Left, Right, Top, Bottom, Perspective / Orthographic.
4. **Mesh Cleanup & Topology Tools**:
   - Laplacian smoothing and Taubin filtering.
   - Topology-preserving mesh decimation and triangle reduction.
   - Removal of isolated vertices and degenerate zero-area faces.
   - Surface normal recalculation and normal inversion.
5. **Interactive Mesh Sculpting & Editing**:
   - Sculpt brushes: **Push**, **Pull**, **Smooth**, **Flatten**, **Inflate** with dynamic brush radius, strength, and Gaussian/Cosine falloff.
   - Mirror symmetry (X/Y axes) and depth Z-clipping.
6. **Multi-Format Export Engine**:
   - `.OBJ` with `.MTL` and diffuse texture map packaging (in ZIP bundle).
   - `.STL` (Binary / ASCII for 3D Printing).
   - `.GLB` (glTF 2.0 binary with embedded textures and materials).
   - `.PLY` (Polygon File Format with vertex positions and normals).
   - 8-bit & 16-bit Depth Map PNG.
7. **Project Management & History**:
   - Save and reload `.my3d` project bundles.
   - Multi-level Undo (`Ctrl+Z`) and Redo (`Ctrl+Y`).
8. **100% Offline & Private**:
   - No external APIs, no telemetry, no cloud network calls. All processing runs locally in memory.

---

## Directory Structure

```
ImageTo3D/
├── electron/
│   ├── main.cjs               # Desktop main process
│   └── preload.cjs            # IPC preload bridge
├── electron-builder.yml       # Windows NSIS & Portable EXE packaging
├── models/
│   └── depth-anything-v2/     # Local ONNX weights directory
│       └── README.md
├── src/
│   ├── components/
│   │   ├── BottomStatusBar.tsx    # Metrics, console drawer
│   │   ├── DepthPreviewModal.tsx  # 2D depth map inspector
│   │   ├── ExportModal.tsx        # 3D export dialog
│   │   ├── FirstRunGuide.tsx      # Onboarding guide
│   │   ├── LeftSidebar.tsx        # Collapsible controls
│   │   ├── SettingsModal.tsx      # Preferences & backends
│   │   ├── TopToolbar.tsx         # Header toolbar
│   │   └── Viewport3D.tsx         # Three.js 3D viewport
│   ├── services/
│   │   ├── aiDepthService.ts      # ONNX Runtime & fallback AI
│   │   ├── exportService.ts       # OBJ, STL, GLB, PLY exporter
│   │   ├── logger.ts              # Local logging system
│   │   ├── meshCleanup.ts         # Smoothing & decimation
│   │   ├── meshGenerator.ts       # BufferGeometry generator
│   │   ├── meshSculpt.ts          # Sculpt brush engine
│   │   └── projectService.ts      # .my3d format serializer
│   ├── types.ts                   # TypeScript interfaces
│   ├── App.tsx                    # Main application shell
│   ├── main.tsx                   # React entry point
│   └── index.css                  # Tailwind styles
├── tests/
│   ├── depth.test.ts              # Depth validation tests
│   └── mesh.test.ts               # Mesh geometry tests
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Prerequisites & Installation

### Requirements
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **OS**: Windows 10 / 11 (64-bit), macOS, or Linux

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/ImageTo3D.git
cd ImageTo3D
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```
Open `http://localhost:3000` in your browser or launch inside the Electron shell.

---

## Model Installation (Depth Anything V2 ONNX)

To use Depth Anything V2 neural networks:
1. Place any Depth Anything V2 `.onnx` file into:
   ```
   models/depth-anything-v2/depthanythingv2.onnx
   ```
2. Or click **Load ONNX** in the application toolbar to select the model file directly from any folder on your hard drive.

---

## Packaging Standalone Windows .EXE

To compile and package the standalone Windows executable:

```bash
# 1. Build web distribution
npm run build

# 2. Package into Windows Executable (Installer & Portable)
npx electron-builder --win
```

The output executables will be generated in `dist-electron/`:
- `ImageTo3D-Setup.exe` (NSIS Full Installer)
- `ImageTo3D-Portable.exe` (Single Portable .EXE without installer)

---

## Automated Validation

Run the test suite to verify mesh generation and depth calculations:
```bash
npm test
```

---

## License
Apache-2.0 License
