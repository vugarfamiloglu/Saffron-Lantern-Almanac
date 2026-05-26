'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/NavBar';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from '@/components/Toaster';

interface Row {
  id: string; holiday_slug: string; holiday_label: string;
  starts_at: string | null; ends_at: string | null;
  objective: string | null; status: string;
  counts: { posts: number; stories: number; reels: number };
  narrative_preview: string;
  created_at: number;
}

export default function CampaignsListPage() {
  const [rows, setRows]   = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [delId, setDelId]   = useState<string | null>(null);
  const [query, setQuery]   = useState('');

  useEffect(() => { refresh(); }, []);
  async function refresh() {
    const d = await fetch('/api/campaigns?limit=200').then((r) => r.json()).catch(() => ({ campaigns: [] }));
    setRows(d.campaigns || []); setLoaded(true);
  }
  async function confirmDelete() {
    if (!delId) return;
    await fetch(`/api/campaigns/${delId}`, { method: 'DELETE' });
    setDelId(null); refresh(); toast('success', 'Campaign removed');
  }

  const filtered = rows.filter((r) => !query || `${r.holiday_label} ${r.objective || ''} ${r.narrative_preview}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="label-eyebrow mb-2">Library</div>
          <h1 className="heading-hero">Campaigns.</h1>
          <p className="lede mt-3 max-w-2xl">
            Every campaign the almanac has written, ready to re-open, share, or recycle into next year.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input className="input" style={{ width: 240 }} placeholder="search campaigns…"
            value={query} onChange={(e) => setQuery(e.target.value)} />
          <Link href="/studio" className="btn btn-primary">+ New</Link>
        </div>
      </div>

      <section className="plate">
        {!loaded ? (
          <div className="py-12 text-center text-ink-3"><span className="spinner" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <div className="font-display text-[20px]" style={{ color: 'var(--ink-2)' }}>
              {rows.length === 0 ? 'No campaigns yet.' : 'No matches for that search.'}
            </div>
            {rows.length === 0 && (
              <Link href="/studio" className="btn btn-ghost mt-4">Open the Studio →</Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((r) => (
              <li key={r.id} className="px-5 py-4 flex items-start gap-4 hover:bg-paperSoft transition-colors">
                <Link href={`/campaigns/${r.id}`} className="grow min-w-0">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="font-display font-semibold text-[17px]">{r.holiday_label}</div>
                    <span className="font-mono text-[11px]" style={{ color: 'var(--ink-3)' }}>
                      {r.starts_at || '—'} → {r.ends_at || '—'}
                    </span>
                  </div>
                  {r.objective && <p className="text-[12.5px] italic mt-1" style={{ color: 'var(--ink-2)' }}>&ldquo;{r.objective}&rdquo;</p>}
                  {r.narrative_preview && <p className="text-[12.5px] mt-1 line-clamp-2" style={{ color: 'var(--ink-3)' }}>{r.narrative_preview}</p>}
                  <div className="mt-2 flex gap-2 text-[10.5px] font-mono uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
                    <span style={{ color: 'var(--saffron)' }}>✎ {r.counts.posts}</span>
                    <span style={{ color: 'var(--sage)'    }}>◯ {r.counts.stories}</span>
                    <span style={{ color: 'var(--plum)'    }}>▷ {r.counts.reels}</span>
                    <span className="ml-auto">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
                <button className="btn btn-danger btn-sm" onClick={() => setDelId(r.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmModal open={!!delId}
        title="Delete this campaign?"
        message="The full plan + all 23 assets are removed. You can re-generate with the same inputs from Studio."
        confirmText="Delete" destructive
        onCancel={() => setDelId(null)} onConfirm={confirmDelete} />
    </AppShell>
  );
}
