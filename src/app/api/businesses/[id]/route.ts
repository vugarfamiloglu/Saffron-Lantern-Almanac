/* GET / PATCH / DELETE /api/businesses/:id */

import { NextResponse } from 'next/server';
import { deleteBusiness, getBusiness, updateBusiness } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getBusiness(id);
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({
    id: r.id, name: r.name, category: r.category, region: r.region,
    target_age_min: r.target_age_min, target_age_max: r.target_age_max,
    value_props: r.value_props,
    hashtag_seeds: r.hashtag_seeds ? safeParse(r.hashtag_seeds) : [],
    brand_voice: r.brand_voice,
    created_at: r.created_at,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getBusiness(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  updateBusiness(id, {
    name:           body.name !== undefined ? String(body.name).slice(0, 120) : undefined,
    category:       body.category !== undefined ? (body.category ? String(body.category).slice(0, 60) : null) : undefined,
    region:         body.region !== undefined ? (body.region ? String(body.region).slice(0, 60) : null) : undefined,
    target_age_min: body.target_age_min !== undefined ? (body.target_age_min === null ? null : Math.max(0, Math.min(120, Number(body.target_age_min)))) : undefined,
    target_age_max: body.target_age_max !== undefined ? (body.target_age_max === null ? null : Math.max(0, Math.min(120, Number(body.target_age_max)))) : undefined,
    value_props:    body.value_props !== undefined ? (body.value_props ? String(body.value_props).slice(0, 1200) : null) : undefined,
    hashtag_seeds:  body.hashtag_seeds !== undefined ? arrJson(body.hashtag_seeds) : undefined,
    brand_voice:    body.brand_voice !== undefined ? (body.brand_voice ? String(body.brand_voice).slice(0, 1200) : null) : undefined,
  } as any);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getBusiness(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  deleteBusiness(id);
  return NextResponse.json({ ok: true });
}

function arrJson(a: unknown): string | null {
  if (!Array.isArray(a)) return null;
  const c = a.map((x) => String(x).trim()).filter(Boolean).slice(0, 30);
  return c.length ? JSON.stringify(c) : null;
}
function safeParse(s: string): string[] {
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.map(String) : []; } catch { return []; }
}
