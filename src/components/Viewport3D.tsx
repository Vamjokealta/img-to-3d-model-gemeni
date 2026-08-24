/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  CameraPreset,
  MaterialSettings,
  RenderMode,
  SculptSettings,
} from '../types';
import { MeshSculpt } from '../services/meshSculpt';
import {
  CircleDot,
  Grid,
  Image as ImageIcon,
  Maximize2,
  Paintbrush,
  RefreshCw,
  SlidersHorizontal,
  Tv,
} from 'lucide-react';

interface Viewport3DProps {
  geometry: THREE.BufferGeometry | null;
  textureImage: HTMLImageElement | null;
  materialSettings: MaterialSettings;
  onMaterialSettingsChange: (settings: Partial<MaterialSettings>) => void;
  sculptSettings: SculptSettings;
  onMeshModified: (geometry: THREE.BufferGeometry) => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  geometry,
  textureImage,
  materialSettings,
  onMaterialSettingsChange,
  sculptSettings,
  onMeshModified,
  onUndo,
  onRedo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const perspectiveCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthographicCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const wireOverlayRef = useRef<THREE.LineSegments | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const brushCursorRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  // Viewport Settings State
  const [renderMode, setRenderMode] = useState<RenderMode>('textured');
  const [isOrthographic, setIsOrthographic] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [isSculpting, setIsSculpting] = useState(false);
  const [showQuickMaterialMenu, setShowQuickMaterialMenu] = useState(false);

  // Helper to dispose of a Three.js material
  const disposeMaterial = (mat: THREE.Material | THREE.Material[] | null | undefined) => {
    if (!mat) return;
    if (Array.isArray(mat)) {
      mat.forEach((m) => m.dispose());
    } else {
      mat.dispose();
    }
  };

  // Helper to dispose of a Three.js object and its children
  const disposeObject = (obj: THREE.Object3D | null | undefined) => {
    if (!obj) return;
    if ('geometry' in obj && obj.geometry instanceof THREE.BufferGeometry) {
      obj.geometry.dispose();
    }
    if ('material' in obj) {
      disposeMaterial((obj as THREE.Mesh).material);
    }
  };

