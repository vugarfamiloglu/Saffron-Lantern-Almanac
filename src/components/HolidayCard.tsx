'use client';

interface Props {
  slug:      string;
  label:     string;
  native?:   string | null;
  date_pattern?: string;
  culture?:  string;
  audience?: string;
  palette:   { primary: string; accent: string };
  daysAway?: number;
  onPick?:   () => void;
  active?:   boolean;
}
export function HolidayCard({
  slug, label, native, date_pattern, culture, audience, palette, daysAway, onPick, active,
}: Props) {
  return (
    <article
      onClick={onPick}
      className={`plate-velvet p-4 cursor-pointer transition-colors hover:bg-paperSoft`}
      style={{
        borderTopColor: palette.primary,
        boxShadow: active ? `0 0 0 2px ${palette.primary}` : undefined,
      }}>
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <h3 className="font-display font-semibold text-[18px] leading-tight">{label}</h3>
        {daysAway !== undefined && daysAway >= 0 && (
          <div className="countdown" style={{ color: palette.primary }}>
            <span className="num">{daysAway}</span>
            <span className="lbl">days</span>
          </div>
        )}
      </div>
      {native && <div className="font-mono text-[11px]" style={{ color: 'var(--ink-3)' }}>{native}</div>}
      {culture && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider" style={{ color: palette.accent }}>
          <span>·</span><span>{culture}</span>
          {date_pattern && <><span>·</span><span>{date_pattern}</span></>}
        </div>
      )}
      {audience && <p className="text-[12.5px] mt-3 line-clamp-2" style={{ color: 'var(--ink-2)' }}>{audience}</p>}
    </article>
  );
}
