# Depth Anything V2 ONNX Model Directory

Place your offline ONNX model weights in this directory:

```
models/
  depth-anything-v2/
    depthanythingv2.onnx
```

### Supported Models
- **Depth-Anything-V2-Small (ONNX)** (~98 MB) - High speed, recommended for CPU/WASM.
- **Depth-Anything-V2-Base (ONNX)** (~380 MB) - Balanced speed and high geometric detail.
- **Depth-Anything-V2-Large (ONNX)** (~1.3 GB) - Maximum precision for GPU/WebGPU/DirectML.

### Input / Output Tensor Specifications
- **Input Name**: `input` or `image`
- **Input Tensor Shape**: `[1, 3, 518, 518]` (Float32, ImageNet normalized: Mean `[0.485, 0.456, 0.406]`, Std `[0.229, 0.224, 0.225]`)
- **Output Name**: `depth` or `output`
- **Output Tensor Shape**: `[1, 518, 518]` or `[1, 1, 518, 518]` (Float32)

### Fallback Mode
If no `.onnx` model file is loaded, ImageTo3D Studio automatically engages the built-in multi-scale Saliency & Geometric Depth Estimator so you can test and generate 3D models immediately without downloading external model files.