  // 1. Initialize Scene & Renderer
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x161a22);
    sceneRef.current = scene;

    // Cameras
    const aspect = width / Math.max(height, 1);
    const persCamera = new THREE.PerspectiveCamera(45, aspect, 0.05, 100);
    persCamera.position.set(0, 0, 3.5);
    perspectiveCameraRef.current = persCamera;

    const orthoCamera = new THREE.OrthographicCamera(-aspect * 1.5, aspect * 1.5, 1.5, -1.5, 0.05, 100);
    orthoCamera.position.set(0, 0, 3.5);
    orthographicCameraRef.current = orthoCamera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // WebGL Context Lost & Restored Handlers to prevent white screen
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn('WebGL context lost. Attempting auto-recovery...');
    };

    const handleContextRestored = () => {
      console.info('WebGL context restored successfully.');
      if (meshRef.current) {
        applyMaterialToMesh(meshRef.current, renderMode, materialSettings);
      }
    };

    const canvas = canvasRef.current;
    canvas.addEventListener('webglcontextlost', handleContextLost, false);
    canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

    // Orbit Controls with full touch support
    const controls = new OrbitControls(persCamera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.maxDistance = 20;
    controls.minDistance = 0.2;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // Lighting setup for high fidelity relief visualization
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.6);
    fillLight.position.set(-4, -3, 2);
    scene.add(fillLight);

    const backRimLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    backRimLight.position.set(0, 4, -4);
    scene.add(backRimLight);

    // Grid & Axes Helpers
    const grid = new THREE.GridHelper(4, 20, 0x3d4a61, 0x262f3e);
    grid.position.y = -1.0;
    scene.add(grid);
    gridHelperRef.current = grid;

    const axes = new THREE.AxesHelper(1.0);
    axes.position.set(-1.4, -0.9, 0);
    scene.add(axes);
    axesHelperRef.current = axes;

    // Sculpt Brush Ring Cursor
    const brushGeo = new THREE.RingGeometry(0.04, 0.045, 32);
    const brushMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
    });
    const brushCursor = new THREE.Mesh(brushGeo, brushMat);
    brushCursor.visible = false;
    scene.add(brushCursor);
    brushCursorRef.current = brushCursor;

    // Animation Loop with Error Guard
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      try {
        controls.update();
        const activeCam = isOrthographic ? orthoCamera : persCamera;
        renderer.render(scene, activeCam);
      } catch (renderError) {
        console.warn('Frame render skipped:', renderError);
      }
    };
    animate();

    // ResizeObserver for dynamic screen sizes (mobile, tablet, desktop)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          const newAspect = newW / newH;
          persCamera.aspect = newAspect;
          persCamera.updateProjectionMatrix();

          orthoCamera.left = -newAspect * 1.5;
          orthoCamera.right = newAspect * 1.5;
          orthoCamera.top = 1.5;
          orthoCamera.bottom = -1.5;
          orthoCamera.updateProjectionMatrix();

          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      // Clean up Three scene
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      disposeObject(meshRef.current);
      disposeObject(wireOverlayRef.current);
      disposeObject(pointsRef.current);
      disposeObject(brushCursor);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // 2. Update Texture Image when imported or changed
  useEffect(() => {
    if (!textureImage) {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
      if (meshRef.current) {
        applyMaterialToMesh(meshRef.current, renderMode, materialSettings);
      }
      return;
    }

    try {
      // Safely dispose previous texture from GPU VRAM
      if (textureRef.current) {
        textureRef.current.dispose();
      }

      const tex = new THREE.Texture(textureImage);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false; // Prevents power-of-two texture warnings and crashes
      tex.needsUpdate = true;
      textureRef.current = tex;

      if (meshRef.current) {
        applyMaterialToMesh(meshRef.current, renderMode, materialSettings);
      }
    } catch (texErr) {
      console.warn('Error applying texture image:', texErr);
    }
  }, [textureImage]);

  // 3. Update Material based on RenderMode and MaterialSettings
  const applyMaterialToMesh = useCallback(
    (mesh: THREE.Mesh, mode: RenderMode, matSettings: MaterialSettings) => {
      if (mode === 'points') {
        mesh.visible = false;
        if (pointsRef.current) pointsRef.current.visible = true;
        return;
      }

      mesh.visible = true;
      if (pointsRef.current) pointsRef.current.visible = false;

      const hasTex = Boolean(textureRef.current && matSettings.showTexture);
      const isStdMat = mesh.material instanceof THREE.MeshStandardMaterial;

      // In-place updates for performance and zero memory leaks
      if (isStdMat && (mode === 'textured' || mode === 'solid' || mode === 'depth')) {
        const stdMat = mesh.material as THREE.MeshStandardMaterial;
        stdMat.wireframe = false;
        stdMat.map = hasTex ? textureRef.current : null;
        stdMat.color.set(hasTex ? 0xffffff : (matSettings.clayColor || 0xa0aec0));
        stdMat.roughness = matSettings.roughness ?? 0.5;
        stdMat.metalness = matSettings.metalness ?? 0.1;
        stdMat.side = matSettings.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
        stdMat.needsUpdate = true;
      } else {
        // Dispose old material before allocating new
        disposeMaterial(mesh.material);

        let mat: THREE.Material;
        switch (mode) {
          case 'textured': {
            mat = new THREE.MeshStandardMaterial({
              map: hasTex ? textureRef.current : null,
              color: hasTex ? 0xffffff : new THREE.Color(matSettings.clayColor || 0xa0aec0),
              roughness: matSettings.roughness ?? 0.5,
              metalness: matSettings.metalness ?? 0.1,
              side: matSettings.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
            });
            break;
          }
          case 'solid':
            mat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(matSettings.clayColor || 0xa0aec0),
              roughness: matSettings.roughness ?? 0.45,
              metalness: matSettings.metalness ?? 0.15,
              side: matSettings.doubleSided ? THREE.DoubleSide : THREE.FrontSide,
            });
            break;
          case 'wireframe':
            mat = new THREE.MeshBasicMaterial({
              color: 0x38bdf8,
              wireframe: true,
              side: THREE.DoubleSide,
            });
            break;
          case 'normals':
          case 'matcap':
            mat = new THREE.MeshNormalMaterial({
              side: THREE.DoubleSide,
            });
            break;
          case 'depth':
            mat = new THREE.MeshStandardMaterial({
              color: 0xe2e8f0,
              roughness: 0.9,
              metalness: 0.0,
              side: THREE.DoubleSide,
            });
            break;
          default:
            mat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, side: THREE.DoubleSide });
        }
        mesh.material = mat;
      }

      // Update wireframe overlay visibility
      if (wireOverlayRef.current && sceneRef.current) {
        wireOverlayRef.current.visible = Boolean(matSettings.wireframeOverlay);
      }
    },
    []
  );

  // 4. Update Mesh Geometry in Scene
  useEffect(() => {
    if (!sceneRef.current) return;

    // Safely remove and dispose old mesh, wireframes and points
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      disposeObject(meshRef.current);
      meshRef.current = null;
    }
    if (wireOverlayRef.current) {
      sceneRef.current.remove(wireOverlayRef.current);
      disposeObject(wireOverlayRef.current);
      wireOverlayRef.current = null;
    }
    if (pointsRef.current) {
      sceneRef.current.remove(pointsRef.current);
      disposeObject(pointsRef.current);
      pointsRef.current = null;
    }

    if (!geometry) return;

    // Create new Mesh
    const mesh = new THREE.Mesh(geometry.clone());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    applyMaterialToMesh(mesh, renderMode, materialSettings);
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    // Wireframe overlay
    if (materialSettings.wireframeOverlay) {
      const wireGeo = new THREE.WireframeGeometry(geometry);
      const wireMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
      const wireOverlay = new THREE.LineSegments(wireGeo, wireMat);
      sceneRef.current.add(wireOverlay);
      wireOverlayRef.current = wireOverlay;
    }

    // Point Cloud representation
    const pointsMat = new THREE.PointsMaterial({
      size: 0.015,
      color: 0x38bdf8,
    });
    const points = new THREE.Points(geometry.clone(), pointsMat);
    points.visible = renderMode === 'points';
    sceneRef.current.add(points);
    pointsRef.current = points;
  }, [geometry]);

  useEffect(() => {
    if (meshRef.current) {
      applyMaterialToMesh(meshRef.current, renderMode, materialSettings);
    }
  }, [renderMode, materialSettings, applyMaterialToMesh]);

  // 5. Toggle Helpers
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (axesHelperRef.current) axesHelperRef.current.visible = showAxes;
  }, [showAxes]);

  // 6. Camera Controls Presets
  const setCameraPreset = (preset: CameraPreset) => {
    if (!controlsRef.current || !perspectiveCameraRef.current) return;

    const cam = perspectiveCameraRef.current;
    const dist = 3.5;

    switch (preset) {
      case 'front':
        cam.position.set(0, 0, dist);
        break;
      case 'back':
        cam.position.set(0, 0, -dist);
        break;
      case 'left':
        cam.position.set(-dist, 0, 0);
        break;
      case 'right':
        cam.position.set(dist, 0, 0);
        break;
      case 'top':
        cam.position.set(0, dist, 0.01);
        break;
      case 'bottom':
        cam.position.set(0, -dist, 0.01);
        break;
      case 'perspective':
        setIsOrthographic(false);
        if (controlsRef.current && perspectiveCameraRef.current) {
          controlsRef.current.object = perspectiveCameraRef.current;
        }
        return;
      case 'orthographic':
        setIsOrthographic(true);
        if (controlsRef.current && orthographicCameraRef.current) {
          controlsRef.current.object = orthographicCameraRef.current;
        }
        return;
    }

    cam.lookAt(0, 0, 0);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const fitCameraToModel = () => {
    if (!meshRef.current || !perspectiveCameraRef.current || !controlsRef.current) return;
    meshRef.current.geometry.computeBoundingSphere();
    const sphere = meshRef.current.geometry.boundingSphere;
    if (!sphere) return;

    const radius = sphere.radius;
    const fov = perspectiveCameraRef.current.fov * (Math.PI / 180);
    const dist = Math.abs(radius / Math.sin(fov / 2)) * 1.35;

    perspectiveCameraRef.current.position.set(0, 0, dist);
    controlsRef.current.target.set(sphere.center.x, sphere.center.y, sphere.center.z);
    controlsRef.current.update();
  };

  const resetCamera = () => {
    if (!controlsRef.current || !perspectiveCameraRef.current) return;
    perspectiveCameraRef.current.position.set(0, 0, 3.5);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  // 7. Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'f' || e.key === 'F') {
        fitCameraToModel();
      } else if (e.key === 'r' || e.key === 'R') {
        resetCamera();
      } else if (e.key === 'w' || e.key === 'W') {
        setRenderMode((prev) => (prev === 'wireframe' ? 'textured' : 'wireframe'));
      } else if (e.key === 't' || e.key === 'T') {
        onMaterialSettingsChange({ showTexture: !materialSettings.showTexture });
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGrid((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        onUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        onRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onRedo, onMaterialSettingsChange, materialSettings.showTexture]);

  // 8. Raycast Sculpting Interactions
  const raycaster = useRef(new THREE.Raycaster()).current;
  const mouse = useRef(new THREE.Vector2()).current;

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current || !meshRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const cam = isOrthographic ? orthographicCameraRef.current! : perspectiveCameraRef.current!;
    if (!cam) return;

    raycaster.setFromCamera(mouse, cam);

    const intersects = raycaster.intersectObject(meshRef.current);

    if (intersects.length > 0 && sculptSettings.activeTool !== 'none') {
      const hit = intersects[0];
      if (brushCursorRef.current) {
        brushCursorRef.current.visible = true;
        brushCursorRef.current.position.copy(hit.point);
        if (hit.face) {
          brushCursorRef.current.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 0, 1),
            hit.face.normal
          );
        }
        brushCursorRef.current.scale.setScalar(sculptSettings.brushRadius * 20);
      }

      if (isSculpting && hit.face) {
        const modified = MeshSculpt.applySculptBrush(
          meshRef.current.geometry,
          hit.point,
          hit.face.normal,
          sculptSettings
        );
        if (modified) {
          meshRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }
    } else {
      if (brushCursorRef.current) brushCursorRef.current.visible = false;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (sculptSettings.activeTool !== 'none' && e.button === 0) {
      if (controlsRef.current) controlsRef.current.enabled = false;
      setIsSculpting(true);
      handlePointerMove(e);
    }
  };

  const handlePointerUp = () => {
    if (isSculpting) {
      setIsSculpting(false);
      if (controlsRef.current) controlsRef.current.enabled = true;
      if (meshRef.current) {
        onMeshModified(meshRef.current.geometry.clone());
      }
    }
  };

  return (
    <div
      id="viewport-3d-container"
      ref={containerRef}
      className="relative flex-1 h-full w-full bg-[#111419] overflow-hidden select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Top Floating Viewport Control Bar (Responsive for Desktop & Mobile) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
        {/* Left Side: Dedicated Texture Toggle & Render Mode Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[calc(100%-110px)] sm:max-w-none custom-scrollbar py-0.5 pointer-events-auto">
          {/* Main Texture On/Off Switch Button */}
          <button
            id="btn-viewport-toggle-texture"
            onClick={() => {
              const nextState = !materialSettings.showTexture;
              onMaterialSettingsChange({ showTexture: nextState });
              if (nextState) setRenderMode('textured');
            }}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold shadow-lg transition-all shrink-0 border cursor-pointer ${
              materialSettings.showTexture
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400/50 text-white shadow-blue-900/40'
                : 'bg-[#181d26]/90 backdrop-blur-md border-[#313a49] text-gray-300 hover:bg-[#252c38] hover:text-white'
            }`}
            title="Toggle Texture Map (T)"
          >
            <ImageIcon className={`w-3.5 h-3.5 ${materialSettings.showTexture ? 'text-cyan-200' : 'text-gray-400'}`} />
            <span className="whitespace-nowrap">
              {materialSettings.showTexture ? 'Texture: ON' : 'Texture: OFF'}
            </span>
          </button>

          {/* Render Mode Selectors */}
          <div className="flex items-center bg-[#181d26]/85 backdrop-blur-md p-0.5 rounded-lg border border-[#2e3745] shadow-lg shrink-0">
            {(
              [
                { mode: 'textured', label: 'Photo' },
                { mode: 'solid', label: 'Clay' },
                { mode: 'wireframe', label: 'Wire' },
                { mode: 'normals', label: 'Normals' },
                { mode: 'points', label: 'Points' },
              ] as const
            ).map((item) => (
              <button
                key={item.mode}
                onClick={() => {
                  setRenderMode(item.mode);
                  if (item.mode === 'textured') {
                    onMaterialSettingsChange({ showTexture: true });
                  } else if (item.mode === 'solid') {
                    onMaterialSettingsChange({ showTexture: false });
                  }
                }}
                className={`px-2 sm:px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  renderMode === item.mode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-300 hover:bg-[#252c38] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Quick Material Tweaks Toggle Button */}
          <button
            onClick={() => setShowQuickMaterialMenu((prev) => !prev)}
            className={`p-1.5 rounded-lg border shadow-lg transition-colors shrink-0 cursor-pointer ${
              showQuickMaterialMenu
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-[#181d26]/85 backdrop-blur-md border-[#2e3745] text-gray-300 hover:bg-[#252c38] hover:text-white'
            }`}
            title="Quick Material Settings"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Side: Camera Quick Tools (Fit, Reset, Grid) */}
        <div className="flex items-center gap-1 bg-[#181d26]/85 backdrop-blur-md p-1 rounded-lg border border-[#2e3745] shadow-lg pointer-events-auto shrink-0">
          <button
            onClick={fitCameraToModel}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#202734] hover:bg-[#2c3647] text-gray-200 text-[11px] cursor-pointer"
            title="Fit Model (F)"
          >
            <Maximize2 className="w-3 h-3 text-blue-400" />
            <span className="hidden sm:inline">Fit (F)</span>
          </button>

          <button
            onClick={resetCamera}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#202734] hover:bg-[#2c3647] text-gray-200 text-[11px] cursor-pointer"
            title="Reset Camera (R)"
          >
            <RefreshCw className="w-3 h-3 text-gray-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`p-1 sm:px-2 sm:py-1 rounded text-[11px] flex items-center gap-1 cursor-pointer ${
              showGrid ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'bg-[#202734] text-gray-400'
            }`}
            title="Toggle Grid (G)"
          >
            <Grid className="w-3 h-3" />
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Floating Quick Material Popover */}
      {showQuickMaterialMenu && (
        <div className="absolute top-12 left-2.5 w-64 bg-[#161a22]/95 backdrop-blur-md p-3 rounded-xl border border-[#2e3745] shadow-2xl z-20 text-xs text-gray-200 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#262c36] pb-1.5">
            <span className="font-semibold text-xs text-gray-100 flex items-center gap-1.5">
              <Paintbrush className="w-3.5 h-3.5 text-indigo-400" />
              <span>Material & Shading</span>
            </span>
            <button
              onClick={() => setShowQuickMaterialMenu(false)}
              className="text-gray-400 hover:text-white text-[11px] cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Texture Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Texture Map</span>
            <input
              type="checkbox"
              checked={materialSettings.showTexture}
              onChange={(e) => onMaterialSettingsChange({ showTexture: e.target.checked })}
              className="accent-blue-500 rounded cursor-pointer"
            />
          </div>

          {/* Clay Color Presets */}
          <div>
            <div className="text-[11px] text-gray-400 mb-1">Clay Surface Color</div>
            <div className="flex items-center gap-1.5">
              {[
                { name: 'Slate', color: '#a0aec0' },
                { name: 'Alabaster', color: '#f1f5f9' },
                { name: 'Terracotta', color: '#c2785c' },
                { name: 'Bronze', color: '#b48a5c' },
                { name: 'Dark Stone', color: '#475569' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => onMaterialSettingsChange({ clayColor: c.color, showTexture: false })}
                  className="w-6 h-6 rounded-full border border-gray-600 transition-transform hover:scale-110 shadow-sm cursor-pointer"
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Roughness */}
          <div>
            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
              <span>Roughness</span>
              <span className="font-mono text-gray-200">{materialSettings.roughness.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={materialSettings.roughness}
              onChange={(e) => onMaterialSettingsChange({ roughness: parseFloat(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-[#252b36] rounded"
            />
          </div>

          {/* Wireframe Overlay */}
          <div className="flex items-center justify-between pt-1 border-t border-[#262c36]">
            <span className="text-gray-300 text-[11px]">Wireframe Overlay</span>
            <input
              type="checkbox"
              checked={materialSettings.wireframeOverlay}
              onChange={(e) => onMaterialSettingsChange({ wireframeOverlay: e.target.checked })}
              className="accent-blue-500 rounded cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Floating Camera Angle Presets (Bottom Right on Desktop, minimized on mobile) */}
      <div className="hidden sm:flex absolute bottom-3 right-3 flex-col gap-1 bg-[#181d26]/85 backdrop-blur-md p-1.5 rounded-lg border border-[#2e3745] shadow-lg z-10 text-xs">
        <div className="text-[9px] uppercase font-bold text-gray-400 px-1 text-center tracking-wider">Angles</div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          {(['front', 'back', 'left', 'right', 'top', 'bottom'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCameraPreset(view)}
              className="px-1.5 py-0.5 rounded bg-[#202734] hover:bg-[#2c3647] text-gray-200 capitalize font-mono text-center cursor-pointer"
            >
              {view.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Instructions Overlay if no mesh */}
      {!geometry && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#1f2633] border border-[#313b4c] flex items-center justify-center mb-3 sm:mb-4 text-blue-400 shadow-xl">
            <Tv className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-100 mb-1">Interactive 3D Viewport</h2>
          <p className="text-xs text-gray-400 max-w-xs sm:max-w-sm">
            Import an image to start, then click{' '}
            <strong className="text-indigo-400 font-semibold">Generate 3D</strong> to run local AI depth estimation and view the textured 3D mesh.
          </p>
        </div>
      )}

      {/* Sculpt Brush Active Banner */}
      {sculptSettings.activeTool !== 'none' && (
        <div className="absolute bottom-3 left-3 bg-rose-950/90 border border-rose-600/60 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-lg text-xs text-rose-200 flex items-center gap-2 shadow-lg">
          <CircleDot className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs">
            Sculpt: <strong className="uppercase font-bold">{sculptSettings.activeTool}</strong> (Drag to Sculpt)
          </span>
        </div>
      )}
    </div>
  );
};
