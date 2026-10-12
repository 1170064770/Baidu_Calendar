const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// ==========================================
// 极致低内存调优 (在不损失任何功能的前提下，以性能换取超低运行内存)
// ==========================================
// 1. V8 引擎极限瘦身：
//    --max-old-space-size=48: 将老生代内存上限严格限制为 48MB，促使 V8 主动回收垃圾避免无度膨胀
//    --expose-gc: 暴露 GC 回收接口，便于定时和空闲时深度清理内存
//    --optimize-for-size: 告知 V8 编译器优先追求最小代码与数据尺寸，牺牲极端微秒级计算性能
//    --lite-mode: 启用 V8 精简模式，关闭激进的 JIT TurboFan 多层优化和庞大的反馈向量，大幅节省数十兆内存
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=48 --expose-gc --optimize-for-size --lite-mode');

// 2. 严格限制单个渲染进程，消灭多渲染进程带来的重复基础库开销
app.commandLine.appendSwitch('renderer-process-limit', '1');

// 3. 彻底禁用 Chromium 中与日历挂件无关的后台服务与庞大子系统
app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');
app.commandLine.appendSwitch('disable-sync');
app.commandLine.appendSwitch('disable-breakpad');
app.commandLine.appendSwitch('disable-metrics');
app.commandLine.appendSwitch('disable-metrics-repo');
app.commandLine.appendSwitch('disable-speech-api');
app.commandLine.appendSwitch('disable-speech-synthesis-api');
app.commandLine.appendSwitch('disable-print-preview');
app.commandLine.appendSwitch('disable-default-apps');

// 4. 禁用不必要的网页预取、后台特性及页面前进后退缓存
app.commandLine.appendSwitch(
  'disable-features',
  'CalculateNativeWinOcclusion,MediaRouter,OptimizationHints,Translate,BackForwardCache,InterestFeedContentSuggestions,Autofill'
);

// 5. 限制磁盘与媒体缓存为 1MB，禁用 GPU 着色器磁盘缓存与 WebGL 3D（日历仅需 2D 文本和卡片渲染）
app.commandLine.appendSwitch('disk-cache-size', '1048576');
app.commandLine.appendSwitch('media-cache-size', '1048576');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-webgl');
app.commandLine.appendSwitch('disable-webgl2');

// 6. 开启 Chromium 积极内存回收策略
app.commandLine.appendSwitch('enable-features', 'PurgeAndSuspend');

let mainWindow = null;
let tray = null;
let isLocked = true;
let isQuitting = false;

// 深度内存清理函数：释放会话缓存并强制触发主进程和渲染进程 GC
async function trimProcessMemory() {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const ses = mainWindow.webContents.session;
      await ses.clearCache();
      mainWindow.webContents.send('trigger-gc');
    }
  } catch (e) {
    // ignore
  }

  // 触发 Node / V8 主进程强制垃圾回收
  if (global.gc) {
    try {
      global.gc();
    } catch (e) {
      // ignore
    }
  }
}

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
  return { x: 28, y: 28, opacity: 0.98, isLocked: true };
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

  const appIconPath = path.join(__dirname, '../public/icon.png');

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
    alwaysOnTop: false, // 桌面壁纸底层挂件，不遮挡其他软件
    icon: fs.existsSync(appIconPath) ? appIconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      devTools: false, // 禁用 DevTools 核心，减少常驻代理内存
      spellcheck: false, // 禁用拼写检查字典，直接节约 25MB+ 内存
      webgl: false, // 禁用 WebGL 3D 渲染，释放 GPU 进程上下文池
      plugins: false,
      enableWebSQL: false,
      backgroundThrottling: true, // 允许后台挂起节流，降低静止驻留消耗
      v8CacheOptions: 'none', // 禁用冗余的代码缓存
    },
  });

  if (typeof config.opacity === 'number') {
    mainWindow.setOpacity(config.opacity);
  }

  const indexPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    applyLockState(isLocked);
    // 启动 2 秒渲染完毕后，立即进行初次深度内存清理，回收启动初始化的垃圾
    setTimeout(trimProcessMemory, 2000);
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

  mainWindow.on('show', () => {
    mainWindow?.webContents.send('toggle-visibility', true);
  });

  mainWindow.on('hide', () => {
    mainWindow?.webContents.send('toggle-visibility', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function applyLockState(locked) {
  isLocked = Boolean(locked);
  saveConfig({ isLocked });
  if (mainWindow) {
    try {
      if (isLocked) {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
        // 当锁定并融入桌面壁纸时，界面进入静止展示状态，立即触发深度内存压缩与 GC
        setTimeout(trimProcessMemory, 300);
      } else {
        mainWindow.setIgnoreMouseEvents(false);
      }
    } catch (e) {
      mainWindow.setIgnoreMouseEvents(isLocked);
    }
    mainWindow.webContents.send('toggle-lock', isLocked);
  }
  updateTrayMenu();
}

function toggleWindowVisibility() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
    // 隐藏窗口时深度释放渲染缓存
    setTimeout(trimProcessMemory, 200);
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
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
      label: '显示/隐藏小组件',
      click: () => {
        toggleWindowVisibility();
      },
    },
    {
      label: '改变位置',
      submenu: [
        {
          label: '🔓 解锁以自由拖动改变位置',
          click: () => {
            applyLockState(false);
          },
        },
        {
          label: '🔒 锁定当前位置并融入壁纸',
          click: () => {
            applyLockState(true);
          },
        },
      ],
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
      label: '⚡ 深度清理运行内存',
      click: () => {
        trimProcessMemory();
      },
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

  // 单击/双击托盘显示/隐藏日历
  tray.on('click', () => {
    toggleWindowVisibility();
  });

  tray.on('double-click', () => {
    toggleWindowVisibility();
  });
}

// 监听渲染进程 IPC 消息
ipcMain.on('toggle-visibility', () => {
  toggleWindowVisibility();
});

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
  applyLockState(locked);
});

ipcMain.on('trim-memory', () => {
  trimProcessMemory();
});

// 每 60 秒在后台静默进行轻量级内存与会话缓存整理
setInterval(trimProcessMemory, 60000);

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
