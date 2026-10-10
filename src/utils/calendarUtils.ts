import { Solar, Lunar, HolidayUtil } from 'lunar-typescript';
import { AlmanacDay, StatutoryHoliday } from '../types/calendar';

// List of statutory holidays for any year
export function getStatutoryHolidays(year: number): StatutoryHoliday[] {
  // Chinese statutory holidays:
  // 1. 元旦: Jan 1
  // 2. 春节: Lunar 1st month 1st day (正月初一)
  // 3. 清明: Qingming solar term (usually April 4 or 5)
  // 4. 劳动节: May 1
  // 5. 端午节: Lunar 5th month 5th day (五月初五)
  // 6. 中秋节: Lunar 8th month 15th day (八月十五)
  // 7. 国庆节: Oct 1

  const holidays: StatutoryHoliday[] = [];

  // 元旦
  holidays.push({
    id: 'yuandan',
    name: '元旦',
    date: `${year}-01-01`,
    year,
    month: 1,
    day: 1,
    description: '新的一年，万象更新',
  });

  // 春节 (Lunar 1-1)
  try {
    const chunjieLunar = Lunar.fromYmd(year, 1, 1);
    const chunjieSolar = chunjieLunar.getSolar();
    holidays.push({
      id: 'chunjie',
      name: '春节',
      date: `${chunjieSolar.getYear()}-${String(chunjieSolar.getMonth()).padStart(2, '0')}-${String(
        chunjieSolar.getDay()
      ).padStart(2, '0')}`,
      year: chunjieSolar.getYear(),
      month: chunjieSolar.getMonth(),
      day: chunjieSolar.getDay(),
      description: '岁之首，年之交，阖家团圆',
    });
  } catch (e) {
    // fallback
  }

  // 清明节 (Solar term)
  try {
    // Qingming is in April around day 4 or 5
    let qmDay = 4;
    for (let d = 4; d <= 6; d++) {
      const s = Solar.fromYmd(year, 4, d);
      if (s.getLunar().getJieQi() === '清明') {
        qmDay = d;
        break;
      }
    }
    holidays.push({
      id: 'qingming',
      name: '清明节',
      date: `${year}-04-${String(qmDay).padStart(2, '0')}`,
      year,
      month: 4,
      day: qmDay,
      description: '慎终追远，缅怀先人',
    });
  } catch (e) {
    // fallback
  }

  // 劳动节
  holidays.push({
    id: 'laodong',
    name: '劳动节',
    date: `${year}-05-01`,
    year,
    month: 5,
    day: 1,
    description: '致敬所有平凡而伟大的劳动者',
  });

  // 端午节 (Lunar 5-5)
  try {
    const duanwuLunar = Lunar.fromYmd(year, 5, 5);
    const duanwuSolar = duanwuLunar.getSolar();
    holidays.push({
      id: 'duanwu',
      name: '端午节',
      date: `${duanwuSolar.getYear()}-${String(duanwuSolar.getMonth()).padStart(2, '0')}-${String(
        duanwuSolar.getDay()
      ).padStart(2, '0')}`,
      year: duanwuSolar.getYear(),
      month: duanwuSolar.getMonth(),
      day: duanwuSolar.getDay(),
      description: '粽叶飘香，怀古思贤',
    });
  } catch (e) {
    // fallback
  }

  // 中秋节 (Lunar 8-15)
  try {
    const zhongqiuLunar = Lunar.fromYmd(year, 8, 15);
    const zhongqiuSolar = zhongqiuLunar.getSolar();
    holidays.push({
      id: 'zhongqiu',
      name: '中秋节',
      date: `${zhongqiuSolar.getYear()}-${String(zhongqiuSolar.getMonth()).padStart(2, '0')}-${String(
        zhongqiuSolar.getDay()
      ).padStart(2, '0')}`,
      year: zhongqiuSolar.getYear(),
      month: zhongqiuSolar.getMonth(),
      day: zhongqiuSolar.getDay(),
      description: '但愿人长久，千里共婵娟',
    });
  } catch (e) {
    // fallback
  }

  // 国庆节
  holidays.push({
    id: 'guoqing',
    name: '国庆节',
    date: `${year}-10-01`,
    year,
    month: 10,
    day: 1,
    description: '欣逢盛世，欢度国庆',
  });

  return holidays;
}

// Calculate countdown to the next statutory holiday from a target date
export function calculateNextHolidayCountdown(targetYear: number, targetMonth: number, targetDay: number) {
  const curDate = new Date(targetYear, targetMonth - 1, targetDay);
  curDate.setHours(0, 0, 0, 0);

  // Check holidays in targetYear and targetYear + 1
  const allHolidays = [
    ...getStatutoryHolidays(targetYear),
    ...getStatutoryHolidays(targetYear + 1),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const h of allHolidays) {
    const hDate = new Date(h.date);
    hDate.setHours(0, 0, 0, 0);
    const diffTime = hDate.getTime() - curDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return {
        holidayName: `${h.year}年${h.name}`,
        days: diffDays,
        holidayDate: h.date,
      };
    }
  }

  // Fallback next year New Year
  const nextYear = targetYear + 1;
  const nextNewYear = new Date(nextYear, 0, 1);
  const diffDays = Math.round((nextNewYear.getTime() - curDate.getTime()) / (1000 * 60 * 60 * 24));
  return {
    holidayName: `${nextYear}年元旦`,
    days: diffDays > 0 ? diffDays : 1,
    holidayDate: `${nextYear}-01-01`,
  };
}

