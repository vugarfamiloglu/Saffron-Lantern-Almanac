/* -----------------------------------------------------------------------------
 * src/lib/campaign.ts — the meta-prompt + result shape for the campaign
 * generator. Shared between the live preview panel and /api/generate so the
 * preview shows the actual text the model sees.
 * -------------------------------------------------------------------------- */

import { DEFAULT_BRAND_VOICE, type HolidayEntry } from './holidays';

export interface BusinessInput {
  name:        string;
  category?:   string;          /* e.g. "café", "boutique", "fitness studio" */
  region?:     string;          /* e.g. "Baku, AZ" */
  target_age?: { min?: number; max?: number };
  value_props?: string;         /* free text — what makes them different */
  hashtag_seeds?: string[];
  brand_voice?: string;
}

export interface CampaignBriefInput {
  business:  BusinessInput;
  holiday:   HolidayEntry;
  objective: string;            /* "raise weekend foot traffic by 50%" */
  language?: 'en' | 'az' | 'ru' | 'tr';   /* default 'en' — model writes posts in this language */
  starts_at?: string;           /* 'YYYY-MM-DD' override */
  ends_at?:   string;
}

/* ── JSON schema description we hand to the model ────────────────────── */
export const SCHEMA_DESCRIPTION = `
Return ONLY this JSON object — no markdown, no prose around it:

{
  "title":     "<campaign name, e.g. 'Novruz 2026 · Lavanda Café'>",
  "starts_at": "YYYY-MM-DD",
  "ends_at":   "YYYY-MM-DD",
  "narrative": "<2-4 paragraph opening brief, drop-cap-worthy, sets the mood>",
  "audience":  "<one short paragraph, refining who this is for>",
  "offers": [
    { "name": "<offer name>",
      "discount_pct": <0-90 integer or null if no discount>,
      "bundle":       "<short description of the bundle, or null>",
      "valid_until":  "YYYY-MM-DD" }
    /* 3-5 offers */
  ],
  "posts": [
    /* exactly 10 items, calendar-spread across the campaign window */
    { "day": <1-30 integer>,
      "theme":   "<one-line theme>",
      "hook":    "<scroll-stopper first line>",
      "body":    "<6-10 line caption ready to post>",
      "cta":     "<call to action>",
      "hashtags":     ["#tag1","#tag2", … 5-10 items],
      "image_prompt": "<text-to-image prompt for a hero shot>" }
  ],
  "stories": [
    /* exactly 10 items */
    { "day": <1-30>,
      "type":    "poll|question|countdown|quiz|slider|text|link",
      "overlay": "<the headline on the story>",
      "body":    "<short copy or option labels>" }
  ],
  "reels": [
    /* exactly 3 items */
    { "day": <1-30>,
      "hook":   "<3-5 second opening line>",
      "beats":  "<numbered beats as a single string, 4-7 beats>",
      "broll":  "<what to film — shot list as a single string>" }
  ],
  "kpis": {
    "primary":   "<single KPI you would track first>",
    "secondary": ["<KPI 2>", "<KPI 3>"],
    "north_star": "<the one number that would make this campaign a clear win>"
  }
}
`.trim();

export function buildCampaignPrompt(input: CampaignBriefInput): { system: string; user: string } {
  const brand = (input.business.brand_voice && input.business.brand_voice.trim()) || DEFAULT_BRAND_VOICE;
  const lang  = input.language || 'en';
  const ageHint = input.business.target_age
    ? `Target age ${input.business.target_age.min || 18}-${input.business.target_age.max || 65}`
    : 'Target age: unspecified — write for broad reach';
  const tags = input.business.hashtag_seeds && input.business.hashtag_seeds.length
    ? `Seed hashtags to weave in: ${input.business.hashtag_seeds.join(' ')}`
    : '';

  const system = `You are Saffron Lantern Almanac, a campaign factory for local businesses.
You produce a complete 30-day holiday content plan as a single strict-JSON object — no markdown, no preamble.

WRITING RULES
- All copy in language code "${lang}". When ${lang}="en", you may sprinkle one short Azerbaijani phrase per 3-4 posts where it lands naturally.
- Match the brand voice EXACTLY:
  "${brand}"
- Every post must be a complete, paste-ready caption (no [placeholders]).
- Hashtags relevant to the niche AND the holiday; mix branded + discovery tags.
- For movable holidays (Ramadan, Eid al-Adha, etc.), respect the cultural rhythm — don't push hype during fasting hours.
- KPIs must be measurable (numbers, not vibes).

OUTPUT SHAPE
${SCHEMA_DESCRIPTION}`;

  const user = `BUSINESS
- Name:     ${input.business.name}
- Category: ${input.business.category || 'unspecified'}
- Region:   ${input.business.region || 'local'}
- ${ageHint}
- Value props: ${input.business.value_props || '— not provided —'}
- ${tags}

HOLIDAY
- Slug:     ${input.holiday.slug}
- Label:    ${input.holiday.label}${input.holiday.native ? ` (${input.holiday.native})` : ''}
- Culture:  ${input.holiday.culture}
- Date hint: ${input.holiday.date_pattern}
- Audience cues: ${input.holiday.audience}
- Cultural narrative seed: ${input.holiday.narrative}

WINDOW
- Starts on: ${input.starts_at || '— set sensibly based on the holiday —'}
- Ends on:   ${input.ends_at   || '— set sensibly, typically the holiday date or 7 days after —'}

OBJECTIVE
"${input.objective}"

Now produce the full campaign JSON. Distribute the 10 posts so they tease, build, peak on the holiday, then close. Stories support the posts (poll the day before a big post, countdown 2 days before peak, etc.). Reels go on days you expect highest reach.`;

  return { system, user };
}

