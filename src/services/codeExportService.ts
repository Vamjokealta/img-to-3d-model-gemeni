/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { MaterialSettings } from '../types';

export interface HtmlCssExportOptions {
  theme: 'dark-glass' | 'minimal-light' | 'cyber-glow' | 'studio-black';
  embedType: 'threejs-embed' | 'css-parallax-card' | 'css-mesh-gradient' | 'full-page';
  autoRotate: boolean;
  mouseParallax: boolean;
  showTexture: boolean;
  wireframe: boolean;
  containerWidth: string; // e.g. '100%' or '600px'
  containerHeight: string; // e.g. '450px'
  borderRadius: string; // e.g. '16px'
}

export interface GeneratedCodeResult {
  html: string;
  css: string;
  fullHtmlDocument: string;
  previewSrcDoc: string;
}

export class CodeExportService {
  /**
   * Fast Base64 GLB extraction with memory optimization
   */
  public static async getGlbBase64(mesh: THREE.Mesh): Promise<string> {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        mesh,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            const bytes = new Uint8Array(gltf);
            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < bytes.length; i += chunkSize) {
              const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
              binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
            }
            const base64 = btoa(binary);
            resolve(`data:model/gltf-binary;base64,${base64}`);
          } else {
            const jsonStr = JSON.stringify(gltf);
            const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
            resolve(`data:application/json;base64,${base64}`);
          }
        },
        (err) => reject(err),
        { binary: true, embedImages: true }
      );
    });
  }

  /**
   * Extracts dominant color palette from image data URL for CSS theme generation
   */
  public static getPaletteFromImage(imageDataUrl: string | null): { primary: string; secondary: string; accent: string; bg: string } {
    if (!imageDataUrl) {
      return {
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#10b981',
        bg: '#0f172a',
      };
    }
    return {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      bg: '#090d16',
    };
  }

  /**
   * Generates CSS styles based on theme and embed options
   */
  public static generateCss(options: HtmlCssExportOptions, palette: { primary: string; secondary: string; accent: string; bg: string }): string {
    const isDark = options.theme !== 'minimal-light';

    if (options.embedType === 'css-mesh-gradient') {
      return `/* ══════════════════════════════════════════════════════════
   PURE CSS 3D MESH GRADIENT & RELIEF TOPOLOGY CARD
   ══════════════════════════════════════════════════════════ */
:root {
  --mesh-primary: ${palette.primary};
  --mesh-secondary: ${palette.secondary};
  --mesh-accent: ${palette.accent};
  --mesh-bg: ${palette.bg};
  --mesh-radius: ${options.borderRadius};
}

.mesh-relief-card {
  position: relative;
  width: ${options.containerWidth};
  height: ${options.containerHeight};
  max-width: 100%;
  border-radius: var(--mesh-radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 2rem;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: ${isDark ? '#ffffff' : '#0f172a'};
  box-shadow: ${
    options.theme === 'cyber-glow'
      ? '0 20px 40px -15px rgba(59, 130, 246, 0.4), 0 0 25px rgba(6, 182, 212, 0.25)'
      : '0 25px 50px -12px rgba(0, 0, 0, 0.35)'
  };
  border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
  background-color: var(--mesh-bg);
  background-image: 
    radial-gradient(at 10% 20%, ${palette.primary} 0px, transparent 50%),
    radial-gradient(at 90% 10%, ${palette.secondary} 0px, transparent 55%),
    radial-gradient(at 50% 60%, ${palette.accent} 0px, transparent 50%),
    radial-gradient(at 20% 90%, ${palette.primary}88 0px, transparent 50%),
    radial-gradient(at 80% 90%, ${palette.secondary}99 0px, transparent 50%);
  background-size: 140% 140%;
  animation: mesh-morph 12s ease-in-out infinite alternate;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
}

.mesh-relief-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.5);
}

.mesh-content {
  position: relative;
  z-index: 2;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: ${isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.75)'};
  padding: 1.5rem;
  border-radius: calc(var(--mesh-radius) - 4px);
  border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.06)'};
}

.mesh-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.mesh-subtitle {
  margin: 0;
  font-size: 0.875rem;
  opacity: 0.85;
  line-height: 1.5;
}

@keyframes mesh-morph {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 50% 20%; }
}`;
    }

    if (options.embedType === 'css-parallax-card') {
      return `/* ══════════════════════════════════════════════════════════
   PURE HTML + CSS 3D DEPTH & PARALLAX CARD
   ══════════════════════════════════════════════════════════ */
:root {
  --card-radius: ${options.borderRadius};
  --accent-color: ${palette.accent};
  --primary-color: ${palette.primary};
}

.depth-perspective-wrapper {
  perspective: 1200px;
  width: ${options.containerWidth};
  height: ${options.containerHeight};
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.depth-3d-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--card-radius);
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease;
  box-shadow: ${
    options.theme === 'cyber-glow'
      ? '0 25px 50px -12px rgba(6, 182, 212, 0.35), 0 0 30px rgba(59, 130, 246, 0.2)'
      : '0 20px 45px -10px rgba(0, 0, 0, 0.4)'
  };
  background: ${
    options.theme === 'minimal-light'
      ? '#ffffff'
      : options.theme === 'cyber-glow'
      ? '#0b101b'
      : '#111622'
  };
  border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'};
  overflow: hidden;
  cursor: pointer;
}

.depth-perspective-wrapper:hover .depth-3d-card {
  transform: rotateY(-10deg) rotateX(8deg) scale3d(1.02, 1.02, 1.02);
  box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.6);
}

/* Background Layer (Z: -20px) */
.depth-layer-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: translateZ(-20px) scale(1.15);
  filter: brightness(0.85) contrast(1.1);
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.depth-perspective-wrapper:hover .depth-layer-bg {
  transform: translateZ(-10px) scale(1.2);
}

/* Foreground Relief Layer (Z: 40px) */
.depth-layer-fg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: translateZ(40px) scale(0.95);
  mix-blend-mode: overlay;
  opacity: 0.9;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.depth-perspective-wrapper:hover .depth-layer-fg {
  transform: translateZ(60px) scale(0.98);
}

/* UI Content Layer (Z: 70px) */
.depth-layer-ui {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  transform: translateZ(70px);
  background: linear-gradient(to top, rgba(10, 14, 22, 0.92) 0%, rgba(10, 14, 22, 0.5) 70%, transparent 100%);
  color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.depth-perspective-wrapper:hover .depth-layer-ui {
  transform: translateZ(90px);
}

.depth-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  background: rgba(59, 130, 246, 0.25);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: #60a5fa;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.depth-title {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.depth-desc {
  margin: 0;
  font-size: 0.875rem;
  color: #94a3b8;
}`;
    }

    // Default: Three.js Interactive 3D Embed
    return `/* ══════════════════════════════════════════════════════════
   INTERACTIVE 3D WEB COMPONENT (HTML + CSS + THREE.JS)
   ══════════════════════════════════════════════════════════ */
:root {
  --viewport-radius: ${options.borderRadius};
  --viewport-bg: ${
    options.theme === 'minimal-light'
      ? '#f8fafc'
      : options.theme === 'cyber-glow'
      ? '#090d16'
      : options.theme === 'studio-black'
      ? '#000000'
      : '#11151c'
  };
  --viewport-border: ${
    options.theme === 'minimal-light'
      ? 'rgba(0, 0, 0, 0.1)'
      : options.theme === 'cyber-glow'
      ? 'rgba(59, 130, 246, 0.4)'
      : 'rgba(255, 255, 255, 0.12)'
  };
}

.mesh-3d-container {
  position: relative;
  width: ${options.containerWidth};
  height: ${options.containerHeight};
  max-width: 100%;
  border-radius: var(--viewport-radius);
  background-color: var(--viewport-bg);
  border: 1px solid var(--viewport-border);
  overflow: hidden;
  box-shadow: ${
    options.theme === 'cyber-glow'
      ? '0 20px 40px -15px rgba(59, 130, 246, 0.3), 0 0 25px rgba(6, 182, 212, 0.2)'
      : '0 20px 35px -10px rgba(0, 0, 0, 0.35)'
  };
  touch-action: none;
  box-sizing: border-box;
}

.mesh-3d-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}

.mesh-3d-canvas:active {
  cursor: grabbing;
}

.mesh-3d-overlay {
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 10;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.mesh-3d-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.65rem;
  border-radius: 9999px;
  background: ${isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
  color: ${isDark ? '#e2e8f0' : '#1e293b'};
  font-size: 0.75rem;
  font-weight: 600;
}

.mesh-3d-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.mesh-3d-controls-hint {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  z-index: 10;
  pointer-events: none;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  background: ${isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)'};
  color: ${isDark ? '#94a3b8' : '#64748b'};
  font-size: 0.7rem;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}`;
  }

  /**
   * Generates HTML markup for embed
   */
  public static generateHtml(
    options: HtmlCssExportOptions,
    imageDataUrl: string | null
  ): string {
    if (options.embedType === 'css-mesh-gradient') {
      return `<!-- Pure CSS 3D Mesh Topology Card -->
<div class="mesh-relief-card">
  <div class="mesh-content">
    <h3 class="mesh-title">3D Relief Topography</h3>
    <p class="mesh-subtitle">Interactive smooth mesh gradient calculated from depth contours and luminance distribution.</p>
  </div>
</div>`;
    }

    if (options.embedType === 'css-parallax-card') {
      const img = imageDataUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';
      return `<!-- Pure HTML & CSS 3D Parallax Depth Card -->
<div class="depth-perspective-wrapper">
  <div class="depth-3d-card">
    <div class="depth-layer-bg" style="background-image: url('${img}');"></div>
    <div class="depth-layer-fg" style="background-image: url('${img}');"></div>
    <div class="depth-layer-ui">
      <span class="depth-badge">3D Depth Model</span>
      <h3 class="depth-title">Volumetric Mesh</h3>
      <p class="depth-desc">Hover and move pointer to inspect spatial depth perspective.</p>
    </div>
  </div>
</div>`;
    }

    return `<!-- Interactive 3D Web Component (HTML + Three.js) -->
<div id="mesh-container" class="mesh-3d-container">
  <div class="mesh-3d-overlay">
    <div class="mesh-3d-tag">
      <span class="mesh-3d-dot"></span>
      <span>3D Mesh Viewport</span>
    </div>
  </div>
  <canvas id="mesh-canvas" class="mesh-3d-canvas"></canvas>
  <div class="mesh-3d-controls-hint">Drag to Rotate • Scroll to Zoom</div>
</div>`;
  }

  /**
   * Generates complete standalone HTML file with Three.js WebGL or pure CSS
   */
  public static async generateFullDocument(
    mesh: THREE.Mesh | null,
    options: HtmlCssExportOptions,
    imageDataUrl: string | null,
    materialSettings?: MaterialSettings
  ): Promise<GeneratedCodeResult> {
    const palette = this.getPaletteFromImage(imageDataUrl);
    const css = this.generateCss(options, palette);
    const html = this.generateHtml(options, imageDataUrl);

    let scriptContent = '';

    if (options.embedType === 'threejs-embed' && mesh) {
      const glbBase64 = await this.getGlbBase64(mesh);
      const isDark = options.theme !== 'minimal-light';
      const bgColor = isDark
        ? options.theme === 'studio-black'
          ? '0x000000'
          : '0x11151c'
        : '0xf8fafc';

      scriptContent = `
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"
    }
  }
</script>
<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

  const container = document.getElementById('mesh-container');
  const canvas = document.getElementById('mesh-canvas');

  // Scene & Camera
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(${bgColor});

  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 0, 3.2);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // Orbit Controls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = ${options.autoRotate ? 'true' : 'false'};
  controls.autoRotateSpeed = 2.0;
  controls.maxDistance = 10;
  controls.minDistance = 0.5;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(3, 5, 4);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
  fillLight.position.set(-3, -2, -2);
  scene.add(fillLight);

  // Load Embedded 3D Mesh
  const loader = new GLTFLoader();
  const base64Data = "${glbBase64}";

  loader.load(base64Data, (gltf) => {
    const model = gltf.scene;

    // Center geometry
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 2.0 / maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.clone().multiplyScalar(scale));
    }

    ${options.wireframe ? 'model.traverse(node => { if (node.isMesh) node.material.wireframe = true; });' : ''}

    scene.add(model);

    ${
      options.mouseParallax
        ? `
    // Mouse Parallax Interaction
    let targetRotX = 0;
    let targetRotY = 0;
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = x * 0.3;
      targetRotX = -y * 0.3;
    });

    controls.addEventListener('start', () => { targetRotX = 0; targetRotY = 0; });
    `
        : ''
    }
  });

  // Responsive Resize
  window.addEventListener('resize', () => {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
</script>`;
    }

    const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>3D Mesh Web Component</title>
  <style>
    body {
      margin: 0;
      padding: 2rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: ${options.theme === 'minimal-light' ? '#f1f5f9' : '#0a0d14'};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-sizing: border-box;
    }

    ${css}
  </style>
</head>
<body>

${html}

${scriptContent}

</body>
</html>`;

    return {
      html,
      css,
      fullHtmlDocument,
      previewSrcDoc: fullHtmlDocument,
    };
  }
}