// Client-side fallback generator if API is unreachable
export function generateClientFallbackAlmanac(year: number, month: number): AlmanacDay[] {
  const almanac: AlmanacDay[] = [];
  const firstDayWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun, 1=Mon
  const prevMonthPadding = (firstDayWeek === 0 ? 7 : firstDayWeek) - 1;
  const startDate = new Date(year, month - 1, 1 - prevMonthPadding);

  for (let i = 0; i < 42; i++) {
    const cur = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const curY = cur.getFullYear();
    const curM = cur.getMonth() + 1;
    const curD = cur.getDate();

    const solar = Solar.fromYmd(curY, curM, curD);
    const lunar = solar.getLunar();
    const holiday = HolidayUtil.getHoliday(curY, curM, curD);

    let status: string | undefined = undefined;
    if (holiday) {
      status = holiday.isWork() ? '2' : '1';
    }

    const jieqi = lunar.getJieQi();
    const festivals = [...solar.getFestivals(), ...lunar.getFestivals()];
    const term = jieqi || (festivals.length > 0 ? festivals[0] : undefined);

    almanac.push({
      year: String(curY),
      month: String(curM),
      day: String(curD),
      lDate: lunar.getDayInChinese(),
      lMonth: lunar.getMonthInChinese(),
      lunarYear: String(lunar.getYear()),
      lunarMonth: String(lunar.getMonth()),
      lunarDate: String(lunar.getDay()),
      animal: lunar.getYearShengXiao(),
      gzYear: lunar.getYearInGanZhi(),
      gzMonth: lunar.getMonthInGanZhi(),
      gzDate: lunar.getDayInGanZhi(),
      term: term,
      status: status,
      festivalList: festivals.join(','),
      suit: lunar.getDayYi().slice(0, 10).join('.'),
      avoid: lunar.getDayJi().slice(0, 10).join('.'),
      cnDay: ['日', '一', '二', '三', '四', '五', '六'][cur.getDay()],
    });
  }

  return almanac;
}

// Fetch from API proxy or fallback
export async function fetchCalendarData(year: number, month: number): Promise<{ almanac: AlmanacDay[]; source: string }> {
  try {
    const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data = await res.json();
    if (data?.almanac && Array.isArray(data.almanac) && data.almanac.length > 0) {
      return { almanac: data.almanac, source: data.source || 'baidu' };
    }
    throw new Error('Empty almanac in response');
  } catch (err) {
    console.warn('[fetchCalendarData] Falling back to client-side lunar generator', err);
    return {
      almanac: generateClientFallbackAlmanac(year, month),
      source: 'client-fallback',
    };
  }
}

// Detailed Yellow Calendar calculation for the modal
export function getDetailedHuangli(year: number, month: number, day: number) {
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();

  return {
    solarDate: `${year}年${month}月${day}日 星期${['日', '一', '二', '三', '四', '五', '六'][solar.getWeek()]}`,
    lunarDate: `农历 ${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganzhi: `${lunar.getYearInGanZhi()}【${lunar.getYearShengXiao()}】年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
    nayin: `${lunar.getYearNaYin()} ${lunar.getMonthNaYin()} ${lunar.getDayNaYin()}`,
    chongsha: `冲${lunar.getDayChongDesc()} 煞${lunar.getDaySha()}`,
    pengzu: `${lunar.getPengZuGan()} ${lunar.getPengZuZhi()}`,
    taishen: lunar.getDayPositionTai(),
    xishen: `喜神${lunar.getDayPositionXiDesc()} 财神${lunar.getDayPositionCaiDesc()} 福神${lunar.getDayPositionFuDesc()}`,
    suit: lunar.getDayYi(),
    avoid: lunar.getDayJi(),
    jieqi: lunar.getJieQi() || '无交节',
    wuxing: lunar.getDayNaYin(),
    xingxiu: `${lunar.getGong()}方${lunar.getShou()} ${lunar.getXiu()}${lunar.getZheng()}${lunar.getAnimal()}`,
    shichen: lunar.getTimes().slice(0, 12).map((t) => ({
      zhi: t.getZhi(),
      time: `${t.getMinHm()} - ${t.getMaxHm()}`,
      ganzhi: t.getGanZhi(),
      yi: t.getYi().slice(0, 4).join(' '),
      ji: t.getJi().slice(0, 4).join(' '),
    })),
  };
}
