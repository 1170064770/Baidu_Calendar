const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isLocked = true;
let isAlwaysOnTop = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 490,
    height: 670,
    x: 28, // 默认无感固定在桌面左上角
    y: 28,
    frame: false, // 无边框窗口，实现桌面挂件
    transparent: true, // 背景透明支持
    resizable: true,
    skipTaskbar: false,
    hasShadow: true,
    alwaysOnTop: isAlwaysOnTop, // 贴合在桌面壁纸层
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function updateTrayMenu() {
  if (!tray) return;

  const loginItem = app.getLoginItemSettings();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '百度日历桌面小组件',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '显示 / 隐藏小组件',
      click: () => {
        if (!mainWindow) {
          createWindow();
        } else if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: '锁定挂件 (防误触拖动)',
      type: 'checkbox',
      checked: isLocked,
      click: (item) => {
        isLocked = item.checked;
        if (mainWindow) {
          mainWindow.webContents.send('toggle-lock', isLocked);
        }
      },
    },
    {
      label: '固定到桌面左上角 (28, 28)',
      click: () => {
        if (mainWindow) {
          mainWindow.setPosition(28, 28);
          mainWindow.webContents.send('reset-position');
          mainWindow.show();
        }
      },
    },
    {
      label: '透明度设置',
      submenu: [
        {
          label: '100% (完全不透明)',
          click: () => mainWindow && mainWindow.setOpacity(1.0),
        },
        {
          label: '90% (轻微磨砂)',
          click: () => mainWindow && mainWindow.setOpacity(0.9),
        },
        {
          label: '80% (透亮悬浮)',
          click: () => mainWindow && mainWindow.setOpacity(0.8),
        },
        {
          label: '70% (极简通透)',
          click: () => mainWindow && mainWindow.setOpacity(0.7),
        },
      ],
    },
    {
      label: '开机自启动',
      type: 'checkbox',
      checked: loginItem.openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({
          openAtLogin: item.checked,
          path: process.execPath,
        });
      },
    },
    {
      label: '窗口始终置顶',
      type: 'checkbox',
      checked: isAlwaysOnTop,
      click: (item) => {
        isAlwaysOnTop = item.checked;
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(isAlwaysOnTop);
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  try {
    // 动态生成一个简单的 16x16 蓝色托盘图标（带汉字或色块）
    const icon = nativeImage.createEmpty();
    tray = new Tray(icon);
  } catch (e) {
    // fallback
  }

  if (tray) {
    tray.setToolTip('百度日历桌面小组件');
    updateTrayMenu();

    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  }
}

// 监听渲染进程 IPC 消息
ipcMain.on('set-opacity', (_event, val) => {
  if (mainWindow && typeof val === 'number') {
    mainWindow.setOpacity(Math.max(0.3, Math.min(1.0, val)));
  }
});

ipcMain.on('set-always-on-top', (_event, val) => {
  isAlwaysOnTop = Boolean(val);
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  }
  updateTrayMenu();
});

ipcMain.on('set-auto-start', (_event, val) => {
  app.setLoginItemSettings({
    openAtLogin: Boolean(val),
    path: process.execPath,
  });
  updateTrayMenu();
});

ipcMain.on('reset-top-left', () => {
  if (mainWindow) {
    mainWindow.setPosition(28, 28);
  }
});

// 单实例锁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
