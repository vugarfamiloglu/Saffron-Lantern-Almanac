'use client';

interface Props {
  /* the campaign window length, default 30 */
  days?: number;
  /* days that contain a post, story, or reel */
  posts?:   number[];
  stories?: number[];
  reels?:   number[];
  onPick?:  (day: number) => void;
  active?:  number;
}

/* Two-row grid: 15 cells per row. Each day shows its number + a colour
 * coding for what content lives there. A "multi" day (post + story or
 * post + reel) gets a gradient fill. */
export function CalendarStrip({ days = 30, posts = [], stories = [], reels = [], onPick, active }: Props) {
  const setP = new Set(posts);
  const setS = new Set(stories);
  const setR = new Set(reels);

  return (
    <div className="calendar-strip">
      {Array.from({ length: days }).map((_, i) => {
        const day = i + 1;
        const hasP = setP.has(day);
        const hasS = setS.has(day);
        const hasR = setR.has(day);
        const count = (hasP ? 1 : 0) + (hasS ? 1 : 0) + (hasR ? 1 : 0);
        let cls = 'cal-cell';
        if (count >= 2) cls += ' has-multi';
        else if (hasR)  cls += ' has-reel';
        else if (hasP)  cls += ' has-post';
        else if (hasS)  cls += ' has-story';
        if (active === day) cls += ' is-active';
        return (
          <button key={day}
            type="button"
            className={cls}
            onClick={onPick ? () => onPick(day) : undefined}
            style={active === day ? { outline: '2px solid var(--saffron)', outlineOffset: 1 } : undefined}>
            <div className="day">{day}</div>
            {hasP && hasS && hasR && <div className="mark" style={{ background: 'var(--plum)' }} />}
          </button>
        );
      })}
    </div>
  );
}
