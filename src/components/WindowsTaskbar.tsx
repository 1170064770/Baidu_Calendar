import React, { useState, useEffect } from 'react';
import {
  Search,
  Wifi,
  Volume2,
  Battery,
  ChevronUp,
} from 'lucide-react';

interface WindowsTaskbarProps {
  onOpenCalendar?: () => void;
  onOpenSettings?: () => void;
}

export const WindowsTaskbar: React.FC<WindowsTaskbarProps> = ({
  onOpenCalendar,
  onOpenSettings,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isStartMenuOpen, setIsStartMenuOpen] = useState<boolean>(false);

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

  return (
    <>
      {/* Windows 11 Start Menu Popup */}
      {isStartMenuOpen && (
        <div
          className="fixed bottom-14 left-1/2 -translate-x-1/2 w-96 bg-white/95 backdrop-blur-2xl border border-slate-200/90 rounded-2xl shadow-2xl p-5 z-50 text-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl mb-4 text-xs text-slate-500">
            <Search className="w-3.5 h-3.5" />
            <span>搜索应用、设置和文档...</span>
          </div>

          <div className="text-xs font-semibold text-slate-400 mb-2">已固定</div>
          <div className="grid grid-cols-4 gap-3 text-center text-xs mb-4">
            <div
              className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors flex flex-col items-center gap-1.5"
              onClick={() => {
                setIsStartMenuOpen(false);
                onOpenCalendar?.();
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                历
              </div>
              <span className="text-[11px] text-slate-700">百度日历</span>
            </div>

            <div className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                E
              </div>
              <span className="text-[11px] text-slate-700">Edge 浏览器</span>
            </div>

            <div className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                📁
              </div>
              <span className="text-[11px] text-slate-700">文件资源管理器</span>
            </div>

            <div
              className="p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors flex flex-col items-center gap-1.5"
              onClick={() => {
                setIsStartMenuOpen(false);
                onOpenSettings?.();
              }}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                ⚙️
              </div>
              <span className="text-[11px] text-slate-700">桌面设置</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                U
              </div>
              <span className="font-medium text-slate-700">Windows 用户</span>
            </div>
            <span className="text-[10px] text-slate-400">Windows 11 Pro</span>
          </div>
        </div>
      )}

      {/* Taskbar Bar */}
      <footer className="h-12 w-full bg-white/75 backdrop-blur-xl border-t border-white/40 flex items-center justify-between px-3 z-40 select-none shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        {/* Left spacer / Weather */}
        <div className="w-32 flex items-center gap-2 text-xs text-slate-700 pl-1 cursor-pointer hover:bg-white/40 py-1 px-2 rounded-lg transition-colors">
          <span className="text-sm">🌤️</span>
          <div className="leading-tight hidden sm:block">
            <div className="font-medium text-[11px]">22°C 晴朗</div>
            <div className="text-[10px] text-slate-400">空气质量 优</div>
          </div>
        </div>

        {/* Center: Windows 11 App Icons */}
        <div className="flex items-center gap-1.5">
          {/* Start Icon (Windows 4-squares) */}
          <button
            onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              isStartMenuOpen ? 'bg-blue-100/80 text-blue-600' : 'hover:bg-white/60 text-blue-600'
            }`}
            title="开始菜单"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 2.222L6.444 1.333V7.556H0V2.222ZM0 8.444H6.444V14.667L0 13.778V8.444ZM7.556 1.185L16 0V7.556H7.556V1.185ZM7.556 8.444H16V16L7.556 14.815V8.444Z" />
            </svg>
          </button>

          {/* Search Icon */}
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/60 text-slate-700 transition-colors"
            title="搜索"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Calendar App Active Icon */}
          <button
            onClick={onOpenCalendar}
            className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50 hover:bg-blue-100/70 text-blue-700 transition-colors relative group"
            title="百度日历桌面小组件 (运行中)"
          >
            <div className="w-5 h-5 rounded-[5px] bg-[#4e6ef2] flex items-center justify-center text-white text-[10px] font-bold shadow-2xs">
              历
            </div>
            {/* Active app bottom indicator line */}
            <span className="absolute bottom-1 w-3 h-0.5 bg-[#4e6ef2] rounded-full" />
          </button>

          {/* Edge Icon */}
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/60 text-sky-600 transition-colors"
            title="Microsoft Edge"
          >
            <div className="w-5 h-5 rounded-[5px] bg-gradient-to-tr from-blue-600 to-teal-400 flex items-center justify-center text-white text-[10px] font-black">
              e
            </div>
          </button>

          {/* File Explorer */}
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/60 text-amber-500 transition-colors"
            title="文件资源管理器"
          >
            <span className="text-base">📁</span>
          </button>
        </div>

        {/* Right: System Tray & Clock */}
        <div className="flex items-center gap-2 pr-1">
          <button className="p-1 hover:bg-white/60 rounded text-slate-500 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1.5 px-1 text-slate-600">
            <Wifi className="w-3.5 h-3.5" />
            <Volume2 className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5" />
          </div>

          {/* Clock */}
          <div
            onClick={onOpenCalendar}
            className="text-right cursor-pointer hover:bg-white/60 py-0.5 px-2 rounded-lg transition-colors leading-tight"
            title="点击激活百度日历"
          >
            <div className="text-[11px] font-medium text-slate-800 tabular-nums">
              {timeStr || '12:00'}
            </div>
            <div className="text-[10px] text-slate-500 tabular-nums">
              {dateStr || '2026/10/10'}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
