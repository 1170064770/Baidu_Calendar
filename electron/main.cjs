const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;
let isLocked = true;
let isAlwaysOnTop = false;
let isQuitting = false;

// 配置文件路径，持久保存位置和设置
const configPath = path.join(app.getPath('userData'), 'widget-config.json');

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {
    // ignore
  }
  return { x: 28, y: 28, opacity: 0.98, isLocked: true, isAlwaysOnTop: false };
}

function saveConfig(cfg) {
  try {
    const current = loadConfig();
    const updated = { ...current, ...cfg };
    fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    // ignore
  }
}

function createWindow() {
  const config = loadConfig();
  isLocked = config.isLocked ?? true;
  isAlwaysOnTop = config.isAlwaysOnTop ?? false;

  mainWindow = new BrowserWindow({
    width: 485,
    height: 675,
    x: config.x ?? 28, // 持久化记录的位置，默认左上角 (28, 28)
    y: config.y ?? 28,
    frame: false, // 无边框窗口，实现真正纯净的桌面挂件
    transparent: true, // 背景透明支持
    resizable: false,
    skipTaskbar: true, // 核心需求：不出现在 Windows 任务栏，只保留系统托盘图标
    hasShadow: true,
    alwaysOnTop: isAlwaysOnTop,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  if (typeof config.opacity === 'number') {
    mainWindow.setOpacity(config.opacity);
  }

  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 窗口位置变动时持久化保存
  mainWindow.on('moved', () => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      saveConfig({ x, y });
    }
  });

  // 核心需求：持久固定到桌面，防止误触关闭，直到托盘选择“退出应用”
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      // 不关闭，保持常驻桌面
      return false;
    }
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
      label: '显示小组件',
      click: () => {
        if (!mainWindow) {
          createWindow();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: '锁定挂件 (锁定固定 / 解锁拖动)',
      type: 'checkbox',
      checked: isLocked,
      click: (item) => {
        isLocked = item.checked;
        saveConfig({ isLocked });
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
          saveConfig({ x: 28, y: 28 });
          mainWindow.webContents.send('reset-position');
          mainWindow.show();
        }
      },
    },
    {
      label: '背景透明度',
      submenu: [
        {
          label: '100% (不透明)',
          click: () => setOpacity(1.0),
        },
        {
          label: '90% (轻微磨砂)',
          click: () => setOpacity(0.9),
        },
        {
          label: '80% (透亮悬浮)',
          click: () => setOpacity(0.8),
        },
        {
          label: '70% (极简通透)',
          click: () => setOpacity(0.7),
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
        saveConfig({ isAlwaysOnTop });
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(isAlwaysOnTop);
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出应用',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function setOpacity(val) {
  if (mainWindow) {
    mainWindow.setOpacity(val);
    saveConfig({ opacity: val });
  }
}

function createTray() {
  // 核心需求：使用有清晰图案的日历图标（红顶白页蓝网格）
  const iconPath = path.join(__dirname, '../public/tray-icon.png');
  let icon = null;

  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    // 降级使用内置图标
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('百度日历桌面小组件 (常驻桌面)');
  updateTrayMenu();

  // 单击/双击托盘显示日历
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// 监听渲染进程 IPC 消息
ipcMain.on('move-window-by', (_event, { dx, dy }) => {
  if (mainWindow && !isLocked) {
    const [curX, curY] = mainWindow.getPosition();
    const newX = curX + dx;
    const newY = curY + dy;
    mainWindow.setPosition(newX, newY);
    saveConfig({ x: newX, y: newY });
  }
});

ipcMain.on('set-window-position', (_event, { x, y }) => {
  if (mainWindow) {
    mainWindow.setPosition(x, y);
    saveConfig({ x, y });
  }
});

ipcMain.on('set-opacity', (_event, val) => {
  setOpacity(val);
});

ipcMain.on('set-always-on-top', (_event, val) => {
  isAlwaysOnTop = Boolean(val);
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  }
  saveConfig({ isAlwaysOnTop });
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
    saveConfig({ x: 28, y: 28 });
  }
});

ipcMain.on('set-lock-state', (_event, locked) => {
  isLocked = Boolean(locked);
  saveConfig({ isLocked });
  updateTrayMenu();
});

// 退出应用
app.on('before-quit', () => {
  isQuitting = true;
});

// 单实例运行锁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
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
