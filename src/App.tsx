/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CalendarWidget } from './components/CalendarWidget';
import { DesktopControls, WALLPAPERS } from './components/DesktopControls';
import { WindowsTaskbar } from './components/WindowsTaskbar';
import { WindowsExportModal } from './components/WindowsExportModal';
import { WidgetSettings } from './types/calendar';
import { Monitor, Trash2, Calendar, HardDrive } from 'lucide-react';

const DEFAULT_SETTINGS: WidgetSettings = {
  isLocked: true, // Default pinned to top-left seamlessly as requested
  position: { x: 28, y: 28 }, // Seamless top-left coordinates
  opacity: 0.96,
  blurEffect: true,
  wallpaperId: 'win11-flow',
  viewMode: 'desktop',
  showTaskbar: true,
  soundEffects: false,
  autoSnapTopLeft: true,
};

export default function App() {
  // Load settings from localStorage
  const [settings, setSettings] = useState<WidgetSettings>(() => {
    try {
      const saved = localStorage.getItem('baidu_calendar_settings');
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
        localStorage.setItem('baidu_calendar_settings', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  }, []);

  // Snap to Top-Left
  const handleResetTopLeft = useCallback(() => {
    handleUpdateSettings({ position: { x: 28, y: 28 }, isLocked: true });
  }, [handleUpdateSettings]);

  // Toggle Lock
  const handleToggleLock = useCallback(() => {
    handleUpdateSettings({ isLocked: !settings.isLocked });
  }, [settings.isLocked, handleUpdateSettings]);

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
      const widgetHeight = 620;
      const maxX = Math.max(20, window.innerWidth - widgetWidth - 16);
      const maxY = Math.max(20, window.innerHeight - widgetHeight - 56);

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
            localStorage.setItem('baidu_calendar_settings', JSON.stringify(current));
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

  // Keyboard shortcut: Press 'L' to toggle lock, 'T' for top-left
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        handleToggleLock();
      } else if (e.key === 'p' || e.key === 'P') {
        handleResetTopLeft();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleLock, handleResetTopLeft]);

  // Current wallpaper
  const activeWallpaper =
    settings.customWallpaperUrl ||
    WALLPAPERS.find((w) => w.id === settings.wallpaperId)?.url ||
    WALLPAPERS[0].url;

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none font-sans text-slate-800 ${
        settings.viewMode === 'widget-only' ? 'bg-slate-900/90' : ''
      }`}
      style={{
        backgroundImage:
          settings.viewMode === 'desktop' ? `url(${activeWallpaper})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Desktop Overlay Tint (Subtle for readability) */}
      {settings.viewMode === 'desktop' && (
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      )}

      {/* Floating Control Toolbar */}
      <DesktopControls
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onResetTopLeft={handleResetTopLeft}
        onOpenExportGuide={() => setIsExportModalOpen(true)}
      />

      {/* Desktop Icons (Windows 11 style) - only shown when in desktop mode and away from widget */}
      {settings.viewMode === 'desktop' && (
        <div className="absolute top-6 left-6 z-10 flex flex-col gap-5 pointer-events-none opacity-0 sm:opacity-90 transition-opacity">
          {/* Note: Icons positioned underneath widget if widget is at top-left, or placed at top-left */}
        </div>
      )}

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

      {/* Windows 11 Bottom Taskbar */}
      {settings.viewMode === 'desktop' && (
        <div className="absolute bottom-0 left-0 right-0 z-40">
          <WindowsTaskbar
            onOpenCalendar={handleResetTopLeft}
            onOpenSettings={() => setIsExportModalOpen(true)}
          />
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
