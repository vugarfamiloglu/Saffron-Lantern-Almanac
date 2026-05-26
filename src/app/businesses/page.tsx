'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/NavBar';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from '@/components/Toaster';

interface Biz {
  id: string; name: string; category: string | null; region: string | null;
  target_age_min: number | null; target_age_max: number | null;
  value_props: string | null; brand_voice: string | null;
  hashtag_seeds: string[]; created_at: number;
}

export default function BusinessesPage() {
  const [rows,    setRows]    = useState<Biz[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [edit,    setEdit]    = useState<Biz | null>(null);
  const [delId,   setDelId]   = useState<string | null>(null);

  useEffect(() => { refresh(); }, []);
  async function refresh() {
    const d = await fetch('/api/businesses').then((r) => r.json()).catch(() => ({ businesses: [] }));
    setRows(d.businesses || []);
  }
  async function confirmDelete() {
    if (!delId) return;
    await fetch(`/api/businesses/${delId}`, { method: 'DELETE' });
    setDelId(null); refresh(); toast('success', 'Business removed');
  }

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="label-eyebrow mb-2">Roster</div>
          <h1 className="heading-hero">Businesses.</h1>
          <p className="lede mt-3 max-w-2xl">
            Save a profile for each shop, café, or studio you run campaigns for. The almanac uses
            these as the briefing source — name, category, region, audience, brand voice.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add business</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.length === 0 && (
          <div className="col-span-full plate p-10 text-center" style={{ color: 'var(--ink-3)' }}>
            No saved businesses yet — add one to skip the ad-hoc fields on Studio.
          </div>
        )}
        {rows.map((b) => (
          <article key={b.id} className="plate p-5">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <h3 className="font-display font-semibold text-[18px] leading-tight">{b.name}</h3>
              <button className="text-ink-4 hover:text-error" onClick={() => setDelId(b.id)} title="Delete">×</button>
            </div>
            <div className="font-mono text-[11px]" style={{ color: 'var(--ink-3)' }}>
              {[b.category, b.region].filter(Boolean).join(' · ') || 'no category'}
            </div>
            {(b.target_age_min || b.target_age_max) && (
              <div className="text-[12px] mt-1.5" style={{ color: 'var(--sage)' }}>
                target · {b.target_age_min || 0}–{b.target_age_max || '∞'}
              </div>
            )}
            {b.value_props && <p className="text-[12.5px] mt-2.5 line-clamp-3" style={{ color: 'var(--ink-2)' }}>{b.value_props}</p>}
            {b.brand_voice && (
              <div className="mt-3 pt-3 border-t border-line">
                <div className="label-eyebrow mb-1">Voice</div>
                <p className="text-[12px] italic line-clamp-2" style={{ color: 'var(--ink-2)' }}>{b.brand_voice}</p>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-line flex gap-1">
              <button className="btn btn-ghost btn-sm" onClick={() => setEdit(b)}>Edit</button>
            </div>
          </article>
        ))}
      </div>

      <BusinessDialog open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); refresh(); }} />
      <BusinessDialog open={!!edit} biz={edit || undefined} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); refresh(); }} />

      <ConfirmModal open={!!delId}
        title="Delete this business?"
        message="Past campaigns stay in the library, but they lose the link to this profile."
        confirmText="Delete" destructive
        onCancel={() => setDelId(null)} onConfirm={confirmDelete} />
    </AppShell>
  );
}

function BusinessDialog({ open, biz, onClose, onSaved }: { open: boolean; biz?: Biz; onClose: () => void; onSaved: () => void }) {
  const [name,     setName]     = useState(biz?.name || '');
  const [category, setCategory] = useState(biz?.category || '');
  const [region,   setRegion]   = useState(biz?.region || '');
  const [ageMin,   setAgeMin]   = useState<string>(biz?.target_age_min?.toString() || '');
  const [ageMax,   setAgeMax]   = useState<string>(biz?.target_age_max?.toString() || '');
  const [props,    setProps]    = useState(biz?.value_props || '');
  const [voice,    setVoice]    = useState(biz?.brand_voice || '');
  const [tags,     setTags]     = useState((biz?.hashtag_seeds || []).join('\n'));
  const [busy,     setBusy]     = useState(false);

  useEffect(() => {
    if (open) {
      setName(biz?.name || ''); setCategory(biz?.category || ''); setRegion(biz?.region || '');
      setAgeMin(biz?.target_age_min?.toString() || ''); setAgeMax(biz?.target_age_max?.toString() || '');
      setProps(biz?.value_props || ''); setVoice(biz?.brand_voice || '');
      setTags((biz?.hashtag_seeds || []).join('\n'));
    }
  }, [open, biz]);

  async function save() {
    if (!name.trim()) { toast('warn', 'Name is required'); return; }
    setBusy(true);
    try {
      const body = JSON.stringify({
        name: name.trim(),
        category:   category.trim() || null,
        region:     region.trim() || null,
        target_age_min: ageMin ? Number(ageMin) : null,
        target_age_max: ageMax ? Number(ageMax) : null,
        value_props:    props.trim() || null,
        brand_voice:    voice.trim() || null,
        hashtag_seeds:  tags.split('\n').map((x) => x.trim()).filter(Boolean),
      });
      const res = biz
        ? await fetch(`/api/businesses/${biz.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body })
        : await fetch('/api/businesses', { method: 'POST', headers: { 'content-type': 'application/json' }, body });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      toast('success', biz ? 'Business updated' : 'Business saved');
      onSaved();
    } catch (e: any) { toast('error', e?.message || 'Save failed'); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title={biz ? 'Edit business' : 'Add a business'} actions={
      <>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? <><span className="spinner" /> Saving…</> : 'Save'}</button>
      </>
    }>
      <div className="grid grid-cols-2 gap-3">
        <div className="field"><label className="label-eyebrow">Name *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lavanda Café" /></div>
        <div className="field"><label className="label-eyebrow">Category</label>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="café · boutique · salon" /></div>
        <div className="field"><label className="label-eyebrow">Region</label>
          <input className="input" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Baku, AZ" /></div>
        <div className="field"><label className="label-eyebrow">Target age</label>
          <div className="flex gap-2">
            <input className="input" type="number" min="0" max="120" value={ageMin} onChange={(e) => setAgeMin(e.target.value)} placeholder="min" />
            <input className="input" type="number" min="0" max="120" value={ageMax} onChange={(e) => setAgeMax(e.target.value)} placeholder="max" />
          </div>
        </div>
      </div>
      <div className="field mt-3"><label className="label-eyebrow">Value props</label>
        <textarea className="textarea" rows={3} value={props} onChange={(e) => setProps(e.target.value)}
          placeholder="Lavender-syrup lattes · only café on the boulevard open till 1am · in-house pastry." /></div>
      <div className="field mt-3"><label className="label-eyebrow">Brand voice</label>
        <textarea className="textarea" rows={2} value={voice} onChange={(e) => setVoice(e.target.value)}
          placeholder="Warm, generous, locally rooted. Treats the customer like a regular." /></div>
      <div className="field mt-3"><label className="label-eyebrow">Hashtag seeds (one per line)</label>
        <textarea className="textarea" rows={3} value={tags} onChange={(e) => setTags(e.target.value)}
          placeholder={`#bakucafe\n#lavanda\n#novruzbaku`} style={{ minHeight: 90 }} /></div>
    </Modal>
  );
}
