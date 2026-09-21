CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_subject text UNIQUE NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deletion_requested_at timestamptz
);

CREATE TABLE oauth_connection (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider = 'google'),
  scopes text[] NOT NULL,
  encrypted_refresh_token text NOT NULL,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE TABLE coursework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  provider_course_id text NOT NULL,
  provider_coursework_id text NOT NULL,
  title text NOT NULL,
  due_at timestamptz,
  state text NOT NULL,
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_course_id, provider_coursework_id)
);

CREATE TABLE consent_record (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_ref text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE learning_job (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  coursework_id uuid REFERENCES coursework(id) ON DELETE SET NULL,
  mode text NOT NULL CHECK (mode IN ('clarify','plan','quiz','reflection')),
  context_json jsonb NOT NULL,
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','running','succeeded','failed')),
  attempts integer NOT NULL DEFAULT 0,
  idempotency_key text NOT NULL,
  result_json jsonb,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

CREATE TABLE audit_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES app_user(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_ref text,
  outcome text NOT NULL,
  correlation_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assignment_snapshot (
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  provider_course_id text NOT NULL,
  provider_coursework_id text NOT NULL,
  fingerprint text NOT NULL,
  source_updated_at timestamptz,
  observed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, provider_course_id, provider_coursework_id)
);

CREATE INDEX coursework_user_idx ON coursework(user_id);
CREATE INDEX learning_job_state_idx ON learning_job(state, created_at);
CREATE INDEX audit_event_user_idx ON audit_event(user_id, occurred_at DESC);
