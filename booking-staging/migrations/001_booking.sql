CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS services (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  minutes integer NOT NULL CHECK (minutes > 0 AND minutes <= 240),
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR',
  icon text NOT NULL,
  description text NOT NULL,
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS resources (
  id text PRIMARY KEY,
  name text NOT NULL,
  timezone text NOT NULL,
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS opening_hours (
  resource_id text NOT NULL REFERENCES resources(id),
  weekday integer NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  opens time NOT NULL,
  closes time NOT NULL CHECK (closes > opens),
  PRIMARY KEY (resource_id, weekday)
);
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY,
  reference text UNIQUE NOT NULL,
  service_id text NOT NULL REFERENCES services(id),
  resource_id text NOT NULL REFERENCES resources(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL CHECK (ends_at > starts_at),
  price_cents integer NOT NULL,
  currency text NOT NULL,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  email text NOT NULL CHECK (length(email) <= 254),
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  idempotency_key uuid UNIQUE NOT NULL,
  request_hash text NOT NULL,
  access_token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist
    (resource_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
    WHERE (status = 'confirmed')
);
CREATE INDEX IF NOT EXISTS bookings_resource_start ON bookings(resource_id, starts_at);

INSERT INTO resources VALUES ('studio-room','Sample treatment room','Europe/Skopje',true)
ON CONFLICT DO NOTHING;
INSERT INTO opening_hours(resource_id,weekday,opens,closes)
SELECT 'studio-room', d, '09:00'::time, '18:00'::time FROM generate_series(1,6) d
ON CONFLICT DO NOTHING;
INSERT INTO services(id,name,category,minutes,price_cents,icon,description) VALUES
('reset','The reset','SIGNATURE FACIAL',60,6500,'◌','A gentle cleanse, facial massage and hydration treatment. A quiet hour to reset your day.'),
('restore','Restore & unwind','RELAXATION MASSAGE',45,5500,'≈','A relaxing shoulder and back massage, tailored to your preferred pressure.'),
('glow','Fresh start','EXPRESS FACIAL',30,3500,'✧','A short cleanse and hydration treatment for a refreshed feeling.')
ON CONFLICT DO NOTHING;
