'use client';

/* /studio — the campaign factory workspace.
 *
 *   1. Pick a holiday (from the catalogue grid OR pre-selected via query)
 *   2. Pick a business profile (or fill an ad-hoc one)
 *   3. Write the objective + language + AI provider
 *   4. Press the lantern button — POST /api/generate
 *   5. On success, jump straight to /campaigns/<id>
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/NavBar';
import { HolidayCard } from '@/components/HolidayCard';
import { toast } from '@/components/Toaster';
import { HOLIDAYS, upcomingHolidays } from '@/lib/holidays';

interface BusinessRow {
  id: string; name: string; category: string | null; region: string | null;
  target_age_min: number | null; target_age_max: number | null;
  value_props: string | null; brand_voice: string | null;
  hashtag_seeds: string[];
}
interface ProviderRow { id: string; provider: 'openai'|'anthropic'|'gemini'; is_default: boolean; }

export default function StudioWrapper() {
  return <Suspense fallback={null}><StudioPage /></Suspense>;
}

function StudioPage() {
  const router = useRouter();
  const params = useSearchParams();
  const preselected = params.get('holiday');

  const [holidaySlug, setHolidaySlug] = useState<string>(preselected || '');
  const [businesses,  setBusinesses]  = useState<BusinessRow[]>([]);
  const [businessId,  setBusinessId]  = useState<string>('');
  const [keys,        setKeys]        = useState<ProviderRow[]>([]);
  const [provider,    setProvider]    = useState<'openai'|'anthropic'|'gemini'>('openai');
  const [language,    setLanguage]    = useState<'en'|'az'|'ru'|'tr'>('en');
  const [objective,   setObjective]   = useState('Drive in-store visits and online orders during the holiday window.');

  /* ad-hoc fields when the user has no saved business */
  const [adhocName,   setAdhocName]    = useState('');
  const [adhocCat,    setAdhocCat]     = useState('');
  const [adhocRegion, setAdhocRegion]  = useState('');
  const [adhocAgeMin, setAdhocAgeMin]  = useState<string>('');
  const [adhocAgeMax, setAdhocAgeMax]  = useState<string>('');
  const [adhocProps,  setAdhocProps]   = useState('');

  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/businesses').then((r) => r.json()).then((d) => setBusinesses(d.businesses || [])).catch(() => {});
    fetch('/api/providers').then((r) => r.json()).then((d) => {
      const list = (d.keys || []) as ProviderRow[];
      setKeys(list);
      const def = list.find((k) => k.is_default) || list[0];
      if (def) setProvider(def.provider);
    }).catch(() => {});
  }, []);

  const upcoming = useMemo(() => upcomingHolidays(new Date(), 9), []);
  const allHolidays = useMemo(() => {
    /* Move pre-selected (if any) to the top, then upcoming, then the rest. */
    const seen = new Set<string>();
    const out: typeof HOLIDAYS[number][] = [];
    const push = (slug: string) => {
      if (seen.has(slug)) return;
      const h = HOLIDAYS.find((x) => x.slug === slug);
      if (h) { seen.add(slug); out.push(h); }
    };
    if (preselected) push(preselected);
    upcoming.forEach((u) => push(u.slug));
    HOLIDAYS.forEach((h) => push(h.slug));
    return out;
  }, [preselected, upcoming]);

  const hasProvider = keys.some((k) => k.provider === provider);
  const holiday = HOLIDAYS.find((h) => h.slug === holidaySlug);
  const usingAdhoc = !businessId;
  const adhocOk = !!adhocName.trim();
  const canGenerate = !!holidaySlug && hasProvider && (businessId || adhocOk) && !!objective.trim();

  async function generate() {
    if (!canGenerate) return;
    setBusy(true); setStage('writing the brief…');
    try {
      const body: any = {
        holiday_slug: holidaySlug,
        provider, language,
        objective: objective.trim(),
      };
      if (businessId) body.business_id = businessId;
      else body.business = {
        name:        adhocName.trim(),
        category:    adhocCat.trim() || undefined,
        region:      adhocRegion.trim() || undefined,
        target_age: {
          min: adhocAgeMin ? Number(adhocAgeMin) : undefined,
          max: adhocAgeMax ? Number(adhocAgeMax) : undefined,
        },
        value_props: adhocProps.trim() || undefined,
      };
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      toast('success', `Campaign ready · ${d.meta?.provider} · ${d.meta?.latency_ms}ms`);
      router.push(`/campaigns/${d.id}`);
    } catch (e: any) {
      toast('error', e?.message || 'Generation failed');
      setBusy(false); setStage(null);
    }
  }

  return (
    <AppShell>
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="label-eyebrow mb-2">Campaign factory</div>
          <h1 className="heading-hero">Studio.</h1>
          <p className="lede mt-3 max-w-2xl">
            Pick a holiday from the lantern row, point at the business you&rsquo;re running it for,
            state the goal in one sentence. The almanac writes the rest — 10 posts, 10 stories,
            3 reels, offers, and the numbers to chase.
          </p>
        </div>
      </div>

      {/* Step 1 — Holiday */}
      <div className="ornament mb-4">01 · pick a holiday</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 max-h-[460px] overflow-auto scroll-y plate-soft p-4">
        {allHolidays.map((h) => (
          <HolidayCard key={h.slug}
            slug={h.slug} label={h.label} native={h.native}
            date_pattern={h.date_pattern} culture={h.culture}
            audience={h.audience} palette={h.palette}
            active={holidaySlug === h.slug}
            onPick={() => setHolidaySlug(h.slug)} />
        ))}
      </div>

      {/* Step 2 — Business */}
      <div className="ornament mb-4">02 · who is this for?</div>
      <div className="plate p-5 mb-8">
        <div className="field">
          <label className="label-eyebrow">Saved business</label>
          <select className="select" value={businessId} onChange={(e) => setBusinessId(e.target.value)}>
            <option value="">— use an ad-hoc one (fill below) —</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}{b.category ? ` · ${b.category}` : ''}{b.region ? ` · ${b.region}` : ''}</option>
            ))}
          </select>
        </div>

        {usingAdhoc && (
          <div className="mt-4 plate-soft p-4 grid sm:grid-cols-2 gap-3">
            <div className="field"><label className="label-eyebrow">Name *</label>
              <input className="input" value={adhocName} onChange={(e) => setAdhocName(e.target.value)} placeholder="Lavanda Café" /></div>
            <div className="field"><label className="label-eyebrow">Category</label>
              <input className="input" value={adhocCat} onChange={(e) => setAdhocCat(e.target.value)} placeholder="café · boutique · salon" /></div>
            <div className="field"><label className="label-eyebrow">Region</label>
              <input className="input" value={adhocRegion} onChange={(e) => setAdhocRegion(e.target.value)} placeholder="Baku, AZ" /></div>
            <div className="field">
              <label className="label-eyebrow">Target age</label>
              <div className="flex gap-2">
                <input className="input" type="number" min="0" max="120" value={adhocAgeMin} onChange={(e) => setAdhocAgeMin(e.target.value)} placeholder="min" />
                <input className="input" type="number" min="0" max="120" value={adhocAgeMax} onChange={(e) => setAdhocAgeMax(e.target.value)} placeholder="max" />
              </div>
            </div>
            <div className="field sm:col-span-2"><label className="label-eyebrow">Value props</label>
              <textarea className="textarea" rows={2} value={adhocProps} onChange={(e) => setAdhocProps(e.target.value)}
                placeholder="What makes this business different — three bullets is enough." /></div>
          </div>
        )}
      </div>

      {/* Step 3 — Objective + provider */}
      <div className="ornament mb-4">03 · objective + voice</div>
      <div className="plate p-5 mb-8">
        <div className="field">
          <label className="label-eyebrow">Campaign objective *</label>
          <textarea className="textarea" rows={2} value={objective} onChange={(e) => setObjective(e.target.value)}
            placeholder="Raise weekend foot-traffic by 50% in the first week after Novruz." />
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div className="field">
            <label className="label-eyebrow">Language</label>
            <select className="select" value={language} onChange={(e) => setLanguage(e.target.value as any)}>
              <option value="en">English</option>
              <option value="az">Azerbaijani</option>
              <option value="ru">Russian</option>
              <option value="tr">Turkish</option>
            </select>
          </div>
          <div className="field">
            <label className="label-eyebrow">AI provider</label>
            <select className="select" value={provider} onChange={(e) => setProvider(e.target.value as any)}>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="gemini">Google Gemini</option>
            </select>
            {!hasProvider && <p className="text-[11.5px] mt-1" style={{ color: 'var(--warn)' }}>
              No {provider} key — add one in <a className="underline" href="/settings">Settings</a>.
            </p>}
          </div>
          <div className="field">
            <label className="label-eyebrow">Holiday seed</label>
            <div className="input flex items-center" style={{ background: 'var(--paper-soft)' }}>
              {holiday ? <span>{holiday.label}{holiday.native ? ` · ${holiday.native}` : ''}</span> : <span style={{ color: 'var(--ink-4)' }}>— pick a holiday above —</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Generate */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-12">
        <div className="text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
          {canGenerate ? 'Ready to light the lantern.' : 'Fill the highlighted bits to unlock the generator.'}
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={!canGenerate || busy}>
          {busy ? <><span className="spinner" /> {stage || 'Generating…'}</> : '✶ Light the lantern → generate'}
        </button>
      </div>
    </AppShell>
  );
}
