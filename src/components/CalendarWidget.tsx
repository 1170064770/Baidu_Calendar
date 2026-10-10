import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Pin,
  Lock,
  Unlock,
  Move,
  Settings,
  Sliders,
  Eye,
  Power,
  Layers,
  X,
  HelpCircle,
} from 'lucide-react';
import { AlmanacDay, StatutoryHoliday } from '../types/calendar';
import {
  fetchCalendarData,
  getStatutoryHolidays,
  calculateNextHolidayCountdown,
} from '../utils/calendarUtils';
import { AlmanacDetailModal } from './AlmanacDetailModal';

interface CalendarWidgetProps {
  isLocked: boolean;
  onToggleLock: () => void;
  onResetTopLeft: () => void;
  opacity: number;
  onChangeOpacity?: (val: number) => void;
  autoStart?: boolean;
  onToggleAutoStart?: () => void;
  alwaysOnTop?: boolean;
  onToggleAlwaysOnTop?: () => void;
  blurEffect: boolean;
  onOpenExportGuide?: () => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  isLocked,
  onToggleLock,
  onResetTopLeft,
  opacity,
  onChangeOpacity,
  autoStart = true,
  onToggleAutoStart,
  alwaysOnTop = false,
  onToggleAlwaysOnTop,
  blurEffect,
  onOpenExportGuide,
}) => {
  // Current view year & month (default 2026年 10月 as in the user's screenshot)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10);

  // Selected date
  const [selectedDate, setSelectedDate] = useState<{
    year: number;
    month: number;
    day: number;
  }>({
    year: 2026,
    month: 10,
    day: 10,
  });

  // Calendar data from Baidu API or fallback
  const [almanacList, setAlmanacList] = useState<AlmanacDay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<string>('baidu');

  // UI Dropdowns
  const [isHolidayDropdownOpen, setIsHolidayDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedHolidayLabel, setSelectedHolidayLabel] = useState<string>('假期');

  // Huangli Detail Modal
  const [isHuangliModalOpen, setIsHuangliModalOpen] = useState(false);

  // Statutory holidays for current year
  const statutoryHolidays = useMemo(
    () => getStatutoryHolidays(currentYear),
    [currentYear]
  );

  // Refs for clicking outside dropdowns
  const holidayRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (holidayRef.current && !holidayRef.current.contains(e.target as Node)) {
        setIsHolidayDropdownOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) {
        setIsYearDropdownOpen(false);
      }
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch month data when year or month changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchCalendarData(currentYear, currentMonth).then((res) => {
      if (isMounted) {
        setAlmanacList(res.almanac);
        setDataSource(res.source);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentYear, currentMonth]);

  // Construct the 42-day calendar grid (6 rows × 7 columns, Monday to Sunday)
  const calendarGrid = useMemo(() => {
    if (!almanacList || almanacList.length === 0) return [];

    // Find the first day of current month
    const firstDayIndex = almanacList.findIndex(
      (d) =>
        parseInt(d.year, 10) === currentYear &&
        parseInt(d.month, 10) === currentMonth &&
        parseInt(d.day, 10) === 1
    );

    if (firstDayIndex === -1) {
      // Fallback: simple slice or return list
      return almanacList.slice(0, 42);
    }

    // Oct 1st day of week: Monday=1 ... Sunday=7
    const firstDay = almanacList[firstDayIndex];
    const cnDayMap: Record<string, number> = {
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      日: 7,
    };
    const firstDayWeekday = cnDayMap[firstDay.cnDay || '一'] || 1;
    const prevMonthDaysCount = firstDayWeekday - 1; // Number of padding days from Monday

    const startIndex = Math.max(0, firstDayIndex - prevMonthDaysCount);
    const endIndex = startIndex + 42;

    return almanacList.slice(startIndex, endIndex);
  }, [almanacList, currentYear, currentMonth]);

  // Find currently selected day's almanac entry
  const selectedDayAlmanac = useMemo(() => {
    if (!almanacList || almanacList.length === 0) return null;
    return (
      almanacList.find(
        (d) =>
          parseInt(d.year, 10) === selectedDate.year &&
          parseInt(d.month, 10) === selectedDate.month &&
          parseInt(d.day, 10) === selectedDate.day
      ) ||
      calendarGrid.find(
        (d) =>
          parseInt(d.year, 10) === selectedDate.year &&
          parseInt(d.month, 10) === selectedDate.month &&
          parseInt(d.day, 10) === selectedDate.day
      ) ||
      almanacList[0]
    );
  }, [almanacList, calendarGrid, selectedDate]);

  // Holiday countdown calculation
  const countdown = useMemo(() => {
    return calculateNextHolidayCountdown(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day
    );
  }, [selectedDate]);

  // Handle month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Jump to today
  const handleGoToday = () => {
    // We can jump to live today (or 2026-10-10 demo anchor if user wants)
    const now = new Date();
    // Defaulting to current live date or screenshot 2026-10-10
    const targetY = now.getFullYear();
    const targetM = now.getMonth() + 1;
    const targetD = now.getDate();

    setCurrentYear(targetY);
    setCurrentMonth(targetM);
    setSelectedDate({ year: targetY, month: targetM, day: targetD });
    setSelectedHolidayLabel('假期');
  };

  // Select a statutory holiday from dropdown
  const handleSelectHoliday = (holiday: StatutoryHoliday) => {
    setCurrentYear(holiday.year);
    setCurrentMonth(holiday.month);
    setSelectedDate({
      year: holiday.year,
      month: holiday.month,
      day: holiday.day,
    });
    setSelectedHolidayLabel(holiday.name);
    setIsHolidayDropdownOpen(false);
  };

  // Year options for dropdown (1970 to 2050)
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = 1970; y <= 2050; y++) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <>
      <div
        className={`relative w-[460px] max-w-[95vw] rounded-[24px] transition-all select-none duration-150 ${
          blurEffect ? 'backdrop-blur-xl' : ''
        } ${
          isLocked
            ? 'shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-slate-200/80'
            : 'shadow-[0_20px_50px_rgba(0,0,0,0.22)] ring-2 ring-blue-500/50 border border-blue-400/60'
        }`}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
        }}
      >
        {/* Windows Widget Title Bar / Drag Grip */}
        <div
          className={`relative flex items-center justify-between px-4 py-2 border-b transition-colors rounded-t-[24px] ${
            isLocked
              ? 'bg-slate-50/60 border-slate-100 text-slate-500 cursor-default'
              : 'bg-blue-50/90 border-blue-200 text-blue-900 cursor-move'
          }`}
          data-drag-handle="true"
          style={{
            WebkitAppRegion: isLocked ? 'no-drag' : 'drag',
          } as any}
        >
          <div className="flex items-center gap-2 text-xs font-medium pointer-events-none">
            {isLocked ? (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>已固定桌面 (点击解锁可拖动)</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-blue-700">
                <Move className="w-3.5 h-3.5" />
                <span className="font-semibold">按住此栏可自由拖动位置</span>
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-1.5"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            <button
              onClick={onResetTopLeft}
              title="一键吸附至桌面左上角 (28, 28)"
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white/80 rounded-md transition-colors text-xs flex items-center gap-1"
            >
              <Pin className="w-3 h-3" />
              <span className="text-[11px] hidden sm:inline">左上角</span>
            </button>

            <button
              onClick={onToggleLock}
              title={isLocked ? '点击解锁拖动' : '点击锁定固定'}
              className={`px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1 transition-colors ${
                isLocked
                  ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
              }`}
            >
              {isLocked ? (
                <>
                  <Unlock className="w-3 h-3" />
                  <span>解锁拖动</span>
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" />
                  <span>锁定固定</span>
                </>
              )}
            </button>

            {/* Settings Gear Button */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                title="小组件设置 (透明度、自启、置顶)"
                className={`p-1 rounded-md text-xs transition-colors flex items-center justify-center ${
                  isSettingsOpen
                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/80'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {/* Settings Dropdown Popover */}
              {isSettingsOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 p-4 text-slate-800 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900">小组件属性设置</div>
                    <button
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Opacity Control */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-slate-700 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>背景透明度</span>
                        </div>
                        <span className="text-blue-600 font-bold">{Math.round(opacity * 100)}%</span>
                      </div>

                      <input
                        type="range"
                        min="0.5"
                        max="1.0"
                        step="0.05"
                        value={opacity}
                        onChange={(e) => onChangeOpacity?.(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />

                      <div className="grid grid-cols-4 gap-1 text-[10px]">
                        {[1.0, 0.9, 0.8, 0.7].map((val) => (
                          <button
                            key={val}
                            onClick={() => onChangeOpacity?.(val)}
                            className={`py-1 rounded-md font-medium transition-colors ${
                              Math.abs(opacity - val) < 0.03
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {Math.round(val * 100)}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto-Start on Boot */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Power className="w-4 h-4 text-emerald-600" />
                        <div>
                          <div className="font-semibold text-slate-900">开机自启动</div>
                          <div className="text-[10px] text-slate-500">登录 Windows 自动在桌面启动</div>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoStart}
                          onChange={() => onToggleAutoStart?.()}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Always on top */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="font-semibold text-slate-900">窗口始终置顶</div>
                          <div className="text-[10px] text-slate-500">常驻在其他软件窗口之上</div>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={alwaysOnTop}
                          onChange={() => onToggleAlwaysOnTop?.()}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Tray Info note */}
                    <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900">
                      💡 <strong>系统托盘说明</strong>：小组件已在 Windows 任务栏系统托盘常驻，右键任务栏托盘图标亦可进行锁定、自启与退出。
                    </div>

                    {/* Guide link */}
                    {onOpenExportGuide && (
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          onOpenExportGuide();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700 transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Windows 使用与打包指引</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Calendar Body */}
        <div className="p-5">
          {/* Top Controls: 假期下拉、年份、月份切换、今天按钮 */}
          <div className="flex items-center justify-between gap-2 mb-4">
            {/* 假期 Dropdown */}
            <div className="relative" ref={holidayRef}>
              <button
                onClick={() => setIsHolidayDropdownOpen(!isHolidayDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 hover:bg-slate-50/80 transition-colors shadow-2xs"
              >
                <span>{selectedHolidayLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isHolidayDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setSelectedHolidayLabel('假期');
                      setIsHolidayDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    全部假期
                  </button>
                  <div className="h-px bg-slate-100 my-1" />
                  {statutoryHolidays.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => handleSelectHoliday(h)}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50/70 transition-colors ${
                        selectedHolidayLabel === h.name
                          ? 'text-blue-600 font-semibold bg-blue-50/40'
                          : 'text-slate-700'
                      }`}
                    >
                      <span>{h.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {h.month}/{h.day}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Year & Month Selectors */}
            <div className="flex items-center gap-1.5">
              {/* Year Dropdown */}
              <div className="relative" ref={yearRef}>
                <button
                  onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 hover:bg-slate-50/80 transition-colors shadow-2xs"
                >
                  <span>{currentYear}年</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isYearDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-28 max-h-56 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                    {yearOptions.map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          setCurrentYear(y);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50/70 transition-colors ${
                          currentYear === y
                            ? 'text-blue-600 font-semibold bg-blue-50/40'
                            : 'text-slate-700'
                        }`}
                      >
                        {y}年
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Month Navigator: < 10月 > */}
              <div className="flex items-center bg-white border border-slate-200/90 rounded-xl shadow-2xs">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-xl transition-colors"
                  title="上一月"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative" ref={monthRef}>
                  <button
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                    className="flex items-center gap-0.5 px-2 py-1 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <span>{currentMonth}月</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isMonthDropdownOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-24 max-h-56 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-40 animate-in fade-in zoom-in-95 duration-150">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            setCurrentMonth(m);
                            setIsMonthDropdownOpen(false);
                          }}
                          className={`w-full text-center px-3 py-1.5 text-xs hover:bg-blue-50/70 transition-colors ${
                            currentMonth === m
                              ? 'text-blue-600 font-semibold bg-blue-50/40'
                              : 'text-slate-700'
                          }`}
                        >
                          {m}月
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNextMonth}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-r-xl transition-colors"
                  title="下一月"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 今天 Button */}
            <button
              onClick={handleGoToday}
              className="px-3.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              今天
            </button>
          </div>

          {/* Weekday Row Header: 一, 二, 三, 四, 五, 六, 日 */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-medium">
            <div className="text-slate-600 py-1">一</div>
            <div className="text-slate-600 py-1">二</div>
            <div className="text-slate-600 py-1">三</div>
            <div className="text-slate-600 py-1">四</div>
            <div className="text-slate-600 py-1">五</div>
            <div className="text-red-500 py-1">六</div>
            <div className="text-red-500 py-1">日</div>
          </div>

          {/* Calendar 42-cell Grid */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-1">
            {isLoading ? (
              <div className="col-span-7 h-64 flex items-center justify-center text-slate-400 text-xs">
                正在同步百度开放数据平台日历...
              </div>
            ) : (
              calendarGrid.map((item, index) => {
                const dayNum = parseInt(item.day, 10);
                const dayMonth = parseInt(item.month, 10);
                const dayYear = parseInt(item.year, 10);

                const isCurrentMonth = dayMonth === currentMonth;
                const isSelected =
                  dayYear === selectedDate.year &&
                  dayMonth === selectedDate.month &&
                  dayNum === selectedDate.day;

                // Day of week check: column 5 is Saturday, column 6 is Sunday
                const colIdx = index % 7;
                const isWeekend = colIdx === 5 || colIdx === 6;

                // Holiday / Rest badge (status === "1" is 休, "2" is 班)
                const isRest = item.status === '1';
                const isWorkShift = item.status === '2';

                // Subtext label: festival / solar term / lunar day
                let subtext = item.term || item.lDate;
                if (!subtext || subtext === 'undefined') {
                  subtext = item.lDate;
                }

                // If term is festival or solar term:
                const isTermOrFestival = Boolean(item.term);

                // Determine text coloring matching Baidu's exact palette
                let dayNumberColor = 'text-slate-800';
                let subtextColor = 'text-slate-500';

                if (!isCurrentMonth) {
                  // Muted out-of-month
                  dayNumberColor = 'text-slate-300';
                  subtextColor = isTermOrFestival ? 'text-red-300' : 'text-slate-300';
                } else if (isSelected) {
                  // Selected: blue text
                  dayNumberColor = 'text-[#4e6ef2] font-semibold';
                  subtextColor = 'text-[#4e6ef2] font-medium';
                } else if (isRest) {
                  // Vacation rest day: red text
                  dayNumberColor = 'text-red-500 font-semibold';
                  subtextColor = 'text-red-500';
                } else if (isWorkShift) {
                  // Work shift on weekend: slate text
                  dayNumberColor = 'text-slate-800';
                  subtextColor = 'text-slate-600';
                } else if (isWeekend) {
                  // Regular weekend: red day number
                  dayNumberColor = 'text-red-500';
                  subtextColor = isTermOrFestival ? 'text-red-500' : 'text-slate-600';
                } else if (isTermOrFestival) {
                  // Weekday with term/festival (e.g. 寒露, 霜降)
                  dayNumberColor = 'text-slate-800';
                  subtextColor = 'text-slate-800 font-medium';
                }

                return (
                  <div
                    key={`${item.year}-${item.month}-${item.day}-${index}`}
                    onClick={() => {
                      setSelectedDate({
                        year: dayYear,
                        month: dayMonth,
                        day: dayNum,
                      });
                      if (dayMonth !== currentMonth) {
                        setCurrentYear(dayYear);
                        setCurrentMonth(dayMonth);
                      }
                    }}
                    className={`relative flex flex-col items-center justify-center h-[52px] rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'border-2 border-[#4e6ef2] bg-blue-50/60 shadow-2xs z-10'
                        : 'hover:bg-slate-100/70 border border-transparent'
                    }`}
                  >
                    {/* Rest (休) or Work (班) Badge */}
                    {isRest && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-[3px] flex items-center justify-center leading-none shadow-2xs">
                        休
                      </span>
                    )}
                    {isWorkShift && (
                      <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#4e6ef2] text-white text-[9px] font-bold rounded-[3px] flex items-center justify-center leading-none shadow-2xs">
                        班
                      </span>
                    )}

                    {/* Solar Day Number */}
                    <span className={`text-[19px] leading-tight font-normal ${dayNumberColor}`}>
                      {item.day}
                    </span>

                    {/* Lunar / Festival / Solar Term text */}
                    <span
                      className={`text-[11px] leading-tight mt-0.5 truncate max-w-[50px] ${subtextColor}`}
                      title={subtext}
                    >
                      {subtext}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Card: Selected Day Huangli, Yi/Ji, Countdown */}
          {selectedDayAlmanac && (
            <div className="mt-4 bg-[#f7f9fa] border border-[#eaedf1] rounded-2xl p-3.5 text-slate-800 transition-colors">
              <div
                className="flex items-start justify-between gap-3 cursor-pointer group"
                onClick={() => setIsHuangliModalOpen(true)}
              >
                {/* Left: Lunar Date Title & GanZhi Year Animal */}
                <div className="shrink-0 flex flex-col justify-center min-w-[85px]">
                  <div className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                    {selectedDayAlmanac.lMonth}月{selectedDayAlmanac.lDate}
                  </div>
                  <div className="text-xs text-slate-700 font-medium mt-0.5">
                    {selectedDayAlmanac.gzYear}年
                    {selectedDayAlmanac.animal}
                  </div>
                </div>

                {/* Right: Yi & Ji Rows */}
                <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                  {/* 宜 */}
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-4 h-4 bg-red-500 text-white rounded-[3px] flex items-center justify-center text-[10px] font-black">
                      宜
                    </span>
                    <span className="text-slate-700 truncate" title={selectedDayAlmanac.suit || '诸事不宜'}>
                      {selectedDayAlmanac.suit || '诸事不宜'}
                    </span>
                  </div>

                  {/* 忌 */}
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 w-4 h-4 bg-slate-800 text-white rounded-[3px] flex items-center justify-center text-[10px] font-black">
                      忌
                    </span>
                    <span className="text-slate-700 truncate" title={selectedDayAlmanac.avoid || '诸事皆宜'}>
                      {selectedDayAlmanac.avoid || '诸事皆宜'}
                    </span>
                  </div>
                </div>

                {/* Right Chevron Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsHuangliModalOpen(true);
                  }}
                  className="p-1 text-slate-400 group-hover:text-blue-600 transition-colors rounded-lg group-hover:bg-blue-50"
                  title="查看完整老黄历详解"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Countdown Strip */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    距离 <span className="font-medium text-slate-700">{countdown.holidayName}</span> 还有{' '}
                    <span className="font-bold text-slate-900">{countdown.days}</span> 天
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {dataSource === 'baidu' ? '百度OpenData' : '离线算法'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Huangli Details Modal */}
      <AlmanacDetailModal
        isOpen={isHuangliModalOpen}
        onClose={() => setIsHuangliModalOpen(false)}
        year={selectedDate.year}
        month={selectedDate.month}
        day={selectedDate.day}
      />
    </>
  );
};
