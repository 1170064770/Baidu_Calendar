import React, { useState } from 'react';
import {
  Pin,
  Lock,
  Unlock,
  Image as ImageIcon,
  Sliders,
  Monitor,
  HelpCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { WidgetSettings } from '../types/calendar';

export interface WallpaperOption {
  id: string;
  name: string;
  url: string;
  category: 'win11' | 'classic' | 'nature' | 'art';
}

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'win11-flow',
    name: 'Windows 11 浅色绽放',
    category: 'win11',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 'win11-dark',
    name: 'Windows 11 深邃午夜',
    category: 'win11',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 'win-bliss',
    name: '经典 Windows Bliss 草原',
    category: 'classic',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 'nature-lake',
    name: '雪山湖泊自然静谧',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 'cyber-minimal',
    name: '极简晨曦渐变',
    category: 'art',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=2000&q=80',
  },
];

interface DesktopControlsProps {
  settings: WidgetSettings;
  onUpdateSettings: (newSettings: Partial<WidgetSettings>) => void;
  onResetTopLeft: () => void;
  onOpenExportGuide: () => void;
}

export const DesktopControls: React.FC<DesktopControlsProps> = ({
  settings,
  onUpdateSettings,
  onResetTopLeft,
  onOpenExportGuide,
}) => {
  const [isWallpaperMenuOpen, setIsWallpaperMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  return (
    <div className="fixed top-4 right-4 z-40 flex items-center gap-2 select-none">
      {/* Floating Pill Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white/85 backdrop-blur-xl border border-white/60 rounded-2xl shadow-lg text-slate-700">
        {/* Snap to Top-Left */}
        <button
          onClick={onResetTopLeft}
          title="无感固定到桌面壁纸左上角 (28, 28)"
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100/90 text-xs font-medium transition-colors"
        >
          <Pin className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">固定左上角</span>
        </button>

        {/* Lock / Unlock Toggle */}
        <button
          onClick={() => onUpdateSettings({ isLocked: !settings.isLocked })}
          title={settings.isLocked ? '当前已锁定固定 (点击解锁拖动)' : '当前已解锁可拖动 (点击锁定固定)'}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
            settings.isLocked
              ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
          }`}
        >
          {settings.isLocked ? (
            <>
              <Lock className="w-3.5 h-3.5" />
              <span>已锁定</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5" />
              <span>自由拖动中</span>
            </>
          )}
        </button>

        <div className="w-px h-4 bg-slate-200 mx-0.5" />

        {/* Wallpaper Picker Trigger */}
        <div className="relative">
          <button
            onClick={() => {
              setIsWallpaperMenuOpen(!isWallpaperMenuOpen);
              setIsSettingsMenuOpen(false);
            }}
            title="更换桌面壁纸"
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-slate-100/90 text-xs font-medium transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden md:inline">壁纸</span>
          </button>

          {isWallpaperMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="text-xs font-bold text-slate-900 mb-2">精选 Windows 壁纸</div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => {
                      onUpdateSettings({ wallpaperId: wp.id, customWallpaperUrl: undefined });
                      setIsWallpaperMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left text-xs ${
                      settings.wallpaperId === wp.id && !settings.customWallpaperUrl
                        ? 'bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-300'
                        : 'text-slate-700'
                    }`}
                  >
                    <img
                      src={wp.url}
                      alt={wp.name}
                      className="w-10 h-6 object-cover rounded-md border border-slate-200"
                    />
                    <span className="truncate">{wp.name}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 mb-1">自定义壁纸图片链接:</div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 text-[11px] px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        onUpdateSettings({ customWallpaperUrl: customUrlInput.trim() });
                        setIsWallpaperMenuOpen(false);
                      }
                    }}
                    className="px-2 py-1 bg-blue-600 text-white rounded-lg text-[11px] font-medium hover:bg-blue-700 transition-colors"
                  >
                    应用
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transparency / Settings */}
        <div className="relative">
          <button
            onClick={() => {
              setIsSettingsMenuOpen(!isSettingsMenuOpen);
              setIsWallpaperMenuOpen(false);
            }}
            title="小组件视觉效果设置"
            className="p-1.5 rounded-xl hover:bg-slate-100/90 text-xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
          </button>

          {isSettingsMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              <div className="text-xs font-bold text-slate-900">小组件效果调整</div>

              {/* Opacity Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                  <span>卡片不透明度</span>
                  <span className="font-semibold">{Math.round(settings.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={settings.opacity}
                  onChange={(e) =>
                    onUpdateSettings({ opacity: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Blur Toggle */}
              <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer pt-1">
                <span>毛玻璃模糊特效</span>
                <input
                  type="checkbox"
                  checked={settings.blurEffect}
                  onChange={(e) =>
                    onUpdateSettings({ blurEffect: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              {/* View Mode Toggle: Desktop Canvas vs Pure Widget */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] text-slate-500 mb-1.5">视图环境</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <button
                    onClick={() => onUpdateSettings({ viewMode: 'desktop' })}
                    className={`py-1 rounded-lg font-medium transition-colors ${
                      settings.viewMode === 'desktop'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    桌面全景
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ viewMode: 'widget-only' })}
                    className={`py-1 rounded-lg font-medium transition-colors ${
                      settings.viewMode === 'widget-only'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    纯小组件
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Windows Export Guide */}
        <button
          onClick={onOpenExportGuide}
          title="Windows 桌面部署与运行指引"
          className="p-1.5 rounded-xl hover:bg-slate-100/90 text-xs transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </div>
  );
};
