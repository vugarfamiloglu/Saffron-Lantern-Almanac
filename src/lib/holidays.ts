/* -----------------------------------------------------------------------------
 * src/lib/holidays.ts — built-in holiday catalogue.
 *
 * Each entry carries enough metadata for the AI prompt to make a tailored
 * campaign and for the dashboard to show a tasteful countdown:
 *
 *   slug          stable id used in URLs and DB rows
 *   label         human display name (English; Azerbaijani in 'native')
 *   native        local-language label where it matters culturally
 *   date_pattern  'MM-DD' (annual, fixed) | 'YYYY-MM-DD' (one-off) | 'movable' (Ramadan etc.)
 *                 The dashboard uses this only to project next-occurrence
 *                 — the AI gets the same hint via the prompt.
 *   culture       'AZ' | 'global' | 'religious' | 'seasonal' | 'commerce'
 *   audience      who this primarily speaks to
 *   narrative     a seed paragraph the AI extends in the campaign brief
 *   palette       suggested colours so the UI can tint the holiday card
 *
 * The list intentionally over-indexes on Azerbaijani celebrations because
 * that's where local-business demand is densest. Universal holidays are
 * here too so cross-border shops don't feel left out.
 * -------------------------------------------------------------------------- */

export interface HolidayEntry {
  slug:         string;
  label:        string;
  native?:      string;
  date_pattern: string;
  culture:      'AZ' | 'global' | 'religious' | 'seasonal' | 'commerce';
  audience:     string;
  narrative:    string;
  palette: { primary: string; accent: string };
}

