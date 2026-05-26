/* POST   /api/auth   { passcode }   set session cookie
 * DELETE /api/auth                  clear session cookie */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { COOKIE_NAME, SESSION_TTL_SECONDS, signSession } from '@/lib/auth';

export const runtime = 'nodejs';

/* Default passcode hash for `lantern-2026` — overridable via SLA_PASSCODE_HASH.
 * Generated with: bcryptjs.hashSync('lantern-2026', 10) and verified at startup. */
const DEFAULT_HASH = '$2a$10$wXrNXBo2oBAk2C8fTxc2YeIt05tQP4NV/k56e9Ge5I5jCEDkTU3GG';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const passcode = String(body.passcode || '');
  const hash = process.env.SLA_PASSCODE_HASH || DEFAULT_HASH;

  const ok = bcrypt.compareSync(passcode, hash);
  if (!ok) return NextResponse.json({ error: 'wrong passcode' }, { status: 401 });

  const token = await signSession({ sub: 'owner' });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   SESSION_TTL_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}
