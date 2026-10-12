const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  moveWindowBy: (dx, dy) => ipcRenderer.send('move-window-by', { dx, dy }),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
  setOpacity: (val) => ipcRenderer.send('set-opacity', val),
  setAutoStart: (val) => ipcRenderer.send('set-auto-start', val),
  toggleVisibility: () => ipcRenderer.send('toggle-visibility'),
  resetTopLeft: () => ipcRenderer.send('reset-top-left'),
  setLockState: (locked) => ipcRenderer.send('set-lock-state', locked),
  trimMemory: () => ipcRenderer.send('trim-memory'),
  onToggleLock: (callback) => ipcRenderer.on('toggle-lock', (_event, locked) => callback(locked)),
  onToggleVisibility: (callback) => ipcRenderer.on('toggle-visibility', (_event, vis) => callback(vis)),
  onResetPosition: (callback) => ipcRenderer.on('reset-position', () => callback()),
  onTriggerGc: (callback) => ipcRenderer.on('trigger-gc', () => callback()),
});
