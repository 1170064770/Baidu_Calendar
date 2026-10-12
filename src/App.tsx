/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarWidget } from './components/CalendarWidget';
import { WindowsExportModal } from './components/WindowsExportModal';
import { WidgetSettings } from './types/calendar';
import { HelpCircle } from 'lucide-react';

const DEFAULT_SETTINGS: WidgetSettings = {
  isLocked: false, // 默认可交互，可在系统托盘中一键锁定融入壁纸
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

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastScreenPosRef = useRef({ x: 0, y: 0 });
  const [isCurrentlyDragging, setIsCurrentlyDragging] = useState(false);

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
    if (nextLocked && api?.trimMemory) {
      setTimeout(() => api.trimMemory(), 300);
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
      api.onTriggerGc?.(() => {
        if (typeof (window as any).gc === 'function') {
          try {
            (window as any).gc();
          } catch (e) {
            // ignore
          }
        }
      });
    }
  }, [handleToggleLock, handleUpdateSettings]);



  // Mouse drag handlers on the calendar card when unlocked
  const handleMouseDown = (e: React.MouseEvent) => {
    if (settings.isLocked) return;

    const target = e.target as HTMLElement;
    // Don't drag when clicking buttons, inputs, links, dropdown items, or modals
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('a') ||
      target.closest('[data-no-drag="true"]') ||
      target.closest('.dropdown-scroll') ||
      target.closest('[role="dialog"]')
    ) {
      return;
    }

    // Only drag when clicking inside the calendar widget card
    const widgetCard = target.closest('[data-widget-container="true"]');
    if (!widgetCard) {
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
        // 彻底禁用小组件右键弹出菜单，保持纯净桌面挂件体验
        e.preventDefault();
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

      {/* 浏览器网页端查看 Windows 部署指南入口 (Electron 桌面原生环境隐藏) */}
      {!(window as any).electronAPI?.isElectron && (
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="fixed bottom-3 right-3 z-40 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-blue-600 text-xs font-medium rounded-full shadow-md border border-slate-200 transition-all cursor-pointer"
          title="Windows 桌面打包与运行说明"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>打包指南</span>
        </button>
      )}

      {/* Windows Deployment & Export Modal */}
      <WindowsExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
