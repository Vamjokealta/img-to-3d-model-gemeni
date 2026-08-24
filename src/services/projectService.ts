/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DepthMapData, DepthSettings, MeshSettings, ProjectState } from '../types';
import { ExportService } from './exportService';
import { logger } from './logger';

export class ProjectService {
  /**
   * Save current project state as .my3d file
   */
  public static saveProject(
    imageName: string,
    imageDataUrl: string,
    depthMap: DepthMapData | null,
    depthSettings: DepthSettings,
    meshSettings: MeshSettings,
    filename: string = 'project.my3d'
  ): void {
    const project: ProjectState = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      imageName,
      imageDataUrl,
      depthSettings,
      meshSettings,
      hasDepthMap: !!depthMap,
      depthData: depthMap ? Array.from(depthMap.data) : undefined,
      depthWidth: depthMap ? depthMap.width : undefined,
      depthHeight: depthMap ? depthMap.height : undefined,
    };

    const jsonString = JSON.stringify(project);
    const blob = new Blob([jsonString], { type: 'application/json' });
    ExportService.triggerDownload(blob, filename.endsWith('.my3d') ? filename : `${filename}.my3d`);
    logger.success(`Project saved: ${filename}`);
  }

  /**
   * Load .my3d project file
   */
  public static async loadProject(file: File): Promise<{
    imageName: string;
    imageDataUrl: string;
    depthMap: DepthMapData | null;
    depthSettings: DepthSettings;
    meshSettings: MeshSettings;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const project: ProjectState = JSON.parse(content);

          let depthMap: DepthMapData | null = null;
          if (project.hasDepthMap && project.depthData && project.depthWidth && project.depthHeight) {
            depthMap = {
              width: project.depthWidth,
              height: project.depthHeight,
              data: new Float32Array(project.depthData),
              minDepth: 0.0,
              maxDepth: 1.0,
              inferenceTimeMs: 0,
              backendUsed: 'fallback-geometric',
            };
          }

          logger.success(`Project loaded: ${project.imageName}`);
          resolve({
            imageName: project.imageName || 'imported_image',
            imageDataUrl: project.imageDataUrl,
            depthMap,
            depthSettings: project.depthSettings,
            meshSettings: project.meshSettings,
          });
        } catch (err) {
          logger.error('Failed to parse project file', String(err));
          reject(new Error('Invalid project file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read project file'));
      reader.readAsText(file);
    });
  }
}