/* ── Result shapes + coercion ────────────────────────────────────────── */

export interface CampaignOffer  { name: string; discount_pct: number | null; bundle: string | null; valid_until: string | null; }
export interface CampaignPost   { day: number; theme: string; hook: string; body: string; cta: string; hashtags: string[]; image_prompt: string; }
export interface CampaignStory  { day: number; type: string; overlay: string; body: string; }
export interface CampaignReel   { day: number; hook: string; beats: string; broll: string; }
export interface CampaignKpis   { primary: string; secondary: string[]; north_star: string; }

export interface CampaignResult {
  title:     string;
  starts_at: string | null;
  ends_at:   string | null;
  narrative: string;
  audience:  string;
  offers:    CampaignOffer[];
  posts:     CampaignPost[];
  stories:   CampaignStory[];
  reels:     CampaignReel[];
  kpis:      CampaignKpis;
}

export function coerceCampaignResult(raw: any): CampaignResult {
  const s = (v: unknown, max = 4000) => String(v ?? '').slice(0, max);
  const arr = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
  const dayOf = (v: unknown) => Math.max(1, Math.min(30, Math.round(Number(v) || 1)));

  return {
    title:     s(raw?.title, 200),
    starts_at: raw?.starts_at ? s(raw.starts_at, 20) : null,
    ends_at:   raw?.ends_at   ? s(raw.ends_at,   20) : null,
    narrative: s(raw?.narrative, 2400),
    audience:  s(raw?.audience,  800),

    offers: arr(raw?.offers).slice(0, 6).map((o: any) => ({
      name:         s(o?.name, 120),
      discount_pct: o?.discount_pct !== null && o?.discount_pct !== undefined ? Math.max(0, Math.min(95, Math.round(Number(o.discount_pct)))) : null,
      bundle:       o?.bundle ? s(o.bundle, 240) : null,
      valid_until:  o?.valid_until ? s(o.valid_until, 20) : null,
    })),

    posts: arr(raw?.posts).slice(0, 12).map((p: any) => ({
      day:          dayOf(p?.day),
      theme:        s(p?.theme, 120),
      hook:         s(p?.hook, 300),
      body:         s(p?.body, 1600),
      cta:          s(p?.cta, 160),
      hashtags:     arr(p?.hashtags).slice(0, 15).map((h) => String(h).slice(0, 40)),
      image_prompt: s(p?.image_prompt, 600),
    })),

    stories: arr(raw?.stories).slice(0, 12).map((st: any) => ({
      day:     dayOf(st?.day),
      type:    s(st?.type, 24).toLowerCase(),
      overlay: s(st?.overlay, 200),
      body:    s(st?.body, 600),
    })),

    reels: arr(raw?.reels).slice(0, 5).map((r: any) => ({
      day:   dayOf(r?.day),
      hook:  s(r?.hook, 240),
      beats: s(r?.beats, 1200),
      broll: s(r?.broll, 800),
    })),

    kpis: {
      primary:    s(raw?.kpis?.primary, 200),
      secondary:  arr(raw?.kpis?.secondary).slice(0, 5).map((x) => String(x).slice(0, 200)),
      north_star: s(raw?.kpis?.north_star, 200),
    },
  };
}
