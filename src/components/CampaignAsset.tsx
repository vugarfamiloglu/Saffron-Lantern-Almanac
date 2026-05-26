'use client';
import { useState } from 'react';
import { toast } from './Toaster';

interface PostShape   { day: number; theme: string; hook: string; body: string; cta: string; hashtags: string[]; image_prompt: string; }
interface StoryShape  { day: number; type: string; overlay: string; body: string; }
interface ReelShape   { day: number; hook: string; beats: string; broll: string; }

type AnyAsset = (PostShape & { kind: 'post' })
              | (StoryShape & { kind: 'story' })
              | (ReelShape & { kind: 'reel' });

const KIND_STYLE: Record<string, { border: string; label: string; glyph: string }> = {
  post:   { border: 'var(--saffron)', label: 'POST',   glyph: '✎' },
  story:  { border: 'var(--sage)',    label: 'STORY',  glyph: '◯' },
  reel:   { border: 'var(--plum)',    label: 'REEL',   glyph: '▷' },
};

/** Render a post / story / reel as a card with copy-to-clipboard. */
export function CampaignAsset({ asset }: { asset: AnyAsset }) {
  const style = KIND_STYLE[asset.kind] || KIND_STYLE.post;

  function copy() {
    const text = asset.kind === 'post'
      ? `${asset.hook}\n\n${asset.body}\n\n${asset.cta}\n\n${asset.hashtags.join(' ')}`
      : asset.kind === 'story'
        ? `[${asset.type}] ${asset.overlay}\n${asset.body}`
        : `Hook: ${asset.hook}\nBeats:\n${asset.beats}\nB-roll: ${asset.broll}`;
    navigator.clipboard.writeText(text).then(
      () => toast('success', 'Copied to clipboard'),
      () => toast('error', 'Copy was blocked by the browser'),
    );
  }

  return (
    <article className="plate p-4" style={{ borderLeft: `3px solid ${style.border}` }}>
      <header className="flex items-baseline justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: style.border }}>
            {style.glyph} {style.label}
          </span>
          <span className="font-mono text-[10.5px]" style={{ color: 'var(--ink-3)' }}>day {asset.day}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={copy}>Copy</button>
      </header>

      {asset.kind === 'post' && <PostBody p={asset} />}
      {asset.kind === 'story' && <StoryBody s={asset} />}
      {asset.kind === 'reel'  && <ReelBody  r={asset} />}
    </article>
  );
}

function PostBody({ p }: { p: PostShape }) {
  return (
    <>
      <div className="label-eyebrow mb-1">Theme · {p.theme}</div>
      <div className="font-display text-[16px] font-semibold mb-2" style={{ color: 'var(--ink-1)' }}>&ldquo;{p.hook}&rdquo;</div>
      <p className="text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--ink-2)' }}>{p.body}</p>
      {p.cta && <div className="mt-2 text-[12.5px] italic" style={{ color: 'var(--plum)' }}>→ {p.cta}</div>}
      {p.hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap">
          {p.hashtags.map((t, i) => <span key={i} className="hashtag-pill">{t}</span>)}
        </div>
      )}
      {p.image_prompt && (
        <details className="mt-3">
          <summary className="label-eyebrow cursor-pointer">Image prompt</summary>
          <p className="text-[11.5px] mt-1 font-mono" style={{ color: 'var(--ink-3)' }}>{p.image_prompt}</p>
        </details>
      )}
    </>
  );
}
function StoryBody({ s }: { s: StoryShape }) {
  return (
    <>
      <div className="label-eyebrow mb-1">{s.type.toUpperCase()}</div>
      <div className="font-display text-[16px] font-semibold mb-1" style={{ color: 'var(--ink-1)' }}>{s.overlay}</div>
      {s.body && <p className="text-[12.5px]" style={{ color: 'var(--ink-2)' }}>{s.body}</p>}
    </>
  );
}
function ReelBody({ r }: { r: ReelShape }) {
  return (
    <>
      <div className="font-display text-[16px] font-semibold mb-2" style={{ color: 'var(--ink-1)' }}>Hook · &ldquo;{r.hook}&rdquo;</div>
      <div className="label-eyebrow mb-1">Beats</div>
      <pre className="text-[12.5px] font-mono whitespace-pre-wrap mb-2" style={{ color: 'var(--ink-2)' }}>{r.beats}</pre>
      {r.broll && <>
        <div className="label-eyebrow mb-1">B-roll</div>
        <p className="text-[12.5px] italic" style={{ color: 'var(--ink-3)' }}>{r.broll}</p>
      </>}
    </>
  );
}
