/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarWidget } from './components/CalendarWidget';
import { WindowsExportModal } from './components/WindowsExportModal';
import { WidgetSettings } from './types/calendar';

const DEFAULT_SETTINGS: WidgetSettings = {
  isLocked: false, // 默认解锁，便于用户首次启动立即自由拖动定位
  position: { x: 28, y: 28 }, // 默认左上角坐标 (28, 28)
  opacity: 0.98,
  blurEffect: true,
  autoStart: true, // 开机自启动
  alwaysOnTop: false, // 窗口置顶
};

export default function App() {
  // Load settings from localStorage
  const [settings, setSettings] = useState<WidgetSettings>(() => {
    try {
      const saved = localStorage.getItem('baidu_calendar_widget_settings');
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

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

  // Snap to Top-Left
  const handleResetTopLeft = useCallback(() => {
    handleUpdateSettings({ position: { x: 28, y: 28 }, isLocked: true });
    const api = (window as any).electronAPI;
    if (api?.resetTopLeft) {
      api.resetTopLeft();
    }
  }, [handleUpdateSettings]);

  // Toggle Lock
  const handleToggleLock = useCallback(() => {
    const nextLocked = !settings.isLocked;
    handleUpdateSettings({ isLocked: nextLocked });
    const api = (window as any).electronAPI;
    if (api?.setLockState) {
      api.setLockState(nextLocked);
    }
  }, [settings.isLocked, handleUpdateSettings]);

  // Change Opacity
  const handleChangeOpacity = useCallback((val: number) => {
    handleUpdateSettings({ opacity: val });
    const api = (window as any).electronAPI;
    if (api?.setOpacity) {
      api.setOpacity(val);
    }
  }, [handleUpdateSettings]);

  // Toggle Auto-Start
  const handleToggleAutoStart = useCallback(() => {
    const nextVal = !settings.autoStart;
    handleUpdateSettings({ autoStart: nextVal });
    const api = (window as any).electronAPI;
    if (api?.setAutoStart) {
      api.setAutoStart(nextVal);
    }
  }, [settings.autoStart, handleUpdateSettings]);

  // Toggle Always on Top
  const handleToggleAlwaysOnTop = useCallback(() => {
    const nextVal = !settings.alwaysOnTop;
    handleUpdateSettings({ alwaysOnTop: nextVal });
    const api = (window as any).electronAPI;
    if (api?.setAlwaysOnTop) {
      api.setAlwaysOnTop(nextVal);
    }
  }, [settings.alwaysOnTop, handleUpdateSettings]);

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
      api.onResetPosition?.(() => {
        handleResetTopLeft();
      });
    }
  }, [handleToggleLock, handleResetTopLeft, handleUpdateSettings]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (settings.isLocked) return;

    const target = e.target as HTMLElement;
    // Do not trigger drag if clicking buttons, inputs or links
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }

    // Only allow drag if clicking within drag handle bar
    const isDragHandle = target.closest('[data-drag-handle="true"]');
    if (!isDragHandle) return;

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

      // 2. Web 界面内的流畅坐标更新
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
      onMouseDown={handleMouseDown}
    >
      {/* Draggable & Lockable Calendar Widget Window */}
      <div
        className={`absolute z-30 transition-transform ${
          isCurrentlyDragging ? 'scale-[1.01] shadow-2xl duration-0' : 'duration-150'
        }`}
        style={{
          left: `${settings.position.x}px`,
          top: `${settings.position.y}px`,
        }}
      >
        <CalendarWidget
          isLocked={settings.isLocked}
          onToggleLock={handleToggleLock}
          onResetTopLeft={handleResetTopLeft}
          opacity={settings.opacity}
          onChangeOpacity={handleChangeOpacity}
          autoStart={settings.autoStart}
          onToggleAutoStart={handleToggleAutoStart}
          alwaysOnTop={settings.alwaysOnTop}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          blurEffect={settings.blurEffect}
          onOpenExportGuide={() => setIsExportModalOpen(true)}
        />
      </div>

      {/* Windows Deployment & Export Modal */}
      <WindowsExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
