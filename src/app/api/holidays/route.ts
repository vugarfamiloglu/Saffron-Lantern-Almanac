/* GET  /api/holidays — merged built-in + custom catalogue
 * POST /api/holidays — add a custom holiday */

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { HOLIDAYS } from '@/lib/holidays';
import { insertCustomHoliday, listCustomHolidays } from '@/lib/db';

export async function GET() {
  const builtin = HOLIDAYS.map((h) => ({
    id:           h.slug,
    slug:         h.slug,
    label:        h.label,
    native:       h.native || null,
    date_pattern: h.date_pattern,
    culture:      h.culture,
    audience:     h.audience,
    narrative:    h.narrative,
    palette:      h.palette,
    custom:       false,
  }));
  const custom = listCustomHolidays().map((c) => ({
    id:           c.id,
    slug:         c.slug,
    label:        c.label,
    native:       null,
    date_pattern: c.date_pattern || '',
    culture:      c.culture || 'global',
    audience:     c.audience || '',
    narrative:    c.narrative || '',
    palette:      c.palette ? safeParse(c.palette) : { primary: '#c89c3a', accent: '#7a3f5a' },
    custom:       true,
  }));
  return NextResponse.json({ holidays: [...custom, ...builtin] });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const label = String(body.label || '').trim();
  if (!label) return NextResponse.json({ error: 'label is required' }, { status: 400 });

  const baseSlug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'custom-' + Date.now();
  insertCustomHoliday({
    id:           randomUUID(),
    slug:         baseSlug + '-' + String(Date.now()).slice(-5),
    label:        label.slice(0, 80),
    date_pattern: body.date_pattern ? String(body.date_pattern).slice(0, 20) : null,
    culture:      body.culture ? String(body.culture).slice(0, 30) : 'global',
    audience:     body.audience ? String(body.audience).slice(0, 400) : null,
    narrative:    body.narrative ? String(body.narrative).slice(0, 2000) : null,
    palette:      body.palette ? JSON.stringify(body.palette) : null,
    created_at:   Date.now(),
  });
  return NextResponse.json({ ok: true });
}

function safeParse(s: string): { primary: string; accent: string } {
  try { return JSON.parse(s); } catch { return { primary: '#c89c3a', accent: '#7a3f5a' }; }
}
