/* DELETE /api/holidays/:id — only deletes custom holidays. Built-ins are read-only. */

import { NextResponse } from 'next/server';
import { deleteCustomHoliday, listCustomHolidays } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exists = listCustomHolidays().some((h) => h.id === id);
  if (!exists) return NextResponse.json({ error: 'not found (built-ins cannot be deleted)' }, { status: 404 });
  deleteCustomHoliday(id);
  return NextResponse.json({ ok: true });
}
