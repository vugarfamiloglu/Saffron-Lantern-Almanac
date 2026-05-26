/* GET / PATCH (star/status) / DELETE one campaign */

import { NextResponse } from 'next/server';
import { deleteCampaign, getCampaign, updateCampaign } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = getCampaign(id);
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json({
    id:            r.id,
    business_id:   r.business_id,
    holiday_slug:  r.holiday_slug,
    holiday_label: r.holiday_label,
    starts_at:     r.starts_at,
    ends_at:       r.ends_at,
    objective:     r.objective,
    audience:      r.audience,
    narrative:     r.narrative,
    offers:        safeArr(r.offers_json),
    posts:         safeArr(r.posts_json),
    stories:       safeArr(r.stories_json),
    reels:         safeArr(r.reels_json),
    kpis:          r.kpis_json ? safeObj(r.kpis_json) : null,
    provider:      r.provider,
    model:         r.model,
    status:        r.status,
    starred:       !!r.starred,
    created_at:    r.created_at,
    generated_at:  r.generated_at,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getCampaign(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  updateCampaign(id, {
    starred: body.starred !== undefined ? (body.starred ? 1 : 0) : undefined,
    status:  body.status  !== undefined ? String(body.status) : undefined,
  } as any);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getCampaign(id)) return NextResponse.json({ error: 'not found' }, { status: 404 });
  deleteCampaign(id);
  return NextResponse.json({ ok: true });
}

function safeArr(s: string | null): unknown[] {
  if (!s) return [];
  try { const a = JSON.parse(s); return Array.isArray(a) ? a : []; } catch { return []; }
}
function safeObj(s: string | null): Record<string, unknown> | null {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
