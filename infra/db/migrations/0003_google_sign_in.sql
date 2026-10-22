-- 0003: Sign in with Google (OpenID Connect). Password stays optional for Google-only accounts.
ALTER TABLE users ADD COLUMN google_sub TEXT UNIQUE;
ALTER TABLE users ADD COLUMN avatar_url TEXT;
