import React, { useEffect } from 'react';
import { X, Calendar, Compass, ShieldAlert, Sparkles, Clock, ArrowLeft } from 'lucide-react';
import { getDetailedHuangli } from '../utils/calendarUtils';

interface AlmanacDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  month: number;
  day: number;
}

export const AlmanacDetailModal: React.FC<AlmanacDetailModalProps> = ({
  isOpen,
  onClose,
  year,
  month,
  day,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const huangli = getDetailedHuangli(year, month, day);

  return (
    <div
      data-no-drag="true"
      style={{ WebkitAppRegion: 'no-drag' } as any}
      className="absolute inset-0 z-50 rounded-[24px] bg-white text-slate-800 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/90 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-red-50 text-red-600 rounded-lg shadow-2xs">
            <Calendar className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">老黄历详解</h3>
            <p className="text-[11px] text-slate-500">{huangli.solarDate}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
          title="关闭 (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Lunar & Ganzhi Header Banner */}
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 flex flex-col gap-1">
            <div className="text-lg font-bold text-amber-950">{huangli.lunarDate}</div>
            <div className="text-xs text-amber-800 font-medium">{huangli.ganzhi}</div>
            <div className="text-xs text-amber-700 mt-1">
              五行纳音：<span className="font-semibold">{huangli.nayin}</span>
            </div>
          </div>

          {/* Yi & Ji Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-red-50/60 border border-red-100 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2 font-bold text-red-700 text-sm">
                <span className="w-5 h-5 rounded bg-red-600 text-white flex items-center justify-center text-xs font-black">
                  宜
                </span>
                吉神宜趋
              </div>
              <div className="flex flex-wrap gap-1.5">
                {huangli.suit.length > 0 ? (
                  huangli.suit.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs text-red-800 bg-red-100/70 px-2 py-0.5 rounded-md"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">诸事不宜</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 mb-2 font-bold text-slate-800 text-sm">
                <span className="w-5 h-5 rounded bg-slate-800 text-white flex items-center justify-center text-xs font-black">
                  忌
                </span>
                凶煞宜忌
              </div>
              <div className="flex flex-wrap gap-1.5">
                {huangli.avoid.length > 0 ? (
                  huangli.avoid.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">诸事皆宜</span>
                )}
              </div>
            </div>
          </div>

          {/* Key Almanac Attributes */}
          <div className="space-y-2 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                冲煞方位
              </span>
              <span className="font-medium text-slate-800">{huangli.chongsha}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                吉神方位
              </span>
              <span className="font-medium text-slate-800">{huangli.xishen}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                胎神占方
              </span>
              <span className="font-medium text-slate-800">{huangli.taishen}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500">彭祖百忌</span>
              <span className="font-medium text-slate-800">{huangli.pengzu}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">星宿与节气</span>
              <span className="font-medium text-slate-800">
                {huangli.xingxiu} · {huangli.jieqi}
              </span>
            </div>
          </div>

          {/* Hourly Luck (时辰吉凶) */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              十二时辰吉凶速览
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {huangli.shichen.map((h, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-slate-900 font-semibold mb-1">
                    <span>
                      {h.zhi}时 ({h.ganzhi})
                    </span>
                    <span className="text-[10px] text-slate-400">{h.time}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 truncate">
                    <span className="text-emerald-600 font-bold">宜:</span> {h.yi || '平'}
                  </div>
                  <div className="text-[11px] text-rose-700 truncate">
                    <span className="text-rose-600 font-bold">忌:</span> {h.ji || '无'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
        <span className="text-[11px] text-slate-400">支持上下滚动查阅吉凶时辰</span>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回日历</span>
        </button>
      </div>
    </div>
  );
};
