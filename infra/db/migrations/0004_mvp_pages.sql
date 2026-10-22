-- 0004: data needed by the remaining MVP pages (artist profile, dispute resolution, terms admin).
ALTER TABLE users ADD COLUMN bio TEXT CHECK (bio IS NULL OR length(bio) <= 2000);

ALTER TABLE disputes ADD COLUMN resolved_by_user_id UUID REFERENCES users(id);
ALTER TABLE disputes ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE license_terms_versions ADD COLUMN created_by_user_id UUID REFERENCES users(id);
ALTER TABLE license_terms_versions ADD COLUMN activated_at TIMESTAMPTZ;

CREATE INDEX idx_tracks_public_artist ON tracks(artist_id) WHERE status IN ('approved', 'live');
