# Saffron Lantern Almanac

> AI campaign factory for local businesses. Pick a holiday — Novruz, 8 Mart,
> Ramazan, Black Friday, anything on the almanac — point at your business,
> state the goal in one sentence. The lantern lights and you walk away with
> a complete 30-day plan: **10 posts · 10 stories · 3 reels · 3-5 offers ·
> measurable KPIs**, every line written in your brand voice and ready to ship.

```
┌─ Saffron Lantern Almanac · "Bazaar Velvet" ────────────────────────────┐
│ ◎ Dashboard      upcoming on the almanac                                │
│ ✶ Studio          ┌── Novruz ──┐  ┌── 8 Mart ──┐  ┌── Ramazan ──┐       │
│ ❦ Campaigns       │  18 days   │  │  6 days    │  │  movable    │       │
│ ☖ Businesses      └────────────┘  └────────────┘  └─────────────┘       │
│ ⌘ Holidays                                                              │
│ ⚙ Settings       ──── recent campaigns ────────────────────────────     │
│                  Novruz 2026 · Lavanda Café                             │
│                  "Drive weekend foot-traffic by 50%"                    │
│                  ✎ 10 posts · ◯ 10 stories · ▷ 3 reels                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Why

Local businesses lose two weeks every quarter agonising over "what should
we post for [holiday]?" — then end up with three rushed Instagram tiles
and one half-baked reel.

Saffron Lantern Almanac collapses that into **one click**:

1. **Pick a holiday** from the lantern grid (Novruz, 8 Mart, Ramazan,
   Qurban, Black Friday, Mother's Day — 20 built-ins + your own).
2. **Pick a business profile** (or fill 5 fields once for an ad-hoc run).
3. **State the goal in one sentence** — *"Raise weekend foot-traffic by 50%"*.
4. **Light the lantern** — one LLM call produces a strict-JSON 30-day plan.

You bring your own AI key. The almanac never leaves your machine until
you initiate that one call.

## How it works

| Stage | What happens |
|---|---|
| **Pick a holiday** | The catalogue ships 20 entries — Azerbaijani (Novruz, 8 Mart, Qurban, 28 May, Müəllim Günü, 9 Noyabr, Solidarlıq) + universal (Valentine's, Mothers/Fathers, Christmas, New Year, Halloween) + commerce (Black Friday, Cyber Monday) + seasonal (Spring Sale, Summer Kickoff, Autumn Harvest, Back-to-School). Each carries a narrative seed + palette hint the prompt uses. |
| **Pick a business** | Saved profile (name, category, region, target age, value props, brand voice, hashtag seeds) — or one-off, fill the same fields in Studio without saving. |
| **One model call** | `buildCampaignPrompt()` (shared between the live preview and the API) constructs a strict-JSON instruction with the chosen brand voice + cultural narrative. OpenAI / Anthropic / Gemini all called the same way. |
| **Coerce** | `coerceCampaignResult()` normalises every field — emotion labels, dates, day numbers, hashtag lengths — so the UI only sees safe values. |
| **Persist** | One row in `campaigns` — full plan in JSON columns. The detail page renders the 30-day calendar strip + tabbed asset cards. |

## Quick start

```bash
git clone <repo>
cd "Saffron Lantern Almanac"
npm install
cp .env.example .env.local         # optional — defaults work
npm run dev                        # → http://localhost:5454
```

First visit:

1. **Lock screen** — default passcode `lantern-2026` (change via
   `SLA_PASSCODE_HASH`).
2. **Settings → + Add provider key** — paste an OpenAI, Anthropic, or
   Google Gemini key. Each is AES-256-GCM encrypted with a per-install
   vault key.
3. **Businesses → + Add business** *(optional)* — save the shop/café you
   keep running campaigns for. Skip if you want to use ad-hoc input.
4. **Studio → pick a holiday → state the goal → ✶ Light the lantern**.

## The 20 built-in holidays

| Slug | Label | Culture | Date hint |
|---|---|---|---|
| `novruz`         | Novruz Bayramı                 | AZ        | Mar 20 |
| `8-mart`         | International Women's Day · 8 Mart | AZ    | Mar 8 |
| `ramazan`        | Ramadan / Iftar Season         | religious | movable |
| `qurban`         | Eid al-Adha · Qurban           | religious | movable |
| `respublika-gunu`| Republic Day · 28 May          | AZ        | May 28 |
| `qelebe-gunu`    | Victory Day · Qələbə Günü      | AZ        | Nov 8 |
| `mueallim-gunu`  | Teachers' Day                  | AZ        | Oct 5 |
| `solidarliq`     | Solidarity Day of Azerbaijanis | AZ        | Dec 31 |
| `new-year`       | New Year                       | global    | Dec 31 |
| `valentines`     | Valentine's Day                | global    | Feb 14 |
| `mothers-day`    | Mother's Day                   | global    | movable |
| `fathers-day`    | Father's Day                   | global    | movable |
| `halloween`      | Halloween                      | global    | Oct 31 |
| `christmas`      | Christmas                      | global    | Dec 25 |
| `black-friday`   | Black Friday                   | commerce  | movable |
| `cyber-monday`   | Cyber Monday                   | commerce  | movable |
| `back-to-school` | Back to School                 | seasonal  | movable |
| `spring-sale`    | Spring Sale                    | seasonal  | Mar 15 |
| `summer-kickoff` | Summer Kickoff                 | seasonal  | Jun 1 |
| `autumn-harvest` | Autumn Harvest                 | seasonal  | Sep 23 |

Each entry carries an `audience` cue + a `narrative` seed paragraph that
the AI extends. Add your own via **Holidays → + Add custom** when a
local event, anniversary, or industry day isn't covered.

## What the AI returns

For every campaign, a strict-JSON object:

```jsonc
{
  "title":     "Novruz 2026 · Lavanda Café",
  "starts_at": "2026-03-13",
  "ends_at":   "2026-04-06",
  "narrative": "<2-4 paragraph opening brief, drop-cap-worthy>",
  "audience":  "<refined target audience>",
  "offers":    [3-5 items, { name, discount_pct, bundle, valid_until }],
  "posts":     [10 items, { day, theme, hook, body, cta, hashtags[], image_prompt }],
  "stories":   [10 items, { day, type, overlay, body }],
  "reels":     [3 items,  { day, hook, beats, broll }],
  "kpis":      { primary, secondary[], north_star }
}
```

The campaign detail page renders this as:

- **Drop-cap narrative** — the opening brief on the left
- **KPI panel** — north star + primary + supporting metrics on the right
- **Offer cards** — discount + bundle + validity
- **30-day calendar strip** — colour-coded cells (saffron = post, sage =
  story, plum = reel, gradient = multi). Click a day to filter the asset
  tabs to that single day.
- **Tabbed assets** — Overview / Posts / Stories / Reels with copy
  buttons on every card.

## Architecture

```
Saffron Lantern Almanac/
├── src/
│   ├── app/
│   │   ├── page.tsx                       Dashboard (countdown + KPIs + recent)
│   │   ├── studio/page.tsx                Studio (the generator workspace)
│   │   ├── campaigns/page.tsx             Library list
│   │   ├── campaigns/[id]/page.tsx        Campaign detail + calendar + assets
│   │   ├── businesses/page.tsx            Business profile CRUD
│   │   ├── holidays/page.tsx              Holiday catalogue (built-in + custom)
│   │   ├── settings/page.tsx              Provider key CRUD + test
│   │   ├── login/page.tsx                 Lock screen
│   │   ├── layout.tsx                     Root layout + theme bootstrap
│   │   ├── globals.css                    "Bazaar Velvet" tokens (light + dark)
│   │   └── api/
│   │       ├── auth/route.ts                       passcode → session cookie
│   │       ├── generate/route.ts                   THE campaign generator
│   │       ├── campaigns/route.ts                  GET list (with counts)
│   │       ├── campaigns/[id]/route.ts             GET / PATCH (star/status) / DELETE
│   │       ├── businesses/route.ts                 GET / POST
│   │       ├── businesses/[id]/route.ts            GET / PATCH / DELETE
│   │       ├── holidays/route.ts                   GET (merged built-in + custom) / POST custom
│   │       ├── holidays/[id]/route.ts              DELETE custom (built-ins read-only)
│   │       ├── providers/route.ts                  GET / POST encrypted key
│   │       ├── providers/[id]/route.ts             PATCH default / DELETE
│   │       └── providers/test/route.ts             round-trip a key
│   ├── components/
│   │   ├── Brand · Logo                   wordmark + festival-lantern SVG
│   │   ├── NavBar                         sidebar shell + ThemeToggle + sign-out
│   │   ├── HolidayCard                    countdown + palette-tinted top border
│   │   ├── CalendarStrip                  30-day grid with content-type colouring
│   │   ├── CampaignAsset                  unified post / story / reel card + copy
│   │   ├── Modal · ConfirmModal · PromptModal   portal-rendered, ESC-closable
│   │   ├── PasswordInput                  show/hide eye toggle
│   │   ├── ThemeToggle                    Light ⇄ Dark, persisted to localStorage
│   │   └── Toaster                        4-kind toast pubsub
│   ├── lib/
│   │   ├── db.ts                          better-sqlite3 + typed helpers
│   │   ├── crypto.ts                      AES-256-GCM vault
│   │   ├── auth.ts                        bcrypt + Web Crypto HMAC (Edge-safe)
│   │   ├── holidays.ts                    20-entry catalogue + upcoming projector
│   │   ├── campaign.ts                    prompt builder + JSON schema + coercion
│   │   └── providers/
│   │       ├── index.ts                   chatJson() dispatcher + defaults
│   │       ├── openai.ts                  chat completions (json_object)
│   │       ├── anthropic.ts               messages API (system-instructed JSON)
│   │       └── gemini.ts                  generateContent (json mime)
│   └── middleware.ts                      gate every page + /api/* behind /login
├── data/                                  SQLite + .vault-key (gitignored)
├── public/                                logo.svg, favicon.svg
├── package.json · tsconfig.json · next.config.mjs
├── tailwind.config.ts · postcss.config.js
├── .env.example                           keys + secrets template
├── LICENSE                                Apache 2.0
└── README.md                              this file
```

## REST surface

| Method | Path | Purpose |
|---|---|---|
| `POST`   | `/api/auth`              | passcode → session cookie |
| `DELETE` | `/api/auth`              | sign out |
| `POST`   | `/api/generate`          | THE campaign factory call |
| `GET`    | `/api/campaigns`         | list with `counts: {posts, stories, reels}` |
| `GET / PATCH / DELETE` | `/api/campaigns/:id` | open / star+status / delete |
| `GET / POST` | `/api/businesses`   | list / save profile |
| `GET / PATCH / DELETE` | `/api/businesses/:id` | open / edit / delete |
| `GET / POST` | `/api/holidays`     | merged catalogue / add custom |
| `DELETE` | `/api/holidays/:id`      | delete custom (built-ins read-only) |
| `GET / POST` | `/api/providers`    | list / add encrypted key |
| `PATCH / DELETE` | `/api/providers/:id` | default / delete |
| `POST`   | `/api/providers/test`    | round-trip a key |

## Provider keys

| Provider | Where to get a key | Default model |
|---|---|---|
| OpenAI | https://platform.openai.com/api-keys | `gpt-4o-mini` |
| Anthropic | https://console.anthropic.com/settings/keys | `claude-sonnet-4-5` |
| Google Gemini | https://aistudio.google.com/apikey | `gemini-2.0-flash` |

Keys are AES-256-GCM-encrypted with a 32-byte secret from
`SLA_VAULT_KEY` (or auto-generated to `data/.vault-key` with `0600` perms
on first boot).

## Theme — "Bazaar Velvet"

Light by default — warm ivory paper + saffron-gold accent + deep plum
details + soft sage. Dark mode flips to deep velvet wine for late-night
drafting. Both keep the same accent palette.

- **Display** — Playfair Display (high-contrast, characterful serif)
- **Body** — Inter
- **Mono / labels** — JetBrains Mono
- **Accent** — saffron `#c89c3a` · plum `#7a3f5a` · sage `#6b8e6e`

Each holiday card carries its own top-border tint from the holiday's
palette hint — Novruz reads as gold-on-plum, 8 Mart as crimson-on-gold,
Halloween as burnt-orange-on-ink.

## Safety

- Every page + `/api/*` route is gated by the lock-screen middleware.
- Provider keys are **AES-256-GCM-encrypted** before they touch disk.
- The session cookie is **HMAC-signed (Web Crypto)** and `HttpOnly · SameSite=Lax`.
- Campaign payloads stored verbatim — full transcript of what the model
  returned is preserved so you can re-render later if the UI evolves.
- `data/` (DB + vault key) is git-ignored.

## What this does NOT do (yet)

- No direct posting to Instagram / WhatsApp / Meta. The almanac produces
  the content — you copy each card and paste into Meta Business Suite,
  Buffer, or whatever scheduler you use.
- No image generation in-app. Every post carries an `image_prompt` field
  you can feed into your image tool of choice (Midjourney, ideogram,
  Sora image mode, etc.).
- No multi-user workspaces — single-passcode lock for now. Local-only.

These are deliberate scope cuts — getting the copy quality right beats
half-integrated scheduler adapters.

## License

Saffron Lantern Almanac is **dual-licensed**:

- **[LICENSE](LICENSE)** — Apache License 2.0. This is the default for everyone.
  Use, modify, redistribute, and run commercially at zero cost. Attribution
  notices must be preserved per the Apache terms.

- **[LICENSE-COMMERCIAL](LICENSE-COMMERCIAL.md)** — Optional paid commercial
  offering with warranty, IP indemnification, priority support, attribution
  waiver for white-label deployments, and custom integration assistance.
  Almost no one needs this — Apache 2.0 already grants commercial use. It
  exists for organisations whose legal teams require formal warranty +
  indemnification language that open-source licenses cannot provide.

Contact for the commercial tier: **vuqar.qenberov@gmail.com**.

Copyright 2026 Vugar Familoglu.
