'use client';

/* Campaign detail — narrative + offers + 30-day calendar strip + grouped asset cards. */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/NavBar';
import { CalendarStrip } from '@/components/CalendarStrip';
import { CampaignAsset } from '@/components/CampaignAsset';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from '@/components/Toaster';

interface Detail {
  id: string;
  holiday_slug: string; holiday_label: string;
  starts_at: string | null; ends_at: string | null;
  objective: string | null; audience: string | null;
  narrative: string | null;
  offers:  Array<{ name: string; discount_pct: number | null; bundle: string | null; valid_until: string | null }>;
  posts:   Array<any>; stories: Array<any>; reels: Array<any>;
  kpis:    { primary?: string; secondary?: string[]; north_star?: string } | null;
  provider: string | null; model: string | null;
  status: string; starred: boolean;
  created_at: number; generated_at: number | null;
}

type Tab = 'overview' | 'posts' | 'stories' | 'reels';

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab,   setTab]    = useState<Tab>('overview');
  const [delSelf, setDelSelf] = useState(false);
  const [activeDay, setActiveDay] = useState<number | undefined>();

  useEffect(() => {
    fetch(`/api/campaigns/${id}`).then((r) => r.json()).then((d) => {
      if (d.error) { toast('error', d.error); setData(null); }
      else setData(d as Detail);
    }).finally(() => setLoaded(true));
  }, [id]);

  async function star() {
    if (!data) return;
    const v = !data.starred;
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ starred: v }),
    });
    setData({ ...data, starred: v });
  }
  async function setStatus(status: string) {
    if (!data) return;
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setData({ ...data, status });
    toast('success', `Marked ${status}`);
  }
  async function deleteSelf() {
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    setDelSelf(false);
    toast('success', 'Campaign removed');
    router.push('/campaigns');
  }

  if (!loaded) return <AppShell><div className="plate p-16 text-center text-ink-3"><span className="spinner" /> Loading…</div></AppShell>;
  if (!data)   return <AppShell><div className="plate p-16 text-center">
    <div className="font-display text-[20px]">Campaign not found.</div>
    <Link href="/campaigns" className="btn btn-ghost btn-sm mt-4">← Back to campaigns</Link>
  </div></AppShell>;

  const postsDays   = data.posts  .map((p) => p.day);
  const storiesDays = data.stories.map((s) => s.day);
  const reelsDays   = data.reels  .map((r) => r.day);
  const filterByDay = activeDay
    ? { posts: data.posts.filter((p) => p.day === activeDay), stories: data.stories.filter((s) => s.day === activeDay), reels: data.reels.filter((r) => r.day === activeDay) }
    : { posts: data.posts, stories: data.stories, reels: data.reels };

  return (
    <AppShell>
      <div className="mb-2">
        <Link href="/campaigns" className="label-eyebrow" style={{ color: 'var(--ink-3)' }}>← All campaigns</Link>
      </div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="label-eyebrow mb-2">{data.holiday_label}{data.starts_at && ` · ${data.starts_at} → ${data.ends_at || '—'}`}</div>
          <h1 className="heading-hero">{data.objective || data.holiday_label}.</h1>
          {data.audience && <p className="lede mt-3 max-w-2xl">{data.audience}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
            {data.provider && <span>{data.provider} · {data.model}</span>}
            <span>· status · {data.status}</span>
            {data.generated_at && <span>· generated {new Date(data.generated_at).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex gap-1">
          <button className="btn btn-ghost btn-sm" onClick={star} title="Star">
            <span style={{ color: data.starred ? 'var(--considering)' : 'var(--ink-4)' }}>{data.starred ? '★' : '☆'}</span>
          </button>
          {data.status !== 'approved' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus('approved')}>✓ Approve</button>}
          {data.status !== 'archived' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus('archived')}>Archive</button>}
          <button className="btn btn-danger btn-sm" onClick={() => setDelSelf(true)}>Delete</button>
        </div>
      </div>

      {/* Narrative + KPIs */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-6 mb-8">
        {data.narrative && (
          <article className="plate p-6">
            <div className="ornament mb-3">opening brief</div>
            <p className="drop-cap text-[14.5px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink-1)' }}>
              {data.narrative}
            </p>
          </article>
        )}
        <aside className="plate p-5">
          <div className="ornament mb-3">numbers to chase</div>
          {data.kpis?.north_star && (
            <div className="mb-3">
              <div className="label-eyebrow mb-1">North star</div>
              <div className="font-display text-[18px] font-semibold leading-tight" style={{ color: 'var(--saffron)' }}>
                {data.kpis.north_star}
              </div>
            </div>
          )}
          {data.kpis?.primary && (
            <div className="mb-3">
              <div className="label-eyebrow mb-1">Primary KPI</div>
              <div className="text-[13.5px]">{data.kpis.primary}</div>
            </div>
          )}
          {data.kpis?.secondary && data.kpis.secondary.length > 0 && (
            <div>
              <div className="label-eyebrow mb-1">Supporting</div>
              <ul className="text-[12.5px] space-y-1" style={{ color: 'var(--ink-2)' }}>
                {data.kpis.secondary.map((s, i) => <li key={i}>· {s}</li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {/* Offers */}
      {data.offers.length > 0 && (
        <>
          <div className="ornament mb-4">offers</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {data.offers.map((o, i) => (
              <div key={i} className="plate p-4" style={{ borderLeft: '3px solid var(--saffron)' }}>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-display font-semibold text-[16px]">{o.name}</div>
                  {o.discount_pct !== null && <span className="chip is-saffron">-{o.discount_pct}%</span>}
                </div>
                {o.bundle && <p className="text-[12.5px] mt-1" style={{ color: 'var(--ink-2)' }}>{o.bundle}</p>}
                {o.valid_until && <div className="text-[10.5px] font-mono mt-2" style={{ color: 'var(--ink-3)' }}>valid until {o.valid_until}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Calendar */}
      <div className="ornament mb-4">30-day calendar</div>
      <div className="plate p-5 mb-4">
        <CalendarStrip days={30}
          posts={postsDays} stories={storiesDays} reels={reelsDays}
          active={activeDay}
          onPick={(d) => setActiveDay(activeDay === d ? undefined : d)} />
        <div className="mt-3 flex gap-3 text-[10.5px] font-mono uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>
          <span style={{ color: 'var(--saffron)' }}>■ post</span>
          <span style={{ color: 'var(--sage)'    }}>■ story</span>
          <span style={{ color: 'var(--plum)'    }}>■ reel</span>
          <span>· click a day to filter the assets below</span>
          {activeDay && <button onClick={() => setActiveDay(undefined)} className="ml-auto underline" style={{ color: 'var(--saffron)' }}>clear filter</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-line mb-5 flex gap-6">
        {([
          ['overview', 'Overview'],
          ['posts',    `Posts · ${filterByDay.posts.length}`],
          ['stories',  `Stories · ${filterByDay.stories.length}`],
          ['reels',    `Reels · ${filterByDay.reels.length}`],
        ] as Array<[Tab, string]>).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-[13px] font-medium pb-2.5 border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-saffron' : 'border-transparent'
            }`}
            style={tab === t ? { color: 'var(--ink-1)', borderColor: 'var(--saffron)' } : { color: 'var(--ink-3)' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-4">
          {[...filterByDay.posts.slice(0,3).map((p) => ({ ...p, kind: 'post' as const })),
            ...filterByDay.stories.slice(0,3).map((s) => ({ ...s, kind: 'story' as const })),
            ...filterByDay.reels.slice(0,3).map((r) => ({ ...r, kind: 'reel' as const }))]
            .sort((a, b) => a.day - b.day)
            .map((asset, i) => <CampaignAsset key={`${asset.kind}-${i}`} asset={asset} />)}
        </div>
      )}
      {tab === 'posts' && (
        <div className="grid lg:grid-cols-2 gap-4">
          {filterByDay.posts.sort((a,b) => a.day - b.day).map((p, i) => (
            <CampaignAsset key={i} asset={{ ...p, kind: 'post' }} />
          ))}
        </div>
      )}
      {tab === 'stories' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filterByDay.stories.sort((a,b) => a.day - b.day).map((s, i) => (
            <CampaignAsset key={i} asset={{ ...s, kind: 'story' }} />
          ))}
        </div>
      )}
      {tab === 'reels' && (
        <div className="grid lg:grid-cols-2 gap-4">
          {filterByDay.reels.sort((a,b) => a.day - b.day).map((r, i) => (
            <CampaignAsset key={i} asset={{ ...r, kind: 'reel' }} />
          ))}
        </div>
      )}

      <ConfirmModal open={delSelf}
        title="Delete this campaign?"
        message="The plan + every post, story, and reel goes. This can't be undone — but you can re-generate from Studio."
        confirmText="Delete" destructive
        onCancel={() => setDelSelf(false)} onConfirm={deleteSelf} />
    </AppShell>
  );
}
