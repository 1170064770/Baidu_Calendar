/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarWidget } from './components/CalendarWidget';
import { WindowsExportModal } from './components/WindowsExportModal';
import { WidgetSettings } from './types/calendar';
import {
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Power,
  HelpCircle,
  X,
  Compass,
} from 'lucide-react';

const DEFAULT_SETTINGS: WidgetSettings = {
  isLocked: true, // 默认锁定位置
  position: { x: 28, y: 28 }, // 默认位置坐标 (28, 28)
  opacity: 0.98,
  blurEffect: true,
  autoStart: true, // 开机自启动
};

export default function App() {
  // Load settings from localStorage
  const [settings, setSettings] = useState<WidgetSettings>(() => {
    try {
      const saved = localStorage.getItem('baidu_calendar_widget_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  const [isVisible, setIsVisible] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTrayMenuOpen, setIsTrayMenuOpen] = useState(false);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastScreenPosRef = useRef({ x: 0, y: 0 });
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false);

  const trayMenuRef = useRef<HTMLDivElement>(null);

  // Save settings on update
  const handleUpdateSettings = useCallback((newPartial: Partial<WidgetSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newPartial };
      try {
        localStorage.setItem('baidu_calendar_widget_settings', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  }, []);

  // Toggle Visibility (显示/隐藏小组件)
  const handleToggleVisibility = useCallback(() => {
    setIsVisible((prev) => {
      const nextVal = !prev;
      const api = (window as any).electronAPI;
      if (api?.toggleVisibility) {
        api.toggleVisibility();
      }
      return nextVal;
    });
  }, []);

  // Toggle Lock State
  const handleToggleLock = useCallback(() => {
    const nextLocked = !settings.isLocked;
    handleUpdateSettings({ isLocked: nextLocked });
    const api = (window as any).electronAPI;
    if (api?.setLockState) {
      api.setLockState(nextLocked);
    }
  }, [settings.isLocked, handleUpdateSettings]);

  // Change Opacity
  const handleChangeOpacity = useCallback(
    (val: number) => {
      handleUpdateSettings({ opacity: val });
      const api = (window as any).electronAPI;
      if (api?.setOpacity) {
        api.setOpacity(val);
      }
    },
    [handleUpdateSettings]
  );

  // Toggle Auto-Start
  const handleToggleAutoStart = useCallback(() => {
    const nextVal = !settings.autoStart;
    handleUpdateSettings({ autoStart: nextVal });
    const api = (window as any).electronAPI;
    if (api?.setAutoStart) {
      api.setAutoStart(nextVal);
    }
  }, [settings.autoStart, handleUpdateSettings]);

  // Listen to native Electron tray events if running in Electron
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api) {
      api.onToggleLock?.((locked?: boolean) => {
        if (typeof locked === 'boolean') {
          handleUpdateSettings({ isLocked: locked });
        } else {
          handleToggleLock();
        }
      });
      api.onToggleVisibility?.((vis?: boolean) => {
        if (typeof vis === 'boolean') {
          setIsVisible(vis);
        } else {
          setIsVisible((prev) => !prev);
        }
      });
      api.onResetPosition?.(() => {
        handleUpdateSettings({ position: { x: 28, y: 28 } });
      });
    }
  }, [handleToggleLock, handleUpdateSettings]);

  // Close tray menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (trayMenuRef.current && !trayMenuRef.current.contains(e.target as Node)) {
        setIsTrayMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mouse drag handlers on the calendar card when unlocked
  const handleMouseDown = (e: React.MouseEvent) => {
    if (settings.isLocked) return;

    const target = e.target as HTMLElement;
    // Don't drag when clicking buttons, inputs, links or dropdown items
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('[data-no-drag="true"]')
    ) {
      return;
    }

    isDraggingRef.current = true;
    setIsCurrentlyDragging(true);

    dragOffsetRef.current = {
      x: e.clientX - settings.position.x,
      y: e.clientY - settings.position.y,
    };
    lastScreenPosRef.current = {
      x: e.screenX,
      y: e.screenY,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const api = (window as any).electronAPI;

      // 1. Electron 原生窗口物理移动支持
      if (api?.moveWindowBy && (lastScreenPosRef.current.x !== 0 || lastScreenPosRef.current.y !== 0)) {
        const dx = e.screenX - lastScreenPosRef.current.x;
        const dy = e.screenY - lastScreenPosRef.current.y;
        if (dx !== 0 || dy !== 0) {
          api.moveWindowBy(dx, dy);
          lastScreenPosRef.current = { x: e.screenX, y: e.screenY };
        }
      }

      // 2. Web 界面内的坐标更新
      let newX = e.clientX - dragOffsetRef.current.x;
      let newY = e.clientY - dragOffsetRef.current.y;

      const widgetWidth = 460;
      const widgetHeight = 630;
      const maxX = Math.max(20, window.innerWidth - widgetWidth - 16);
      const maxY = Math.max(20, window.innerHeight - widgetHeight - 16);

      newX = Math.max(12, Math.min(newX, maxX));
      newY = Math.max(12, Math.min(newY, maxY));

      // Magnetic snap to top-left if within 45px
      if (newX < 45 && newY < 45) {
        newX = 28;
        newY = 28;
      }

      setSettings((prev) => ({
        ...prev,
        position: { x: newX, y: newY },
      }));
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsCurrentlyDragging(false);
        setSettings((current) => {
          try {
            localStorage.setItem('baidu_calendar_widget_settings', JSON.stringify(current));
          } catch (e) {}
          return current;
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none font-sans text-slate-800 bg-transparent"
      onMouseDown={settings.isLocked ? undefined : handleMouseDown}
      onContextMenu={(e) => {
        // Allow right-click anywhere on the desktop to toggle tray menu for convenience
        e.preventDefault();
        setIsTrayMenuOpen((prev) => !prev);
      }}
    >
      {/* Pure Calendar Widget Window (Zero Title Bar) */}
      <div
        className={`absolute z-30 transition-transform ${
          !isVisible ? 'hidden pointer-events-none' : ''
        } ${
          isCurrentlyDragging ? 'scale-[1.01] shadow-2xl duration-0' : 'duration-150'
        } ${settings.isLocked ? 'pointer-events-none' : 'pointer-events-auto'}`}
        style={{
          left: `${settings.position.x}px`,
          top: `${settings.position.y}px`,
        }}
      >
        <CalendarWidget
          isLocked={settings.isLocked}
          opacity={settings.opacity}
          blurEffect={settings.blurEffect}
        />
      </div>

      {/* System Tray Menu (Opens via Right-Click or Native Tray) */}
      {isTrayMenuOpen && (
        <div className="fixed bottom-4 right-4 z-40 select-none" ref={trayMenuRef}>
          <div
            className="w-72 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img
                  src="/tray-icon.png"
                  alt="日历托盘图标"
                  className="w-5 h-5 rounded-md shadow-2xs"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">系统托盘控制台</div>
                  <div className="text-[10px] text-slate-400">控制位置与组件属性</div>
                </div>
              </div>
              <button
                onClick={() => setIsTrayMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* 显示/隐藏小组件 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  {isVisible ? (
                    <Eye className="w-4 h-4 text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  )}
                  <div>
                    <div className="font-semibold text-slate-900">显示/隐藏小组件</div>
                    <div className="text-[10px] text-slate-500">
                      {isVisible ? '组件当前正常显示在桌面' : '组件当前已隐藏 (右键桌面可唤回)'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleToggleVisibility}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                    isVisible
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isVisible ? '隐藏' : '显示'}
                </button>
              </div>

              {/* 改变位置 */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-slate-800 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <span>改变位置</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {settings.isLocked ? '已锁定 (融入壁纸)' : '已解锁 (可自由拖动)'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  {settings.isLocked
                    ? '组件当前固定在桌面。点击下方按钮解锁后，即可在屏幕上自由拖拽小组件改变位置。'
                    : '当前已解锁交互，您可以直接在桌面上拖拽小组件到任意位置，调整完成后点击锁定。'}
                </div>

                <button
                  onClick={handleToggleLock}
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition-colors ${
                    settings.isLocked
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {settings.isLocked ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>解锁以拖拽改变位置</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>锁定位置并融入壁纸</span>
                    </>
                  )}
                </button>
              </div>

              {/* 透明度调节 */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-slate-700 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>背景透明度</span>
                  </div>
                  <span className="text-blue-600 font-bold">{Math.round(settings.opacity * 100)}%</span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={settings.opacity}
                  onChange={(e) => handleChangeOpacity(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="grid grid-cols-4 gap-1 text-[10px]">
                  {[1.0, 0.9, 0.8, 0.7].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleChangeOpacity(val)}
                      className={`py-1 rounded-md font-medium transition-colors ${
                        Math.abs(settings.opacity - val) < 0.03
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {Math.round(val * 100)}%
                    </button>
                  ))}
                </div>
              </div>

              {/* 开机自启动 */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Power className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900">开机自启动</div>
                    <div className="text-[10px] text-slate-500">登录系统后自动贴在桌面</div>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoStart}
                    onChange={handleToggleAutoStart}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* 部署指引 */}
              <button
                onClick={() => {
                  setIsTrayMenuOpen(false);
                  setIsExportModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Windows 桌面打包与运行说明</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Windows Deployment & Export Modal */}
      <WindowsExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
