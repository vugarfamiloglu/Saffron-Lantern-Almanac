'use client';

/* AppShell — sidebar + sticky TopBar + main workbench.
 *
 * The sidebar now carries the brand mark + nav links only. ThemeToggle
 * and sign-out moved into the TopBar so they're always at hand
 * regardless of how far the user has scrolled. */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { Brand } from './Brand';
import { TopBar, deriveHeader, type TopBarHeader } from './TopBar';

const NAV: Array<{ href: string; label: string; glyph: string }> = [
  { href: '/',           label: 'Dashboard',  glyph: '◎' },
  { href: '/studio',     label: 'Studio',     glyph: '✶' },
  { href: '/campaigns',  label: 'Campaigns',  glyph: '❦' },
  { href: '/businesses', label: 'Businesses', glyph: '☖' },
  { href: '/holidays',   label: 'Holidays',   glyph: '⌘' },
  { href: '/settings',   label: 'Settings',   glyph: '⚙' },
];

interface Props {
  children: ReactNode;
  /* Optional per-page override. When omitted, the TopBar derives
   * crumb + title from the current pathname. */
  header?: TopBarHeader;
}

export function AppShell({ children, header }: Props) {
  const path = usePathname();
  const effective: TopBarHeader = { ...deriveHeader(path), ...(header || {}) };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="px-1 mb-6"><Brand /></div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => {
            const active = n.href === '/' ? path === '/' : path?.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className={`sidebar-link ${active ? 'is-active' : ''}`}>
                <span className="glyph">{n.glyph}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-line">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--ink-4)' }}>
            campaign · factory
          </div>
        </div>
      </aside>

      <TopBar header={effective} />

      <main className="workbench">{children}</main>
    </div>
  );
}