export const HOLIDAYS: ReadonlyArray<HolidayEntry> = [
  /* ── Azerbaijani national + cultural ─────────────────────────────── */
  {
    slug: 'novruz', label: 'Novruz', native: 'Novruz Bayramı',
    date_pattern: '03-20', culture: 'AZ',
    audience: 'Azerbaijani families, multi-generational, food-and-tradition oriented',
    narrative: 'Novruz is the New Year of nature — fire, water, earth, wind. Seven flavours on the süfrə (samanı, shor-gogal, paxlava). The campaign should feel warm, traditional, family-first, but modern enough to land on Instagram and TikTok.',
    palette: { primary: '#c89c3a', accent: '#7a3f5a' },
  },
  {
    slug: '8-mart', label: 'International Women\'s Day', native: '8 Mart',
    date_pattern: '03-08', culture: 'AZ',
    audience: 'women of all ages + the men buying them gifts; 25-55 sweet spot',
    narrative: '8 Mart in Azerbaijan is a bigger consumer moment than Valentine\'s — gifts, flowers, restaurants. Tone the campaign generous and elegant; avoid clichés ("strong woman" lines without substance). Offers should be specific (bouquets, brunches, services).',
    palette: { primary: '#a83247', accent: '#c89c3a' },
  },
  {
    slug: 'ramazan', label: 'Ramadan / Iftar Season', native: 'Ramazan Bayramı',
    date_pattern: 'movable', culture: 'religious',
    audience: 'observant Muslim families + restaurants offering iftar menus',
    narrative: 'Ramazan: 30 days of fasting, then Eid al-Fitr. Cafés and restaurants run iftar deals; retailers do gift sets. The campaign must respect the daytime fast — push offers in the evening, talk about family iftars, generosity, and the meal that breaks the day.',
    palette: { primary: '#6b8e6e', accent: '#c89c3a' },
  },
  {
    slug: 'qurban', label: 'Eid al-Adha', native: 'Qurban Bayramı',
    date_pattern: 'movable', culture: 'religious',
    audience: 'observant Muslim families + butcher / catering / sweet shops',
    narrative: 'Qurban is the Festival of Sacrifice — family gatherings, generous sharing. Campaigns lean into meals, sweets, and acts of giving. Tone: warm, respectful, no commercialisation of the religious act itself.',
    palette: { primary: '#7a3f5a', accent: '#c89c3a' },
  },
  {
    slug: 'respublika-gunu', label: 'Republic Day', native: '28 May',
    date_pattern: '05-28', culture: 'AZ',
    audience: 'national-pride leaning; works across all categories',
    narrative: 'Republic Day marks the 1918 Democratic Republic. Tasteful patriotism — flag motifs OK, slogans no. Limited-edition products, national-themed offers, brand stories that connect to the country\'s history.',
    palette: { primary: '#3aa86b', accent: '#a83247' },
  },
  {
    slug: 'qelebe-gunu', label: 'Victory Day', native: 'Qələbə Günü',
    date_pattern: '11-08', culture: 'AZ',
    audience: 'national audience, especially 30+, military-family households',
    narrative: 'Victory Day commemorates the 2020 Karabakh War end. Reverent tone — no commercial hype. Brands can show solidarity, donate-a-portion campaigns work well, military-family discounts land.',
    palette: { primary: '#3aa86b', accent: '#2a1a13' },
  },
  {
    slug: 'mueallim-gunu', label: 'Teachers\' Day', native: 'Müəllim Günü',
    date_pattern: '10-05', culture: 'AZ',
    audience: 'teachers + parents thanking them, students aged 16+',
    narrative: 'Teachers\' Day — flowers, gift sets, café meals. Service businesses can offer teacher discounts (with ID); retail can do small thoughtful gifts. Tone: gratitude, not pity.',
    palette: { primary: '#6b8e6e', accent: '#c89c3a' },
  },
  {
    slug: 'solidarliq', label: 'Solidarity Day of Azerbaijanis', native: 'Həmrəylik Günü',
    date_pattern: '12-31', culture: 'AZ',
    audience: 'Azerbaijani diaspora + domestic audience celebrating year-end',
    narrative: 'Falls on Dec 31 — overlaps with New Year. Diaspora-themed messaging, shipping abroad, "send home" gift sets all work. Tone: warm, year-closing, connecting.',
    palette: { primary: '#c89c3a', accent: '#7a3f5a' },
  },

  /* ── Global / universal ──────────────────────────────────────────── */
  {
    slug: 'new-year', label: 'New Year', native: 'Yeni İl',
    date_pattern: '12-31', culture: 'global',
    audience: 'everyone; family-driven for AZ, party-driven for younger urban',
    narrative: 'Year-end celebration. Gift sets, fitness "new you" angles, fresh-start product launches. Build the campaign around the last 10 days of December, peak on Dec 30-31.',
    palette: { primary: '#a83247', accent: '#c89c3a' },
  },
  {
    slug: 'valentines', label: 'Valentine\'s Day',
    date_pattern: '02-14', culture: 'global',
    audience: 'couples 20-45, gift-givers, also "Galentine\'s" friend angle',
    narrative: 'Romantic + commercial. Two angles work simultaneously: serious couples\' gifts (jewellery, dinners) and lighter "treat your friends" content. Avoid old clichés — embrace single-life angles too.',
    palette: { primary: '#a83247', accent: '#c89c3a' },
  },
  {
    slug: 'mothers-day', label: 'Mother\'s Day',
    date_pattern: 'movable', culture: 'global',
    audience: 'adult children buying for moms (broad ages)',
    narrative: 'Falls on the second Sunday of May in most of the world. Sentiment-heavy. Storytelling lands harder than discounts — featured-customer posts, "what my mom taught me" angles.',
    palette: { primary: '#a83247', accent: '#c89c3a' },
  },
  {
    slug: 'fathers-day', label: 'Father\'s Day',
    date_pattern: 'movable', culture: 'global',
    audience: 'adult children + spouses buying for fathers',
    narrative: 'Third Sunday of June. Smaller commercial moment than Mother\'s Day but underexploited. Lean into tools, hobbies, food, experiences over generic ties-and-watches.',
    palette: { primary: '#6b8e6e', accent: '#2a1a13' },
  },
  {
    slug: 'halloween', label: 'Halloween',
    date_pattern: '10-31', culture: 'global',
    audience: 'younger urban (15-30), café/bar/sweet shops + costume retail',
    narrative: 'Halloween in Azerbaijan is mostly an urban-cafés/party phenomenon. Limited-edition products, themed cocktails, costume nights. Lean playful, low-effort participation wins.',
    palette: { primary: '#b45b1f', accent: '#2a1a13' },
  },
  {
    slug: 'christmas', label: 'Christmas',
    date_pattern: '12-25', culture: 'global',
    audience: 'expat / international audience + premium gift-buyers',
    narrative: 'In Azerbaijan, Christmas is more a "premium gift" cue than a religious holiday — overlaps with year-end shopping. Aesthetic luxe, neutral palette, gift-set framing.',
    palette: { primary: '#3aa86b', accent: '#a83247' },
  },

  /* ── Commerce moments ────────────────────────────────────────────── */
  {
    slug: 'black-friday', label: 'Black Friday',
    date_pattern: 'movable', culture: 'commerce',
    audience: 'price-sensitive across all ages — the deal hunters',
    narrative: 'Fourth Friday of November. The single largest e-commerce moment globally. Build a 5-day arc: tease (Mon), priority access for subscribers (Wed), main day (Fri), extended cyber weekend (Sat-Mon). Aggressive but honest discounts.',
    palette: { primary: '#2a1a13', accent: '#c89c3a' },
  },
  {
    slug: 'cyber-monday', label: 'Cyber Monday',
    date_pattern: 'movable', culture: 'commerce',
    audience: 'online shoppers, slightly more digital-product-leaning than Black Friday',
    narrative: 'Monday after Black Friday. Online-only deals, tech, services, subscriptions. Often runs as a continuation of Black Friday for smaller brands — combine if you don\'t have inventory for two distinct events.',
    palette: { primary: '#7a3f5a', accent: '#c89c3a' },
  },
  {
    slug: 'back-to-school', label: 'Back to School',
    date_pattern: 'movable', culture: 'seasonal',
    audience: 'parents of school-age children + university students',
    narrative: 'August-September runway. School supplies, uniforms, café student deals, fitness "back to routine" campaigns. The student angle works for many categories beyond stationery — coffee subscriptions, hair salons, gyms.',
    palette: { primary: '#c89c3a', accent: '#6b8e6e' },
  },
  {
    slug: 'spring-sale', label: 'Spring Sale',
    date_pattern: '03-15', culture: 'seasonal',
    audience: 'broad — fashion, home, garden, fitness all participate',
    narrative: 'Mid-March refresh. New collections, "spring clean" angles, lighter palettes, outdoor and garden ramps up. Tie into Novruz if you operate in Azerbaijan — they\'re a week apart.',
    palette: { primary: '#6b8e6e', accent: '#c89c3a' },
  },
  {
    slug: 'summer-kickoff', label: 'Summer Kickoff',
    date_pattern: '06-01', culture: 'seasonal',
    audience: 'urban + tourist; cafés, beach towns, fashion, travel',
    narrative: 'Early June into peak summer. Travel guides, summer menus, swimwear, festivals. In AZ specifically: Baku boulevard energy, regional resorts (Qabala, Naftalan), Gəncə food scene.',
    palette: { primary: '#c89c3a', accent: '#6b8e6e' },
  },
  {
    slug: 'autumn-harvest', label: 'Autumn Harvest',
    date_pattern: '09-23', culture: 'seasonal',
    audience: 'food, café, home-décor, lifestyle 25-55',
    narrative: 'Autumn equinox onward. Pomegranates, quince, walnuts, persimmons — Azerbaijani autumn is gorgeous and underused commercially. Cozy aesthetics, warm-drink launches, seasonal menus.',
    palette: { primary: '#b45b1f', accent: '#7a3f5a' },
  },
] as const;

