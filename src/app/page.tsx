'use client';

/* Dashboard — at-a-glance state of the campaign year:
 *   - Upcoming holidays in the next ~90 days (countdown cards)
 *   - KPI tiles (campaigns drafted, posts produced, etc.)
 *   - Recent campaigns list */

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/NavBar';
import { HolidayCard } from '@/components/HolidayCard';
import { upcomingHolidays } from '@/lib/holidays';

interface CampaignRow {
  id: string; holiday_slug: string; holiday_label: string;
  starts_at: string | null; ends_at: string | null;
  objective: string | null; status: string;
  counts: { posts: number; stories: number; reels: number };
  narrative_preview: string;
  created_at: number;
}

export default function DashboardPage() {
  const [rows,   setRows]   = useState<CampaignRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/campaigns?limit=20').then((r) => r.json()).then((d) => {
      setRows(d.campaigns || []); setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const next = useMemo(() => upcomingHolidays(new Date(), 6), []);

  const totalCampaigns = rows.length;
  const totalAssets    = rows.reduce((s, r) => s + r.counts.posts + r.counts.stories + r.counts.reels, 0);
  const totalPosts     = rows.reduce((s, r) => s + r.counts.posts, 0);
  const totalReels     = rows.reduce((s, r) => s + r.counts.reels, 0);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="label-eyebrow mb-2">Mission control</div>
          <h1 className="heading-hero">Almanac.</h1>
          <p className="lede mt-3 max-w-2xl">
            Every holiday on the calendar, every campaign you&rsquo;ve drafted, in one place.
            Pick what&rsquo;s next from the lantern row and the Studio writes the full plan.
          </p>
        </div>
        <Link href="/studio" className="btn btn-primary">✶ New campaign</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="kpi"><div className="num">{totalCampaigns}</div><div className="lbl">Campaigns</div></div>
        <div className="kpi"><div className="num" style={{ color: 'var(--saffron)' }}>{totalAssets}</div><div className="lbl">Assets drafted</div></div>
        <div className="kpi"><div className="num" style={{ color: 'var(--plum)'    }}>{totalPosts}</div><div className="lbl">Posts</div></div>
        <div className="kpi"><div className="num" style={{ color: 'var(--sage)'    }}>{totalReels}</div><div className="lbl">Reels</div></div>
      </div>

      {/* Upcoming holidays */}
      <div className="ornament mb-4">upcoming on the almanac</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {next.map((h) => (
          <Link key={h.slug} href={`/studio?holiday=${encodeURIComponent(h.slug)}`} className="block">
            <HolidayCard
              slug={h.slug} label={h.label} native={h.native}
              date_pattern={h.date_pattern} culture={h.culture}
              audience={h.audience} palette={h.palette}
              daysAway={h.days_away} />
          </Link>
        ))}
      </div>

      {/* Recent campaigns */}
      <div className="ornament mb-4">recent campaigns</div>
      <section className="plate">
        {!loaded ? (
          <div className="py-12 text-center text-ink-3"><span className="spinner" /> Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center">
            <div className="font-display text-[20px]" style={{ color: 'var(--ink-2)' }}>No campaigns yet.</div>
            <div className="text-[13px] mt-1.5" style={{ color: 'var(--ink-3)' }}>
              Head to <Link href="/studio" className="underline" style={{ color: 'var(--saffron)' }}>Studio</Link> to draft your first one.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {rows.slice(0, 8).map((r) => (
              <li key={r.id}>
                <Link href={`/campaigns/${r.id}`} className="block px-5 py-4 hover:bg-paperSoft transition-colors">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="font-display font-semibold text-[16px]">{r.holiday_label}</div>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--ink-3)' }}>
                      {r.starts_at || '—'} → {r.ends_at || '—'} · {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.objective && <p className="text-[12.5px] italic mt-1" style={{ color: 'var(--ink-2)' }}>&ldquo;{r.objective}&rdquo;</p>}
                  <div className="mt-2 flex gap-2 text-[10.5px] font-mono uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                    <span style={{ color: 'var(--saffron)' }}>✎ {r.counts.posts} posts</span>
                    <span style={{ color: 'var(--sage)'    }}>◯ {r.counts.stories} stories</span>
                    <span style={{ color: 'var(--plum)'    }}>▷ {r.counts.reels} reels</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
