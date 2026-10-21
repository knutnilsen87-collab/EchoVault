-- EchoVault SQL Schema v1
-- PostgreSQL
-- Date: 2026-06-03
-- Purpose: MVP schema for curated AI/hybrid music licensing marketplace.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE user_role AS ENUM ('buyer','artist','reviewer','support','finance','admin');
CREATE TYPE track_status AS ENUM ('draft','submitted','analysis_pending','analysis_failed','needs_human_review','changes_requested','approved','live','rejected','suspended');
CREATE TYPE license_tier AS ENUM ('creator','pro','agency');
CREATE TYPE file_kind AS ENUM ('preview_mp3','stream_mp3','high_res_wav','artwork_image','poe_attachment','certificate_pdf');
CREATE TYPE review_decision AS ENUM ('approve','reject','request_changes','suspend','override_analysis');
CREATE TYPE dispute_status AS ENUM ('open','investigating','resolved_valid','resolved_invalid','escalated','closed');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL DEFAULT 'buyer',
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  artist_name VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  stripe_account_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  genre VARCHAR(100) NOT NULL,
  mood VARCHAR(100),
  bpm INT CHECK (bpm IS NULL OR (bpm > 0 AND bpm < 400)),
  duration_seconds INT CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  status track_status NOT NULL DEFAULT 'draft',
  ai_quality_score DECIMAL(5,2),
  public_poe_summary JSONB,
  analysis_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ
);

CREATE INDEX idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_tracks_public_search ON tracks(status, genre, mood, bpm);

CREATE TABLE track_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  kind file_kind NOT NULL,
  storage_key TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
  checksum_sha256 TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(track_id, kind, storage_key)
);

CREATE INDEX idx_track_files_track_kind ON track_files(track_id, kind);

CREATE TABLE proof_of_effort (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL UNIQUE REFERENCES tracks(id) ON DELETE CASCADE,
  creation_mode TEXT NOT NULL CHECK (creation_mode IN ('pure_ai_director','hybrid_producer','human_led_ai_assisted')),
  ai_tools_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  process_summary TEXT NOT NULL,
  daw_manual_work TEXT,
  time_spent_bucket TEXT NOT NULL CHECK (time_spent_bucket IN ('under_1h','1_3h','3_10h','10h_plus')),
  samples_used TEXT NOT NULL CHECK (samples_used IN ('none','owned','licensed','public_domain','unknown')),
  sample_notes TEXT,
  voice_or_likeness_used BOOLEAN NOT NULL DEFAULT FALSE,
  named_artist_imitation BOOLEAN NOT NULL DEFAULT FALSE,
  rights_warranty_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  private_notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_poe_track_id ON proof_of_effort(track_id);
CREATE INDEX idx_poe_ai_tools_gin ON proof_of_effort USING GIN (ai_tools_used);

CREATE TABLE echo_score_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  analysis_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  score DECIMAL(5,2),
  pass BOOLEAN,
  metrics JSONB,
  flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  feedback JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_echo_score_track_id ON echo_score_analyses(track_id);
CREATE INDEX idx_echo_score_status ON echo_score_analyses(status);

CREATE TABLE track_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  decision review_decision NOT NULL,
  reason_code TEXT,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_track_reviews_track_id ON track_reviews(track_id);

CREATE TABLE license_terms_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier license_tier NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  terms_md TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tier, version)
);

CREATE UNIQUE INDEX one_active_terms_per_tier ON license_terms_versions(tier) WHERE active = TRUE;

CREATE TABLE payment_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  track_id UUID NOT NULL REFERENCES tracks(id),
  tier license_tier NOT NULL,
  terms_version_id UUID NOT NULL REFERENCES license_terms_versions(id),
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchased_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES tracks(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  artist_id UUID NOT NULL REFERENCES users(id),
  tier license_tier NOT NULL,
  terms_version_id UUID NOT NULL REFERENCES license_terms_versions(id),
  price_paid_eur DECIMAL(10,2) NOT NULL CHECK (price_paid_eur >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  whitelisted_url TEXT,
  project_or_client_name TEXT,
  certificate_file_id UUID REFERENCES track_files(id),
  stripe_session_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  artist_cut_eur DECIMAL(10,2) NOT NULL CHECK (artist_cut_eur >= 0),
  platform_cut_eur DECIMAL(10,2) NOT NULL CHECK (platform_cut_eur >= 0),
  status TEXT NOT NULL DEFAULT 'paid',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchased_licenses_buyer ON purchased_licenses(buyer_id);
CREATE INDEX idx_purchased_licenses_track ON purchased_licenses(track_id);
CREATE INDEX idx_purchased_licenses_artist ON purchased_licenses(artist_id);
CREATE INDEX idx_purchased_licenses_purchased_at ON purchased_licenses(purchased_at);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchased_license_id UUID REFERENCES purchased_licenses(id),
  track_id UUID REFERENCES tracks(id),
  opened_by_user_id UUID REFERENCES users(id),
  status dispute_status NOT NULL DEFAULT 'open',
  claim_summary TEXT NOT NULL,
  reason_category TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_disputes_track ON disputes(track_id);
CREATE INDEX idx_disputes_license ON disputes(purchased_license_id);
CREATE INDEX idx_disputes_status ON disputes(status);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_user_id UUID REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- Starter terms rows: content must be replaced by legal counsel before launch.
INSERT INTO license_terms_versions (tier, version, title, terms_md, active)
VALUES
('creator', '0.1-draft', 'Creator License Draft', 'DRAFT TERMS - requires legal review.', TRUE),
('pro', '0.1-draft', 'Pro License Draft', 'DRAFT TERMS - requires legal review.', TRUE),
('agency', '0.1-draft', 'Agency License Draft', 'DRAFT TERMS - requires legal review.', TRUE);