export const HOLIDAY_BY_SLUG: Record<string, HolidayEntry> =
  Object.fromEntries(HOLIDAYS.map((h) => [h.slug, h]));

/* Return up to N upcoming holidays from `from` (defaults to today). Movable
 * dates fall back to a sane same-year placeholder so the dashboard can still
 * sort them — the AI gets the truth via the prompt narrative. */
export function upcomingHolidays(from: Date = new Date(), count = 6): Array<HolidayEntry & { next: Date; days_away: number }> {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const items = HOLIDAYS.map((h) => {
    const next = projectNext(h.date_pattern, today);
    const days_away = Math.round((next.getTime() - today.getTime()) / 86_400_000);
    return { ...h, next, days_away };
  });
  return items.sort((a, b) => a.days_away - b.days_away).slice(0, count);
}

function projectNext(pattern: string, from: Date): Date {
  if (pattern === 'movable') {
    /* Best-effort placeholder so movable holidays still appear in the
     * dashboard. The AI is told the truth in the prompt. */
    return new Date(from.getFullYear(), from.getMonth() + 2, 1);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(pattern)) return new Date(pattern + 'T00:00:00');
  if (/^\d{2}-\d{2}$/.test(pattern)) {
    const [m, d] = pattern.split('-').map(Number);
    let year = from.getFullYear();
    let candidate = new Date(year, m - 1, d);
    if (candidate < from) candidate = new Date(year + 1, m - 1, d);
    return candidate;
  }
  return new Date(from.getFullYear(), from.getMonth() + 1, 1);
}

export const DEFAULT_BRAND_VOICE =
  'Warm, generous, locally rooted. Treats the customer like a regular who walked through the door for the tenth time. Avoids stock-photo English; one sentence in Azerbaijani per post when it lands naturally.';
