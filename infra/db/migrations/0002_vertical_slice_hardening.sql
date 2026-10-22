-- 0002: Hardening needed to make the vertical slice correct.
-- See docs/decisions/ADR-0001-vertical-slice-deviations.md for the why.
-- 0001 is kept byte-for-byte as delivered in the CTO package.

-- ── Auth ───────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN password_hash TEXT;

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,          -- sha256 of the cookie token; raw token never stored
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- ── Pricing lives with the terms version (BR-008, BR-011) ─────────────
ALTER TABLE license_terms_versions
  ADD COLUMN price_cents INT NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'EUR',
  ADD COLUMN artist_share_bps INT NOT NULL DEFAULT 7000 CHECK (artist_share_bps BETWEEN 0 AND 10000);

-- Licensing Model: Creator €19, Pro €49, Agency €199 (starter code had 29/79/249).
UPDATE license_terms_versions SET price_cents = CASE tier
  WHEN 'creator' THEN 1900 WHEN 'pro' THEN 4900 WHEN 'agency' THEN 19900 END;

-- Readable DRAFT terms derived from the Licensing Model. NOT legal text — counsel must replace
-- these with a new terms version before any paid launch (Open Question Q-003).
UPDATE license_terms_versions SET terms_md = CASE tier
  WHEN 'creator' THEN E'DRAFT — pending legal review.\n\nGrant: a non-exclusive, perpetual license to synchronise the track in content published on ONE monetised YouTube/Twitch/social channel or ONE creator brand.\n\nNot permitted: resale, redistribution as stock music, standalone music distribution, registering the track with Content ID or any fingerprinting service, transfer of the license.\n\nThis license does not transfer copyright. The certificate documents the license grant and purchase record; it is not a guarantee that third parties will never assert claims.'
  WHEN 'pro' THEN E'DRAFT — pending legal review.\n\nGrant: a non-exclusive, perpetual license to synchronise the track in up to FIVE client projects or channels.\n\nNot permitted: resale, standalone music distribution, registering the track with Content ID or any fingerprinting service, transfer of the license beyond the named projects.\n\nThis license does not transfer copyright. The certificate documents the license grant and purchase record; it is not a guarantee that third parties will never assert claims.'
  WHEN 'agency' THEN E'DRAFT — pending legal review.\n\nGrant: a non-exclusive, perpetual license for commercial use across campaigns for ONE client or brand, including paid advertising.\n\nNot permitted: resale as a music library, registering the track with Content ID or any fingerprinting service, transfer outside the licensed client/brand.\n\nThis license does not transfer copyright. The certificate documents the license grant and purchase record; it is not a guarantee that third parties will never assert claims.'
END;

-- ── Track review metadata ──────────────────────────────────────────────
ALTER TABLE tracks ADD COLUMN review_reason TEXT;

-- ── Checkout sessions ─────────────────────────────────────────────────
ALTER TABLE payment_sessions
  ADD COLUMN idempotency_key TEXT,
  ADD COLUMN amount_cents INT,
  ADD COLUMN currency CHAR(3) NOT NULL DEFAULT 'EUR',
  ADD COLUMN whitelisted_url TEXT,
  ADD COLUMN project_or_client_name TEXT,
  ADD COLUMN checkout_url TEXT,
  ADD COLUMN expires_at TIMESTAMPTZ;
ALTER TABLE payment_sessions
  ADD CONSTRAINT payment_sessions_status_check CHECK (status IN ('created','completed','expired','failed'));
CREATE UNIQUE INDEX payment_sessions_idempotency ON payment_sessions(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Every verified Stripe event is recorded once (event-level idempotency).
CREATE TABLE stripe_events (
  event_id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMPTZ,
  outcome TEXT
);

-- ── Immutable license ledger (BR-007) ──────────────────────────────────
-- Money columns in integer cents; 0001's DECIMAL euro columns stay for compatibility.
ALTER TABLE purchased_licenses
  ADD COLUMN price_paid_cents INT,
  ADD COLUMN artist_cut_cents INT,
  ADD COLUMN platform_cut_cents INT,
  ADD COLUMN payment_session_id UUID REFERENCES payment_sessions(id),
  ADD COLUMN terms_snapshot JSONB;   -- exact terms text/version at purchase

-- Lifecycle is an append-only event stream, so the license row itself never changes.
CREATE TABLE license_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES purchased_licenses(id),
  type TEXT NOT NULL CHECK (type IN ('paid','certificate_generated','certificate_failed','delivered','disputed','refunded')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX idx_license_events_license ON license_events(license_id, created_at);

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL UNIQUE REFERENCES purchased_licenses(id),
  file_id UUID NOT NULL REFERENCES track_files(id),
  sha256 TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION echovault_forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'APPEND_ONLY: % rows cannot be %d', TG_TABLE_NAME, lower(TG_OP)
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchased_licenses_append_only BEFORE UPDATE OR DELETE ON purchased_licenses
  FOR EACH ROW EXECUTE FUNCTION echovault_forbid_mutation();
CREATE TRIGGER license_events_append_only BEFORE UPDATE OR DELETE ON license_events
  FOR EACH ROW EXECUTE FUNCTION echovault_forbid_mutation();
CREATE TRIGGER certificates_append_only BEFORE UPDATE OR DELETE ON certificates
  FOR EACH ROW EXECUTE FUNCTION echovault_forbid_mutation();
CREATE TRIGGER audit_logs_append_only BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION echovault_forbid_mutation();
CREATE TRIGGER track_reviews_append_only BEFORE UPDATE OR DELETE ON track_reviews
  FOR EACH ROW EXECUTE FUNCTION echovault_forbid_mutation();

-- Terms versions that have been sold under must never change text or price.
CREATE OR REPLACE FUNCTION echovault_protect_sold_terms() RETURNS trigger AS $$
BEGIN
  IF (NEW.terms_md, NEW.price_cents, NEW.artist_share_bps, NEW.version, NEW.tier)
     IS DISTINCT FROM (OLD.terms_md, OLD.price_cents, OLD.artist_share_bps, OLD.version, OLD.tier)
     AND EXISTS (SELECT 1 FROM purchased_licenses WHERE terms_version_id = OLD.id) THEN
    RAISE EXCEPTION 'TERMS_LOCKED: terms version % has purchases; create a new version', OLD.id
      USING ERRCODE = 'restrict_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER license_terms_protect_sold BEFORE UPDATE ON license_terms_versions
  FOR EACH ROW EXECUTE FUNCTION echovault_protect_sold_terms();

-- ── Background jobs (Postgres queue instead of Redis for the MVP) ─────
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  run_after TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  locked_at TIMESTAMPTZ,
  last_error TEXT,
  dedupe_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_jobs_ready ON jobs(status, run_after) WHERE status IN ('queued','running');
CREATE UNIQUE INDEX jobs_dedupe_active ON jobs(dedupe_key) WHERE dedupe_key IS NOT NULL AND status IN ('queued','running');

ALTER TABLE echo_score_analyses ADD COLUMN job_id UUID REFERENCES jobs(id);

-- ── Disputes: suspension link ──────────────────────────────────────────
ALTER TABLE disputes ADD COLUMN suspended_track BOOLEAN NOT NULL DEFAULT FALSE;
