/* GET + POST /api/businesses */

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { insertBusiness, listBusinesses } from '@/lib/db';

export async function GET() {
  return NextResponse.json({ businesses: listBusinesses().map(toJson) });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const id = randomUUID();
  insertBusiness({
    id, name,
    category:       body.category   ? String(body.category).slice(0, 60)  : null,
    region:         body.region     ? String(body.region).slice(0, 60)    : null,
    target_age_min: body.target_age_min != null ? Math.max(0, Math.min(120, Number(body.target_age_min))) : null,
    target_age_max: body.target_age_max != null ? Math.max(0, Math.min(120, Number(body.target_age_max))) : null,
    value_props:    body.value_props ? String(body.value_props).slice(0, 1200) : null,
    hashtag_seeds:  arrJson(body.hashtag_seeds),
    brand_voice:    body.brand_voice ? String(body.brand_voice).slice(0, 1200) : null,
    created_at:     Date.now(),
  });
  return NextResponse.json({ ok: true, id });
}

function arrJson(a: unknown): string | null {
  if (!Array.isArray(a)) return null;
  const clean = a.map((x) => String(x).trim()).filter(Boolean).slice(0, 30);
  return clean.length ? JSON.stringify(clean) : null;
}

function toJson(r: any) {
  return {
    id: r.id, name: r.name, category: r.category, region: r.region,
    target_age_min: r.target_age_min, target_age_max: r.target_age_max,
    value_props: r.value_props,
    hashtag_seeds: r.hashtag_seeds ? safeParse(r.hashtag_seeds) : [],
    brand_voice: r.brand_voice,
    created_at: r.created_at,
  };
}
function safeParse(s: string): string[] {
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
}
