const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  setOpacity: (val) => ipcRenderer.send('set-opacity', val),
  setAlwaysOnTop: (val) => ipcRenderer.send('set-always-on-top', val),
  setAutoStart: (val) => ipcRenderer.send('set-auto-start', val),
  resetTopLeft: () => ipcRenderer.send('reset-top-left'),
  onToggleLock: (callback) => ipcRenderer.on('toggle-lock', () => callback()),
  onResetPosition: (callback) => ipcRenderer.on('reset-position', () => callback()),
});
