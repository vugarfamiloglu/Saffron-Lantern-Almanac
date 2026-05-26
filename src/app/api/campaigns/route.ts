/* GET /api/campaigns — recent campaigns (most-recent first) */

import { NextResponse } from 'next/server';
import { listCampaigns } from '@/lib/db';

export async function GET(req: Request) {
  const url   = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '100'), 200);
  const rows  = listCampaigns(limit).map((r) => ({
    id:            r.id,
    business_id:   r.business_id,
    holiday_slug:  r.holiday_slug,
    holiday_label: r.holiday_label,
    starts_at:     r.starts_at,
    ends_at:       r.ends_at,
    objective:     r.objective,
    audience:      r.audience,
    provider:      r.provider,
    model:         r.model,
    status:        r.status,
    starred:       !!r.starred,
    /* Counts so the list view can show "10 posts · 10 stories · 3 reels" without
     * pulling the heavy JSON payloads. */
    counts: {
      posts:   r.posts_json   ? safeLen(r.posts_json)   : 0,
      stories: r.stories_json ? safeLen(r.stories_json) : 0,
      reels:   r.reels_json   ? safeLen(r.reels_json)   : 0,
    },
    narrative_preview: r.narrative ? r.narrative.slice(0, 240) : '',
    created_at:        r.created_at,
    generated_at:      r.generated_at,
  }));
  return NextResponse.json({ campaigns: rows });
}

function safeLen(s: string): number {
  try { const a = JSON.parse(s); return Array.isArray(a) ? a.length : 0; } catch { return 0; }
}
