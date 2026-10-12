import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Solar, Lunar, HolidayUtil } from 'lunar-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// In-memory cache for Baidu Calendar queries
const calendarCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

// Fallback generator using lunar-typescript if Baidu API fails or times out
function generateFallbackAlmanac(year: number, month: number) {
  const almanac: any[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Also include surrounding days (previous and next month days for 42-cell grid)
  const firstDayWeek = new Date(year, month - 1, 1).getDay(); // 0 is Sun, 1 is Mon
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

// Baidu OpenData Calendar Proxy Route
app.get('/api/calendar', async (req: Request, res: Response) => {
  try {
    const queryParam = req.query.query as string | undefined;
    const yearParam = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const monthParam = req.query.month ? parseInt(req.query.month as string, 10) : undefined;

    let query = queryParam;
    if (!query && yearParam && monthParam) {
      query = `${yearParam}年${monthParam}月`;
    }

    if (!query) {
      const now = new Date();
      query = `${now.getFullYear()}年${now.getMonth() + 1}月`;
    }

    // Check cache
    const cached = calendarCache.get(query);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      res.json(cached.data);
      return;
    }

    // Fetch from Baidu OpenData with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const baiduUrl = `https://opendata.baidu.com/data/inner?tn=reserved_all_res_tn&type=json&resource_id=52109&query=${encodeURIComponent(
      query
    )}&apiType=yearMonthData`;

    const response = await fetch(baiduUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://www.baidu.com',
      },
    });

    clearTimeout(timeout);

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('gbk');
      const text = decoder.decode(buffer);
      const json = JSON.parse(text);

      const almanac =
        json?.Result?.[0]?.DisplayData?.resultData?.tplData?.data?.almanac;

      if (Array.isArray(almanac) && almanac.length > 0) {
        const payload = {
          success: true,
          source: 'baidu',
          query,
          almanac,
        };
        if (calendarCache.size > 20) {
          const oldestKey = calendarCache.keys().next().value;
          if (oldestKey) calendarCache.delete(oldestKey);
        }
        calendarCache.set(query, { timestamp: Date.now(), data: payload });
        res.json(payload);
        return;
      }
    }

    // Fallback if Baidu response did not contain almanac
    throw new Error('Baidu API empty response');
  } catch (err: any) {
    console.warn(`[API /api/calendar] Falling back to lunar-typescript: ${err.message}`);
    
    // Parse year/month from query
    let y = 2026;
    let m = 10;
    const q = (req.query.query as string) || '';
    const match = q.match(/(\d{4})年(\d{1,2})月/);
    if (match) {
      y = parseInt(match[1], 10);
      m = parseInt(match[2], 10);
    } else if (req.query.year && req.query.month) {
      y = parseInt(req.query.year as string, 10);
      m = parseInt(req.query.month as string, 10);
    }

    const fallbackAlmanac = generateFallbackAlmanac(y, m);
    res.json({
      success: true,
      source: 'fallback',
      query: `${y}年${m}月`,
      almanac: fallbackAlmanac,
    });
  }
});

// Setup Vite or static serving
async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Baidu Calendar Desktop App running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
