import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Monitor, Download, ShieldCheck } from 'lucide-react';

interface WindowsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsExportModal: React.FC<WindowsExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const pythonScript = `# desktop_widget.py
# 依赖安装: pip install pywebview
import webview

if __name__ == '__main__':
    # 创建无边框、透明、固定在左上角 (28, 28) 的 Windows 桌面小组件窗口
    window = webview.create_window(
        title='百度日历桌面小组件',
        url='${window.location.origin}',
        width=480,
        height=660,
        x=28,
        y=28,
        frameless=True,       # 无边框，与桌面完美融合
        easy_drag=False,      # 使用网页内置的锁定/拖拽系统
        on_top=False,         # 贴合在桌面背景层
        transparent=True,     # 透明毛玻璃支持
        background_color='#00000000'
    )
    webview.start()
`;

  const electronScript = `// main.js (Electron 极简桌面挂件)
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 660,
    x: 28,
    y: 28,
    frame: false,             // 无边框原生挂件
    transparent: true,        // 背景透明穿透
    alwaysOnTop: false,       // 桌面壁纸层
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false
    }
  });

  win.loadURL('${window.location.origin}');
}

app.whenReady().then(createWindow);
`;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 text-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
              历
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Windows 桌面应用使用与部署指南
              </h3>
              <p className="text-xs text-slate-500">
                支持浏览器内直接无感置顶、PWA 独立窗口或原生无边框桌面程序
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Method 1: PWA Standalone */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
            <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
              <Monitor className="w-4 h-4 text-blue-600" />
              <span>方式一：PWA 独立桌面窗口（推荐 · 免安装代码）</span>
            </div>
            <p className="text-xs text-blue-800/80 mb-3 leading-relaxed">
              支持在 Edge 或 Chrome 浏览器中一键固定为独立 Windows 桌面程序，拥有独立窗口和任务栏图标，无需开启浏览器主窗口：
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1.5 bg-white p-3 rounded-lg border border-blue-100/80">
              <li>
                使用 <strong>Microsoft Edge</strong> 或 <strong>Google Chrome</strong> 打开当前页面。
              </li>
              <li>
                点击浏览器地址栏右侧的 <strong>“应用已可安装” (App install)</strong> 图标，或点击右上角菜单 <code>...</code> → <strong>应用</strong> → <strong>将此站点作为应用安装</strong>。
              </li>
              <li>
                勾选“创建桌面快捷方式”，即可在 Windows 桌面上双击秒开独立小组件窗口！
              </li>
            </ol>
          </div>

          {/* Method 2: Python pywebview */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Terminal className="w-4 h-4 text-slate-700" />
                <span>方式二：Python 极简原生透明桌面挂件 (PyWebView)</span>
              </div>
              <button
                onClick={() => handleCopy(pythonScript, 'python')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors shadow-2xs"
              >
                {copiedType === 'python' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>已复制脚本</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制脚本</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              仅需 15 行代码，通过 Windows 原生 Webview 渲染，支持真正的无边框桌面壁纸常驻：
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] overflow-x-auto font-mono leading-relaxed">
              {pythonScript}
            </pre>
          </div>

          {/* Method 3: Electron Native */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>方式三：Electron 打包为 Windows .exe</span>
              </div>
              <button
                onClick={() => handleCopy(electronScript, 'electron')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors shadow-2xs"
              >
                {copiedType === 'electron' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>复制配置</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              可配合 <code>electron-packager</code> 或 <code>electron-builder</code> 打包为可分发的 Windows 安装包或绿色版 exe。
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] overflow-x-auto font-mono leading-relaxed">
              {electronScript}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
