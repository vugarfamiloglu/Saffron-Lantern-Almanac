'use client';

/* TopBar — sticky page header above the workbench.
 *
 * Anatomy (left → right):
 *   1. page-mark         tiny lantern glyph + a single chevron divider
 *   2. crumb             one short word, the section the user is in
 *   3. title             Playfair Display, derived from props OR the route
 *   4. subtitle (opt)    one short clause for context (date range, status)
 *
 *   5. live-badge        center pill — the next holiday countdown by default
 *                        (hidden when the page passes its own action)
 *
 *   6. action (opt)      page-supplied React node (e.g. "+ New campaign")
 *   7. ThemeToggle
 *   8. Sign-out
 *
 * Pages don't need to do anything — AppShell will derive the title and
 * subtitle from the pathname. But any page can override via the `header`
 * prop on AppShell. */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { ConfirmModal } from './ConfirmModal';
import { upcomingHolidays } from '@/lib/holidays';

export interface TopBarHeader {
  crumb?:    string;
  title?:    string;
  subtitle?: string;
  /* Optional page action (button, link). Sits between the live badge and
   * the right-side utility controls. */
  action?:   ReactNode;
  /* When true the live next-holiday badge is suppressed (e.g. campaign
   * detail pages have their own contextual info). */
  hideBadge?: boolean;
}

interface Props {
  /* Derived defaults when undefined. */
  header?: TopBarHeader;
}

export function TopBar({ header }: Props) {
  const router = useRouter();
  const [signOut, setSignOut] = useState(false);

  /* Pick the very next holiday once per mount — enough freshness for a
   * static SPA, no need to recompute on every render. */
  const next = useMemo(() => upcomingHolidays(new Date(), 1)[0], []);

  /* Smooth shadow when the page is scrolled — feels alive without flashing. */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  async function doSignOut() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
  }

  return (
    <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
      {/* ── LEFT ─────────────────────────────────────────────────────── */}
      <div className="topbar-left">
        <span className="topbar-mark" aria-hidden>
          {/* Tiny lantern glyph echoing the logo */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M9 5 H15 L17 8 V16 L15 19 H9 L7 16 V8 Z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
            <path d="M12 9 C10.5 11 10 12.5 11 14 C11.7 14.8 12.3 14.8 13 14 C14 12.5 13.5 11 12 9 Z" fill="currentColor"/>
          </svg>
        </span>
        <span className="topbar-chevron">›</span>
        {header?.crumb && <span className="topbar-crumb">{header.crumb}</span>}
        <div className="topbar-title-stack">
          <div className="topbar-title">{header?.title || '—'}</div>
          {header?.subtitle && <div className="topbar-subtitle">{header.subtitle}</div>}
        </div>
      </div>

      {/* ── CENTER ───────────────────────────────────────────────────── */}
      <div className="topbar-center">
        {!header?.hideBadge && next && (
          <a href={`/studio?holiday=${encodeURIComponent(next.slug)}`} className="topbar-badge"
             title="Open this holiday in Studio">
            <span className="topbar-badge-dot" />
            <span className="topbar-badge-label">{next.label}</span>
            <span className="topbar-badge-num">{next.days_away}</span>
            <span className="topbar-badge-lbl">days</span>
          </a>
        )}
      </div>

      {/* ── RIGHT ────────────────────────────────────────────────────── */}
      <div className="topbar-right">
        {header?.action}
        <ThemeToggle />
        <button className="btn btn-ghost btn-sm" onClick={() => setSignOut(true)}>Sign out</button>
      </div>

      <ConfirmModal open={signOut}
        title="Sign out of Saffron Lantern Almanac?"
        message="You'll need the passcode again on next visit."
        confirmText="Sign out"
        onCancel={() => setSignOut(false)}
        onConfirm={() => { setSignOut(false); doSignOut(); }} />
    </header>
  );
}

/* ── Default header derivation ─────────────────────────────────────── *
 * Single source of truth for crumb + title when a page doesn't pass its
 * own. Keeps AppShell from carrying its own copy of the same logic. */
export function deriveHeader(pathname: string | null): TopBarHeader {
  const p = pathname || '/';
  if (p === '/')                 return { crumb: 'Almanac',     title: 'Dashboard',  subtitle: 'Mission control' };
  if (p.startsWith('/studio'))   return { crumb: 'Almanac',     title: 'Studio',     subtitle: 'Campaign factory' };
  if (p.startsWith('/campaigns'))return { crumb: 'Almanac',     title: 'Campaigns',  subtitle: 'Plan library' };
  if (p.startsWith('/business')) return { crumb: 'Almanac',     title: 'Businesses', subtitle: 'Roster' };
  if (p.startsWith('/holidays')) return { crumb: 'Almanac',     title: 'Holidays',   subtitle: 'Catalogue' };
  if (p.startsWith('/settings')) return { crumb: 'Almanac',     title: 'Settings',   subtitle: 'Configuration' };
  return { crumb: 'Almanac', title: '—' };
}
