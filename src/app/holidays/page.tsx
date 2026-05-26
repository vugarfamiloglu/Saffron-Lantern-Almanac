'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/NavBar';
import { HolidayCard } from '@/components/HolidayCard';
import { Modal } from '@/components/Modal';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from '@/components/Toaster';

interface Entry {
  id: string; slug: string; label: string; native: string | null;
  date_pattern: string; culture: string; audience: string; narrative: string;
  palette: { primary: string; accent: string };
  custom: boolean;
}

export default function HolidaysPage() {
  const [rows,    setRows]    = useState<Entry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [delId,   setDelId]   = useState<string | null>(null);
  const [filter,  setFilter]  = useState<'all'|'AZ'|'global'|'religious'|'seasonal'|'commerce'|'custom'>('all');

  useEffect(() => { refresh(); }, []);
  async function refresh() {
    const d = await fetch('/api/holidays').then((r) => r.json()).catch(() => ({ holidays: [] }));
    setRows(d.holidays || []);
  }
  async function confirmDelete() {
    if (!delId) return;
    await fetch(`/api/holidays/${delId}`, { method: 'DELETE' });
    setDelId(null); refresh(); toast('success', 'Holiday removed');
  }

  const filtered = rows.filter((r) => filter === 'all' ? true : filter === 'custom' ? r.custom : r.culture === filter);

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="label-eyebrow mb-2">Catalogue</div>
          <h1 className="heading-hero">Holidays.</h1>
          <p className="lede mt-3 max-w-2xl">
            20 built-in occasions tuned for Azerbaijani + universal commerce. Add your own for
            local events the almanac doesn&rsquo;t know about — the launch of your new flagship,
            an anniversary, a religious observance the prompt should respect.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add custom</button>
      </div>

      <div className="plate p-3 mb-6 flex flex-wrap items-center gap-1.5">
        <span className="label-eyebrow mr-1">Culture</span>
        {(['all','AZ','global','religious','seasonal','commerce','custom'] as const).map((f) => (
          <button key={f} className="btn btn-sm" onClick={() => setFilter(f)}
            style={filter === f ? { borderColor: 'var(--saffron)', color: 'var(--saffron)' } : undefined}>
            {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((h) => (
          <div key={h.id} className="relative">
            <Link href={`/studio?holiday=${encodeURIComponent(h.slug)}`}>
              <HolidayCard slug={h.slug} label={h.label} native={h.native}
                date_pattern={h.date_pattern} culture={h.custom ? 'custom · ' + h.culture : h.culture}
                audience={h.audience} palette={h.palette} />
            </Link>
            {h.custom && (
              <button className="btn btn-danger btn-sm absolute top-3 right-3" onClick={() => setDelId(h.id)} title="Delete">×</button>
            )}
          </div>
        ))}
      </div>

      <AddHolidayDialog open={showAdd} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); refresh(); }} />
      <ConfirmModal open={!!delId}
        title="Delete this custom holiday?"
        message="Built-in holidays cannot be deleted. Past campaigns referencing this one keep their data."
        confirmText="Delete" destructive
        onCancel={() => setDelId(null)} onConfirm={confirmDelete} />
    </AppShell>
  );
}

function AddHolidayDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [label, setLabel] = useState('');
  const [date, setDate]   = useState('');
  const [culture, setCulture] = useState('global');
  const [audience, setAudience] = useState('');
  const [narrative, setNarrative] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) { setLabel(''); setDate(''); setCulture('global'); setAudience(''); setNarrative(''); } }, [open]);

  async function save() {
    if (!label.trim()) { toast('warn', 'Label is required'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/holidays', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          label: label.trim(),
          date_pattern: date.trim() || undefined,
          culture,
          audience: audience.trim() || undefined,
          narrative: narrative.trim() || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      toast('success', 'Holiday added'); onSaved();
    } catch (e: any) { toast('error', e?.message || 'Save failed'); }
    finally { setBusy(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a custom holiday" actions={
      <>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={save} disabled={busy}>{busy ? <><span className="spinner" /> Saving…</> : 'Save'}</button>
      </>
    }>
      <div className="field"><label className="label-eyebrow">Label *</label>
        <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Anniversary, regional festival, …" /></div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="field"><label className="label-eyebrow">Date pattern</label>
          <input className="input" value={date} onChange={(e) => setDate(e.target.value)} placeholder="MM-DD or YYYY-MM-DD or 'movable'" /></div>
        <div className="field"><label className="label-eyebrow">Culture</label>
          <select className="select" value={culture} onChange={(e) => setCulture(e.target.value)}>
            <option value="AZ">AZ — Azerbaijani</option>
            <option value="global">Global</option>
            <option value="religious">Religious</option>
            <option value="seasonal">Seasonal</option>
            <option value="commerce">Commerce</option>
          </select>
        </div>
      </div>
      <div className="field mt-3"><label className="label-eyebrow">Audience cue</label>
        <textarea className="textarea" rows={2} value={audience} onChange={(e) => setAudience(e.target.value)}
          placeholder="Who this primarily speaks to." /></div>
      <div className="field mt-3"><label className="label-eyebrow">Narrative seed</label>
        <textarea className="textarea" rows={3} value={narrative} onChange={(e) => setNarrative(e.target.value)}
          placeholder="A paragraph the AI will extend — what the holiday means, its rhythm, what tone works." style={{ minHeight: 100 }} /></div>
    </Modal>
  );
}
