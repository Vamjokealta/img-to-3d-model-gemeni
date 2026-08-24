/**
 * ImageTo3D Studio - Electron Preload Script
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFileDialog: (payload) => ipcRenderer.invoke('dialog:saveFile', payload),
  isDesktop: true,
  platform: process.platform,
});
