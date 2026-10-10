export interface AlmanacDay {
  year: string;
  month: string;
  day: string;
  lDate: string; // e.g. "初一", "廿一", "十五"
  lMonth: string; // e.g. "九", "八"
  lunarYear?: string;
  lunarMonth?: string;
  lunarDate?: string;
  animal?: string; // e.g. "马", "牛"
  gzYear?: string; // e.g. "丙午"
  gzMonth?: string; // e.g. "戊戌"
  gzDate?: string; // e.g. "丁巳"
  term?: string; // e.g. "国庆节", "寒露", "重阳节", "霜降"
  status?: string; // "1" for 休 (holiday rest), "2" for 班 (work shift), undefined/null for normal
  suit?: string; // e.g. "结婚.会亲友.合婚订婚.纳财..."
  avoid?: string; // e.g. "出行.理发.安葬.安门..."
  cnDay?: string; // "一", "二", "三", "四", "五", "六", "日"
  festivalList?: string;
  festivalInfoList?: Array<{ name: string; baikeUrl?: string; baikeName?: string }>;
  value?: string;
  type?: string;
  oDate?: string;
}

export interface StatutoryHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  month: number;
  day: number;
  year: number;
  duration?: string;
  description?: string;
}

export interface WidgetSettings {
  isLocked: boolean;
  position: { x: number; y: number };
  opacity: number; // 0.5 to 1.0
  blurEffect: boolean;
  autoStart: boolean; // 开机自启动
  alwaysOnTop: boolean; // 窗口置顶
}
