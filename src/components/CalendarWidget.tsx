import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
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
  opacity: number;
  blurEffect: boolean;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  isLocked,
  opacity,
  blurEffect,
}) => {
  const today = useMemo(() => new Date(), []);
  const thisYear = today.getFullYear();
  const thisMonth = today.getMonth() + 1;
  const thisDay = today.getDate();

  // Current view year & month (default to today)
  const [currentYear, setCurrentYear] = useState<number>(thisYear);
  const [currentMonth, setCurrentMonth] = useState<number>(thisMonth);

  // Selected date
  const [selectedDate, setSelectedDate] = useState<{
    year: number;
    month: number;
    day: number;
  }>({
    year: thisYear,
    month: thisMonth,
    day: thisDay,
  });

  // Calendar data from Baidu API or fallback
  const [almanacList, setAlmanacList] = useState<AlmanacDay[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<string>('baidu');

  // UI Dropdowns
  const [isHolidayDropdownOpen, setIsHolidayDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [selectedHolidayLabel, setSelectedHolidayLabel] = useState<string>('假期');

  // Huangli Detail Modal
  const [isHuangliModalOpen, setIsHuangliModalOpen] = useState(false);

  // Statutory holidays for current view year
  const statutoryHolidays = useMemo(
    () => getStatutoryHolidays(currentYear),
    [currentYear]
  );

  // Refs for outside click detection and auto-scrolling
  const holidayRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);

  const yearListRef = useRef<HTMLDivElement>(null);
  const currentYearItemRef = useRef<HTMLButtonElement>(null);

  const monthListRef = useRef<HTMLDivElement>(null);
  const currentMonthItemRef = useRef<HTMLButtonElement>(null);

  // Year options for dropdown (1970 to 2050)
  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = 1970; y <= 2050; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isHolidayDropdownOpen && holidayRef.current && !holidayRef.current.contains(target)) {
        setIsHolidayDropdownOpen(false);
      }
      if (isYearDropdownOpen && yearRef.current && !yearRef.current.contains(target)) {
        setIsYearDropdownOpen(false);
      }
      if (isMonthDropdownOpen && monthRef.current && !monthRef.current.contains(target)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isHolidayDropdownOpen, isYearDropdownOpen, isMonthDropdownOpen]);

  // Auto-scroll Year dropdown to position at currentYear / thisYear when opened
  useEffect(() => {
    if (isYearDropdownOpen) {
      const timer = setTimeout(() => {
        if (currentYearItemRef.current) {
          currentYearItemRef.current.scrollIntoView({
            block: 'center',
            behavior: 'instant' as ScrollBehavior,
          });
        } else if (yearListRef.current) {
          const targetYear = currentYear || thisYear;
          const idx = yearOptions.indexOf(targetYear);
          if (idx !== -1) {
            yearListRef.current.scrollTop = Math.max(0, idx * 32 - 96);
          }
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isYearDropdownOpen, currentYear, thisYear, yearOptions]);

  // Auto-scroll Month dropdown to position at currentMonth when opened
  useEffect(() => {
    if (isMonthDropdownOpen) {
      const timer = setTimeout(() => {
        if (currentMonthItemRef.current) {
          currentMonthItemRef.current.scrollIntoView({
            block: 'center',
            behavior: 'instant' as ScrollBehavior,
          });
        } else if (monthListRef.current) {
          const idx = currentMonth - 1;
          if (idx >= 0) {
            monthListRef.current.scrollTop = Math.max(0, idx * 32 - 96);
          }
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isMonthDropdownOpen, currentMonth]);

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

  // Handle month navigation (prev/next month)
  const handlePrevMonth = () => {
    let newY = currentYear;
    let newM = currentMonth - 1;
    if (currentMonth === 1) {
      newY = currentYear - 1;
      newM = 12;
      setCurrentYear(newY);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(newM);
    }
    const daysInNewMonth = new Date(newY, newM, 0).getDate();
    setSelectedDate((prev) => ({
      year: newY,
      month: newM,
      day: Math.min(prev.day, daysInNewMonth),
    }));
    setSelectedHolidayLabel('假期');
  };

  const handleNextMonth = () => {
    let newY = currentYear;
    let newM = currentMonth + 1;
    if (currentMonth === 12) {
      newY = currentYear + 1;
      newM = 1;
      setCurrentYear(newY);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(newM);
    }
    const daysInNewMonth = new Date(newY, newM, 0).getDate();
    setSelectedDate((prev) => ({
      year: newY,
      month: newM,
      day: Math.min(prev.day, daysInNewMonth),
    }));
    setSelectedHolidayLabel('假期');
  };

  // Jump to today
  const handleGoToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();

    setCurrentYear(y);
    setCurrentMonth(m);
    setSelectedDate({ year: y, month: m, day: d });
    setSelectedHolidayLabel('假期');
    setIsHolidayDropdownOpen(false);
    setIsYearDropdownOpen(false);
    setIsMonthDropdownOpen(false);
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

  // Select a year from Year dropdown
  const handleSelectYear = (y: number) => {
    setCurrentYear(y);
    const daysInNewMonth = new Date(y, currentMonth, 0).getDate();
    setSelectedDate((prev) => ({
      year: y,
      month: currentMonth,
      day: Math.min(prev.day, daysInNewMonth),
    }));
    setSelectedHolidayLabel('假期');
    setIsYearDropdownOpen(false);
  };

  // Select a month from Month dropdown
  const handleSelectMonth = (m: number) => {
    setCurrentMonth(m);
    const daysInNewMonth = new Date(currentYear, m, 0).getDate();
    setSelectedDate((prev) => ({
      year: currentYear,
      month: m,
      day: Math.min(prev.day, daysInNewMonth),
    }));
    setSelectedHolidayLabel('假期');
    setIsMonthDropdownOpen(false);
  };

  return (
    <>
      <div
        data-widget-container="true"
        className={`relative w-[460px] max-w-[95vw] rounded-[24px] transition-all select-none duration-200 ${
          isLocked
            ? 'pointer-events-none shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-slate-200/40 cursor-default'
            : 'pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.18)] ring-2 ring-blue-500/60 border border-blue-400/80 cursor-move'
        }`}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
          WebkitAppRegion: isLocked ? 'no-drag' : 'drag',
        } as any}
      >
        {/* Main Calendar Body */}
        <div className="p-5">
          {/* Top Controls: 假期下拉、年份、月份切换、今天按钮 */}
          <div
            data-no-drag="true"
            className="flex items-center justify-between gap-2 mb-4"
            style={{ WebkitAppRegion: 'no-drag' } as any}
          >
            {/* 假期 Dropdown */}
            <div className="relative" ref={holidayRef}>
              <button
                type="button"
                onClick={() => {
                  setIsHolidayDropdownOpen((prev) => !prev);
                  setIsYearDropdownOpen(false);
                  setIsMonthDropdownOpen(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 hover:bg-slate-50/80 transition-colors shadow-2xs"
              >
                <span>{selectedHolidayLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isHolidayDropdownOpen && (
                <div
                  data-no-drag="true"
                  style={{ WebkitAppRegion: 'no-drag' } as any}
                  onMouseDown={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                  className="dropdown-scroll absolute left-0 top-full mt-1.5 w-40 max-h-64 overflow-y-auto overscroll-contain bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 select-auto animate-in fade-in zoom-in-95 duration-150"
                >
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedHolidayLabel('假期');
                      setIsHolidayDropdownOpen(false);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
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
                      type="button"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleSelectHoliday(h);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectHoliday(h);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50/70 transition-colors ${
                        selectedHolidayLabel === h.name
                          ? 'text-blue-600 font-semibold bg-blue-50/40'
                          : 'text-slate-700'
                      }`}
                    >
                      <span className="font-medium">{h.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {h.month}月{h.day}日
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
                  type="button"
                  onClick={() => {
                    setIsYearDropdownOpen((prev) => !prev);
                    setIsHolidayDropdownOpen(false);
                    setIsMonthDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 hover:bg-slate-50/80 transition-colors shadow-2xs"
                >
                  <span>{currentYear}年</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isYearDropdownOpen && (
                  <div
                    ref={yearListRef}
                    data-no-drag="true"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
                    onMouseDown={(e) => e.stopPropagation()}
                    onWheel={(e) => e.stopPropagation()}
                    className="dropdown-scroll absolute left-0 top-full mt-1.5 w-32 max-h-56 overflow-y-auto overscroll-contain bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 select-auto animate-in fade-in zoom-in-95 duration-150"
                  >
                    {yearOptions.map((y) => (
                      <button
                        key={y}
                        type="button"
                        ref={y === currentYear ? currentYearItemRef : undefined}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleSelectYear(y);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectYear(y);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50/80 transition-colors ${
                          currentYear === y
                            ? 'text-blue-600 font-bold bg-blue-50/60'
                            : 'text-slate-700'
                        }`}
                      >
                        <span>{y}年</span>
                        {y === thisYear && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-blue-100 text-blue-700 font-medium">
                            今年
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Month Navigator: < 10月 > */}
              <div className="flex items-center bg-white border border-slate-200/90 rounded-xl shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-l-xl transition-colors"
                  title="上一月"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative" ref={monthRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMonthDropdownOpen((prev) => !prev);
                      setIsHolidayDropdownOpen(false);
                      setIsYearDropdownOpen(false);
                    }}
                    className="flex items-center gap-0.5 px-2 py-1 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <span>{currentMonth}月</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isMonthDropdownOpen && (
                    <div
                      ref={monthListRef}
                      data-no-drag="true"
                      style={{ WebkitAppRegion: 'no-drag' } as any}
                      onMouseDown={(e) => e.stopPropagation()}
                      onWheel={(e) => e.stopPropagation()}
                      className="dropdown-scroll absolute left-1/2 -translate-x-1/2 top-full mt-1.5 w-28 max-h-56 overflow-y-auto overscroll-contain bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 select-auto animate-in fade-in zoom-in-95 duration-150"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <button
                          key={m}
                          type="button"
                          ref={m === currentMonth ? currentMonthItemRef : undefined}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            handleSelectMonth(m);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectMonth(m);
                          }}
                          className={`w-full text-center px-3 py-1.5 text-xs flex items-center justify-between hover:bg-blue-50/80 transition-colors ${
                            currentMonth === m
                              ? 'text-blue-600 font-bold bg-blue-50/60'
                              : 'text-slate-700'
                          }`}
                        >
                          <span>{m}月</span>
                          {currentYear === thisYear && m === thisMonth && (
                            <span className="text-[10px] px-1 py-0.2 rounded-sm bg-blue-100 text-blue-700 font-medium">
                              本月
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
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
              type="button"
              onClick={handleGoToday}
              className="px-3.5 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              今天
            </button>
          </div>

          {/* Weekday Row Header: 一, 二, 三, 四, 五, 六, 日 */}
          <div
            data-no-drag="true"
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="grid grid-cols-7 mb-2 text-center text-xs font-medium"
          >
            <div className="text-slate-600 py-1">一</div>
            <div className="text-slate-600 py-1">二</div>
            <div className="text-slate-600 py-1">三</div>
            <div className="text-slate-600 py-1">四</div>
            <div className="text-slate-600 py-1">五</div>
            <div className="text-red-500 py-1">六</div>
            <div className="text-red-500 py-1">日</div>
          </div>

          {/* Calendar 42-cell Grid */}
          <div
            data-no-drag="true"
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="grid grid-cols-7 gap-y-1 gap-x-1"
          >
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
                    data-no-drag="true"
                    style={{ WebkitAppRegion: 'no-drag' } as any}
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
            <div
              data-no-drag="true"
              style={{ WebkitAppRegion: 'no-drag' } as any}
              className="mt-4 bg-[#f7f9fa] border border-[#eaedf1] rounded-2xl p-3.5 text-slate-800 transition-colors"
            >
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
                    {selectedDayAlmanac.animal}年
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
                  type="button"
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
