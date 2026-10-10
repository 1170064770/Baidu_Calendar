const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  moveWindowBy: (dx, dy) => ipcRenderer.send('move-window-by', { dx, dy }),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
  setOpacity: (val) => ipcRenderer.send('set-opacity', val),
  setAlwaysOnBottom: (val) => ipcRenderer.send('set-always-on-bottom', val),
  setAlwaysOnTop: (val) => ipcRenderer.send('set-always-on-top', val),
  setAutoStart: (val) => ipcRenderer.send('set-auto-start', val),
  resetTopLeft: () => ipcRenderer.send('reset-top-left'),
  setLockState: (locked) => ipcRenderer.send('set-lock-state', locked),
  onToggleLock: (callback) => ipcRenderer.on('toggle-lock', (_event, locked) => callback(locked)),
  onResetPosition: (callback) => ipcRenderer.on('reset-position', () => callback()),
});
