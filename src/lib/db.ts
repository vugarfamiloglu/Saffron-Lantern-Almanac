/* -----------------------------------------------------------------------------
 * src/lib/db.ts — single-file SQLite via better-sqlite3.
 *
 * Tables
 *   provider_keys   encrypted LLM provider keys (OpenAI / Anthropic / Gemini)
 *   businesses      saved local-business profiles (the campaign target)
 *   custom_holidays user-added holidays that extend the built-in catalogue
 *   campaigns       every generated 30-day plan (full JSON payload preserved)
 *   settings        single-row key/value config
 * -------------------------------------------------------------------------- */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DB_PATH = process.env.SLA_DB_PATH || resolve(process.cwd(), 'data', 'sla.db');

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  const dir = dirname(DB_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const handle = new Database(DB_PATH);
  handle.pragma('journal_mode = WAL');
  handle.pragma('foreign_keys = ON');
  bootstrap(handle);
  _db = handle;
  return handle;
}

function bootstrap(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS provider_keys (
      id            TEXT PRIMARY KEY,
      provider      TEXT NOT NULL,
      label         TEXT NOT NULL,
      key_encrypted TEXT NOT NULL,
      model         TEXT,
      is_default    INTEGER NOT NULL DEFAULT 0,
      created_at    INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_provider_keys_provider ON provider_keys(provider);

    CREATE TABLE IF NOT EXISTS businesses (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      category      TEXT,                       -- 'cafe', 'salon', 'apparel', 'fitness', …
      region        TEXT,                       -- 'Baku', 'Ganja', 'Online (AZ)', …
      target_age_min INTEGER,
      target_age_max INTEGER,
      value_props   TEXT,                       -- short list of what makes them different
      hashtag_seeds TEXT,                       -- JSON array
      brand_voice   TEXT,                       -- override of the global voice
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS custom_holidays (
      id            TEXT PRIMARY KEY,
      slug          TEXT NOT NULL UNIQUE,
      label         TEXT NOT NULL,
      date_pattern  TEXT,                       -- 'YYYY-MM-DD' fixed OR 'MM-DD' annual OR free text
      culture       TEXT,                       -- 'AZ' | 'global' | 'religious' | …
      audience      TEXT,
      narrative     TEXT,                       -- seed paragraph for the prompt
      palette       TEXT,                       -- JSON {primary, accent, text} hints
      created_at    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id              TEXT PRIMARY KEY,
      business_id     TEXT,                     -- nullable so deletes don't cascade
      holiday_slug    TEXT NOT NULL,
      holiday_label   TEXT NOT NULL,
      starts_at       TEXT,                     -- 'YYYY-MM-DD' campaign begin
      ends_at         TEXT,                     -- 'YYYY-MM-DD' campaign end
      objective       TEXT,                     -- "raise weekend traffic by 50%"
      audience        TEXT,
      narrative       TEXT,                     -- AI-written opening paragraph
      offers_json     TEXT,                     -- JSON array of { name, discount_pct, valid_until }
      posts_json      TEXT,                     -- JSON array of { day, theme, hook, body, hashtags, image_prompt }
      stories_json    TEXT,                     -- JSON array of { day, type, overlay, body }
      reels_json      TEXT,                     -- JSON array of { day, hook, beats, broll }
      kpis_json       TEXT,                     -- JSON of suggested KPIs
      provider        TEXT,
      model           TEXT,
      status          TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'approved' | 'archived'
      starred         INTEGER NOT NULL DEFAULT 0,
      created_at      INTEGER NOT NULL,
      generated_at    INTEGER,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_campaigns_created ON campaigns(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_campaigns_holiday ON campaigns(holiday_slug);

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

/* ── typed rows ─────────────────────────────────────────────────────── */
export interface ProviderKeyRow {
  id: string; provider: string; label: string; key_encrypted: string;
  model: string | null; is_default: number; created_at: number;
}
export interface BusinessRow {
  id: string; name: string; category: string | null; region: string | null;
  target_age_min: number | null; target_age_max: number | null;
  value_props: string | null; hashtag_seeds: string | null; brand_voice: string | null;
  created_at: number;
}
export interface CustomHolidayRow {
  id: string; slug: string; label: string;
  date_pattern: string | null; culture: string | null;
  audience: string | null; narrative: string | null; palette: string | null;
  created_at: number;
}
export interface CampaignRow {
  id: string; business_id: string | null;
  holiday_slug: string; holiday_label: string;
  starts_at: string | null; ends_at: string | null;
  objective: string | null; audience: string | null; narrative: string | null;
  offers_json: string | null; posts_json: string | null;
  stories_json: string | null; reels_json: string | null;
  kpis_json: string | null;
  provider: string | null; model: string | null;
  status: string; starred: number;
  created_at: number; generated_at: number | null;
}

/* ── provider_keys ──────────────────────────────────────────────────── */
export function listProviderKeys(): ProviderKeyRow[] {
  return db().prepare('SELECT * FROM provider_keys ORDER BY provider, created_at').all() as ProviderKeyRow[];
}
export function getProviderKey(id: string): ProviderKeyRow | undefined {
  return db().prepare('SELECT * FROM provider_keys WHERE id = ?').get(id) as ProviderKeyRow | undefined;
}
export function getDefaultProviderKey(provider: string): ProviderKeyRow | undefined {
  const row = db().prepare('SELECT * FROM provider_keys WHERE provider = ? AND is_default = 1').get(provider) as ProviderKeyRow | undefined;
  if (row) return row;
  return db().prepare('SELECT * FROM provider_keys WHERE provider = ? ORDER BY created_at LIMIT 1').get(provider) as ProviderKeyRow | undefined;
}
export function insertProviderKey(row: ProviderKeyRow) {
  if (row.is_default) db().prepare('UPDATE provider_keys SET is_default = 0 WHERE provider = ?').run(row.provider);
  db().prepare(`INSERT INTO provider_keys (id, provider, label, key_encrypted, model, is_default, created_at)
                VALUES (@id, @provider, @label, @key_encrypted, @model, @is_default, @created_at)`).run(row);
}
export function setDefaultProviderKey(id: string) {
  const row = getProviderKey(id); if (!row) return;
  const tx = db().transaction((p: string, keyId: string) => {
    db().prepare('UPDATE provider_keys SET is_default = 0 WHERE provider = ?').run(p);
    db().prepare('UPDATE provider_keys SET is_default = 1 WHERE id = ?').run(keyId);
  });
  tx(row.provider, id);
}
export function deleteProviderKey(id: string) { db().prepare('DELETE FROM provider_keys WHERE id = ?').run(id); }

/* ── businesses ─────────────────────────────────────────────────────── */
export function listBusinesses(): BusinessRow[] {
  return db().prepare('SELECT * FROM businesses ORDER BY name').all() as BusinessRow[];
}
export function getBusiness(id: string): BusinessRow | undefined {
  return db().prepare('SELECT * FROM businesses WHERE id = ?').get(id) as BusinessRow | undefined;
}
export function insertBusiness(row: BusinessRow) {
  db().prepare(`INSERT INTO businesses (id, name, category, region, target_age_min, target_age_max,
                value_props, hashtag_seeds, brand_voice, created_at)
                VALUES (@id, @name, @category, @region, @target_age_min, @target_age_max,
                @value_props, @hashtag_seeds, @brand_voice, @created_at)`).run(row);
}
export function updateBusiness(id: string, fields: Partial<BusinessRow>) {
  const cur = getBusiness(id); if (!cur) return;
  const merged = { ...cur, ...fields, id };
  db().prepare(`UPDATE businesses SET name=@name, category=@category, region=@region,
                target_age_min=@target_age_min, target_age_max=@target_age_max,
                value_props=@value_props, hashtag_seeds=@hashtag_seeds,
                brand_voice=@brand_voice WHERE id=@id`).run(merged);
}
export function deleteBusiness(id: string) { db().prepare('DELETE FROM businesses WHERE id = ?').run(id); }

/* ── custom_holidays ────────────────────────────────────────────────── */
export function listCustomHolidays(): CustomHolidayRow[] {
  return db().prepare('SELECT * FROM custom_holidays ORDER BY label').all() as CustomHolidayRow[];
}
export function insertCustomHoliday(row: CustomHolidayRow) {
  db().prepare(`INSERT INTO custom_holidays (id, slug, label, date_pattern, culture, audience, narrative, palette, created_at)
                VALUES (@id, @slug, @label, @date_pattern, @culture, @audience, @narrative, @palette, @created_at)`).run(row);
}
export function deleteCustomHoliday(id: string) { db().prepare('DELETE FROM custom_holidays WHERE id = ?').run(id); }

/* ── campaigns ──────────────────────────────────────────────────────── */
export function listCampaigns(limit = 100): CampaignRow[] {
  return db().prepare('SELECT * FROM campaigns ORDER BY created_at DESC LIMIT ?').all(limit) as CampaignRow[];
}
export function getCampaign(id: string): CampaignRow | undefined {
  return db().prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as CampaignRow | undefined;
}
export function insertCampaign(row: CampaignRow) {
  db().prepare(`INSERT INTO campaigns (
                  id, business_id, holiday_slug, holiday_label, starts_at, ends_at,
                  objective, audience, narrative,
                  offers_json, posts_json, stories_json, reels_json, kpis_json,
                  provider, model, status, starred, created_at, generated_at
                ) VALUES (
                  @id, @business_id, @holiday_slug, @holiday_label, @starts_at, @ends_at,
                  @objective, @audience, @narrative,
                  @offers_json, @posts_json, @stories_json, @reels_json, @kpis_json,
                  @provider, @model, @status, @starred, @created_at, @generated_at
                )`).run(row);
}
export function updateCampaign(id: string, fields: Partial<CampaignRow>) {
  const cur = getCampaign(id); if (!cur) return;
  const merged = { ...cur, ...fields, id };
  db().prepare(`UPDATE campaigns SET status=@status, starred=@starred WHERE id=@id`).run(merged);
}
export function deleteCampaign(id: string) { db().prepare('DELETE FROM campaigns WHERE id = ?').run(id); }

/* ── settings ───────────────────────────────────────────────────────── */
export function getSetting(key: string): string | undefined {
  const r = db().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return r?.value;
}
export function setSetting(key: string, value: string) {
  db().prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}
