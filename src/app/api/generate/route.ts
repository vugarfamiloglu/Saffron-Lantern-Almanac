/* POST /api/generate
 *
 * The campaign factory's single most important endpoint.
 *
 * Body:
 *   { business_id?, business?, holiday_slug, objective, language?, provider?, starts_at?, ends_at? }
 *
 * Either pass `business_id` (looked up + decrypted server-side) OR pass an
 * inline `business` object for one-off campaigns without saving a profile.
 *
 * Returns the full coerced campaign object + a persisted row id so the
 * caller can navigate to /campaigns/<id>. */

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { decryptString } from '@/lib/crypto';
import { getBusiness, getDefaultProviderKey, insertCampaign } from '@/lib/db';
import { HOLIDAY_BY_SLUG } from '@/lib/holidays';
import { buildCampaignPrompt, coerceCampaignResult, type BusinessInput } from '@/lib/campaign';
import { chatJson, type ProviderId } from '@/lib/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  /* ── resolve business ────────────────────────────────────────────── */
  let business: BusinessInput;
  let business_id: string | null = null;
  if (body.business_id) {
    const row = getBusiness(String(body.business_id));
    if (!row) return NextResponse.json({ error: 'business not found' }, { status: 404 });
    business_id = row.id;
    business = {
      name: row.name,
      category:     row.category    || undefined,
      region:       row.region      || undefined,
      value_props:  row.value_props || undefined,
      brand_voice:  row.brand_voice || undefined,
      target_age:   (row.target_age_min || row.target_age_max)
        ? { min: row.target_age_min || undefined, max: row.target_age_max || undefined }
        : undefined,
      hashtag_seeds: row.hashtag_seeds ? safeParse(row.hashtag_seeds) : undefined,
    };
  } else if (body.business && typeof body.business === 'object') {
    business = {
      name:         String(body.business.name || '').slice(0, 120),
      category:     body.business.category    ? String(body.business.category).slice(0, 60)    : undefined,
      region:       body.business.region      ? String(body.business.region).slice(0, 60)      : undefined,
      value_props:  body.business.value_props ? String(body.business.value_props).slice(0, 1200) : undefined,
      brand_voice:  body.business.brand_voice ? String(body.business.brand_voice).slice(0, 1200) : undefined,
      target_age:   body.business.target_age,
      hashtag_seeds: Array.isArray(body.business.hashtag_seeds) ? body.business.hashtag_seeds.slice(0, 30).map((x: any) => String(x)) : undefined,
    };
    if (!business.name) return NextResponse.json({ error: 'business.name required' }, { status: 400 });
  } else {
    return NextResponse.json({ error: 'business_id or business required' }, { status: 400 });
  }

  /* ── resolve holiday ─────────────────────────────────────────────── */
  const holidaySlug = String(body.holiday_slug || '').trim();
  const holiday     = HOLIDAY_BY_SLUG[holidaySlug];
  if (!holiday) return NextResponse.json({ error: 'unknown holiday_slug' }, { status: 400 });

  const objective = String(body.objective || '').trim().slice(0, 400) || `Grow ${holiday.label} sales for ${business.name}`;
  const language  = (['en','az','ru','tr'].includes(String(body.language)) ? body.language : 'en') as 'en'|'az'|'ru'|'tr';
  const providerId: ProviderId = (body.provider as ProviderId) || pickProvider();

  const key = getDefaultProviderKey(providerId);
  if (!key) {
    return NextResponse.json({
      error: `no ${providerId} key configured — add one in Settings, or choose a different provider.`,
    }, { status: 412 });
  }

  /* ── call the AI ─────────────────────────────────────────────────── */
  const apiKey = decryptString(key.key_encrypted);
  const prompt = buildCampaignPrompt({
    business, holiday, objective, language,
    starts_at: body.starts_at,
    ends_at:   body.ends_at,
  });

  try {
    const t0 = Date.now();
    const r  = await chatJson({
      provider: providerId, apiKey, model: key.model || undefined,
      system: prompt.system, user: prompt.user, maxTokens: 4800,
    });
    const out = coerceCampaignResult(r.data);

    /* ── persist ─────────────────────────────────────────────────────── */
    const id = randomUUID();
    insertCampaign({
      id, business_id,
      holiday_slug:  holiday.slug,
      holiday_label: holiday.label,
      starts_at:     out.starts_at,
      ends_at:       out.ends_at,
      objective,
      audience:      out.audience,
      narrative:     out.narrative,
      offers_json:   JSON.stringify(out.offers),
      posts_json:    JSON.stringify(out.posts),
      stories_json:  JSON.stringify(out.stories),
      reels_json:    JSON.stringify(out.reels),
      kpis_json:     JSON.stringify(out.kpis),
      provider:      providerId,
      model:         r.model,
      status:        'draft',
      starred:       0,
      created_at:    Date.now(),
      generated_at:  Date.now(),
    });

    return NextResponse.json({
      ok: true, id,
      result: out,
      meta: { provider: providerId, model: r.model, latency_ms: Date.now() - t0 },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || String(e) }, { status: 502 });
  }
}

function pickProvider(): ProviderId {
  if (getDefaultProviderKey('openai'))    return 'openai';
  if (getDefaultProviderKey('anthropic')) return 'anthropic';
  return 'gemini';
}

function safeParse(s: string): string[] {
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
}
