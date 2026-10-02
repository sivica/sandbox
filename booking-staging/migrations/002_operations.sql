CREATE TABLE admin_sessions (
  token_hash text PRIMARY KEY,
  actor text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_session_expiry ON admin_sessions(expires_at);
CREATE TABLE admin_audit (
  id uuid PRIMARY KEY,
  actor text NOT NULL,
  action text NOT NULL,
  target text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE operational_checks (
  id uuid PRIMARY KEY,
  kind text NOT NULL,
  status text NOT NULL CHECK (status IN ('ok','failed')),
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX operational_check_created ON operational_checks(created_at);
