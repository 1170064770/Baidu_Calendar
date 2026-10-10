/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarWidget } from './components/CalendarWidget';
import { SystemTray } from './components/SystemTray';
import { WindowsExportModal } from './components/WindowsExportModal';
import { WidgetSettings } from './types/calendar';

const DEFAULT_SETTINGS: WidgetSettings = {
  isLocked: true, // 默认无感固定在桌面左上角
  position: { x: 28, y: 28 }, // 左上角坐标 (28, 28)
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
    if ((window as any).electronAPI?.resetTopLeft) {
      (window as any).electronAPI.resetTopLeft();
    }
  }, [handleUpdateSettings]);

  // Toggle Lock
  const handleToggleLock = useCallback(() => {
    handleUpdateSettings({ isLocked: !settings.isLocked });
  }, [settings.isLocked, handleUpdateSettings]);

  // Listen to native Electron tray events if running in Electron
  useEffect(() => {
    const api = (window as any).electronAPI;
    if (api) {
      api.onToggleLock?.(() => {
        handleToggleLock();
      });
      api.onResetPosition?.(() => {
        handleResetTopLeft();
      });
    }
  }, [handleToggleLock, handleResetTopLeft]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (settings.isLocked) return;

    // Only allow drag if clicking on the drag handle
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest('[data-drag-handle="true"]');
    if (!isDragHandle) return;

    isDraggingRef.current = true;
    setIsCurrentlyDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - settings.position.x,
      y: e.clientY - settings.position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      let newX = e.clientX - dragOffsetRef.current.x;
      let newY = e.clientY - dragOffsetRef.current.y;

      // Screen containment boundaries
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
        // Persist final position
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
      className="relative w-screen h-screen overflow-hidden select-none font-sans text-slate-800 bg-slate-900/10"
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
          blurEffect={settings.blurEffect}
          onOpenExportGuide={() => setIsExportModalOpen(true)}
        />
      </div>

      {/* Windows Style System Tray in bottom-right */}
      <SystemTray
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetTopLeft={handleResetTopLeft}
        onOpenGuide={() => setIsExportModalOpen(true)}
      />

      {/* Windows Deployment & Export Modal */}
      <WindowsExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
