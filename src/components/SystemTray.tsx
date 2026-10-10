import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  Volume2,
  Battery,
  Bluetooth,
  Lock,
  Unlock,
  Pin,
  Eye,
  Power,
  Layers,
  ChevronUp,
  Sliders,
  Check,
  HelpCircle,
  X,
} from 'lucide-react';
import { WidgetSettings } from '../types/calendar';

interface SystemTrayProps {
  settings: WidgetSettings;
  onUpdateSettings: (newSettings: Partial<WidgetSettings>) => void;
  onResetTopLeft: () => void;
  onOpenGuide: () => void;
}

export const SystemTray: React.FC<SystemTrayProps> = ({
  settings,
  onUpdateSettings,
  onResetTopLeft,
  onOpenGuide,
}) => {
  const [isTrayMenuOpen, setIsTrayMenuOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [batteryLevel] = useState(98);
  const [bluetoothConnected, setBluetoothConnected] = useState(true);

  const menuRef = useRef<HTMLDivElement>(null);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setDateStr(
        `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now
          .getDate()
          .toString()
          .padStart(2, '0')}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close tray menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsTrayMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with native Electron if available
  const handleToggleAutoStart = () => {
    const nextVal = !settings.autoStart;
    onUpdateSettings({ autoStart: nextVal });
    if ((window as any).electronAPI?.setAutoStart) {
      (window as any).electronAPI.setAutoStart(nextVal);
    }
  };

  const handleToggleAlwaysOnTop = () => {
    const nextVal = !settings.alwaysOnTop;
    onUpdateSettings({ alwaysOnTop: nextVal });
    if ((window as any).electronAPI?.setAlwaysOnTop) {
      (window as any).electronAPI.setAlwaysOnTop(nextVal);
    }
  };

  const handleSetOpacity = (val: number) => {
    onUpdateSettings({ opacity: val });
    if ((window as any).electronAPI?.setOpacity) {
      (window as any).electronAPI.setOpacity(val);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none font-sans" ref={menuRef}>
      {/* System Tray Menu Popover */}
      {isTrayMenuOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-72 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 p-4 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#4e6ef2] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                历
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">小组件系统托盘设置</div>
                <div className="text-[10px] text-slate-400">Windows 桌面小组件常驻管理</div>
              </div>
            </div>
            <button
              onClick={() => setIsTrayMenuOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Lock / Unlock Toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                {settings.isLocked ? (
                  <Lock className="w-4 h-4 text-slate-600" />
                ) : (
                  <Unlock className="w-4 h-4 text-blue-600" />
                )}
                <div>
                  <div className="font-semibold text-slate-900">
                    {settings.isLocked ? '当前已锁定固定' : '当前已解锁拖动'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {settings.isLocked ? '固定在桌面壁纸，防误触' : '可按住顶部自由拖动位置'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onUpdateSettings({ isLocked: !settings.isLocked })}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  settings.isLocked
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {settings.isLocked ? '解锁' : '锁定'}
              </button>
            </div>

            {/* Snap to Top-Left Button */}
            <button
              onClick={() => {
                onResetTopLeft();
                setIsTrayMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 text-slate-800 hover:text-blue-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-blue-600" />
                <div className="text-left">
                  <div className="font-semibold">固定到桌面左上角 (28, 28)</div>
                  <div className="text-[10px] text-slate-400">无感贴合桌面壁纸</div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-blue-600">吸附</span>
            </button>

            {/* Opacity Control */}
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
                onChange={(e) => handleSetOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              {/* Preset buttons */}
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {[1.0, 0.9, 0.8, 0.7].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleSetOpacity(val)}
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

            {/* Auto-Start on Boot (开机自启动) */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <Power className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-semibold text-slate-900">开机自启动</div>
                  <div className="text-[10px] text-slate-500">登录 Windows 自动在壁纸加载</div>
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

            {/* Always on top toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="font-semibold text-slate-900">窗口始终置顶</div>
                  <div className="text-[10px] text-slate-500">常驻在其他软件上方</div>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.alwaysOnTop}
                  onChange={handleToggleAlwaysOnTop}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Footer Guide & Info */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <button
              onClick={() => {
                setIsTrayMenuOpen(false);
                onOpenGuide();
              }}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>使用与部署指引</span>
            </button>
            <span className="text-[10px] text-slate-400">v1.0.0</span>
          </div>
        </div>
      )}

      {/* Windows 11 Style System Tray Notification Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg text-slate-700">
        {/* Bluetooth Icon */}
        <button
          onClick={() => setBluetoothConnected(!bluetoothConnected)}
          className={`p-1 rounded-md transition-colors ${
            bluetoothConnected ? 'text-blue-600 hover:bg-white/80' : 'text-slate-400 hover:bg-white/80'
          }`}
          title={bluetoothConnected ? '蓝牙: 已连接' : '蓝牙: 未连接'}
        >
          <Bluetooth className="w-3.5 h-3.5" />
        </button>

        {/* Battery Icon with Level */}
        <div
          className="flex items-center gap-1 px-1 py-0.5 rounded-md text-xs font-medium text-slate-700 hover:bg-white/80 cursor-default"
          title={`电池电量: ${batteryLevel}% (运行正常)`}
        >
          <Battery className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] font-mono">{batteryLevel}%</span>
        </div>

        {/* Wi-Fi Icon */}
        <div
          className="p-1 rounded-md text-slate-700 hover:bg-white/80 cursor-default"
          title="网络连接: Internet 已连接"
        >
          <Wifi className="w-3.5 h-3.5" />
        </div>

        {/* Volume Icon */}
        <div
          className="p-1 rounded-md text-slate-700 hover:bg-white/80 cursor-default"
          title="扬声器: 100%"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </div>

        <div className="w-px h-3.5 bg-slate-300 mx-0.5" />

        {/* Baidu Calendar System Tray Icon (Click to open settings menu) */}
        <button
          onClick={() => setIsTrayMenuOpen(!isTrayMenuOpen)}
          className={`relative p-1 rounded-lg transition-all flex items-center justify-center ${
            isTrayMenuOpen
              ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400'
              : 'hover:bg-blue-50 text-slate-700'
          }`}
          title="百度日历桌面小组件 (点击打开托盘设置)"
        >
          <div className="w-4 h-4 rounded-[4px] bg-[#4e6ef2] text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
            历
          </div>
          {/* Active status indicator dot */}
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-1 ring-white" />
        </button>

        {/* System Clock & Date */}
        <div
          onClick={() => setIsTrayMenuOpen(!isTrayMenuOpen)}
          className="text-right cursor-pointer hover:bg-white/80 py-0.5 px-1.5 rounded-md transition-colors leading-tight ml-1"
          title="点击打开托盘设置"
        >
          <div className="text-[11px] font-semibold text-slate-800 tabular-nums">
            {timeStr || '12:00'}
          </div>
          <div className="text-[9px] text-slate-400 tabular-nums">
            {dateStr || '2026/10/10'}
          </div>
        </div>
      </div>
    </div>
  );
};
