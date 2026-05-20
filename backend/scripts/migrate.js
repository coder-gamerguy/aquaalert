// scripts/migrate.js — Database schema setup
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Zones — Tamale water distribution zones
    await client.query(`
      CREATE TABLE IF NOT EXISTS zones (
        id          SERIAL PRIMARY KEY,
        slug        VARCHAR(50) UNIQUE NOT NULL,
        name        VARCHAR(100) NOT NULL,
        area_name   VARCHAR(100),
        lat         DECIMAL(9,6),
        lng         DECIMAL(9,6),
        status      VARCHAR(20) DEFAULT 'closed' CHECK (status IN ('open','closed','maintenance')),
        flow_pct    INTEGER DEFAULT 0 CHECK (flow_pct BETWEEN 0 AND 100),
        opened_at   TIMESTAMPTZ,
        estimated_close_at TIMESTAMPTZ,
        subscriber_count INTEGER DEFAULT 0,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Subscribers — residents registered for alerts
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id          SERIAL PRIMARY KEY,
        phone       VARCHAR(20) NOT NULL,
        zone_id     INTEGER REFERENCES zones(id) ON DELETE SET NULL,
        name        VARCHAR(100),
        language    VARCHAR(10) DEFAULT 'en' CHECK (language IN ('en','tw')),
        alert_open  BOOLEAN DEFAULT true,
        alert_close BOOLEAN DEFAULT true,
        alert_advance BOOLEAN DEFAULT true,
        alert_pressure BOOLEAN DEFAULT false,
        is_active   BOOLEAN DEFAULT true,
        subscribed_at TIMESTAMPTZ DEFAULT NOW(),
        last_alerted_at TIMESTAMPTZ,
        UNIQUE(phone, zone_id)
      );
    `);

    // Alerts — log of all notifications sent
    await client.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id          SERIAL PRIMARY KEY,
        zone_id     INTEGER REFERENCES zones(id),
        type        VARCHAR(30) NOT NULL CHECK (type IN ('open','close','advance','pressure','emergency','maintenance')),
        message_en  TEXT NOT NULL,
        message_tw  TEXT,
        sent_to     INTEGER DEFAULT 0,
        delivered   INTEGER DEFAULT 0,
        failed      INTEGER DEFAULT 0,
        triggered_by VARCHAR(100),
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Alert deliveries — per-subscriber delivery record
    await client.query(`
      CREATE TABLE IF NOT EXISTS alert_deliveries (
        id            SERIAL PRIMARY KEY,
        alert_id      INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
        subscriber_id INTEGER REFERENCES subscribers(id) ON DELETE CASCADE,
        phone         VARCHAR(20) NOT NULL,
        status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed')),
        provider      VARCHAR(20),
        provider_msg_id VARCHAR(100),
        sent_at       TIMESTAMPTZ,
        delivered_at  TIMESTAMPTZ,
        error_msg     TEXT
      );
    `);

    // Supply schedule — weekly recurring windows
    await client.query(`
      CREATE TABLE IF NOT EXISTS supply_schedule (
        id          SERIAL PRIMARY KEY,
        zone_id     INTEGER REFERENCES zones(id) ON DELETE CASCADE,
        day_of_week INTEGER[] NOT NULL,  -- 0=Sun..6=Sat
        start_hour  INTEGER NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
        start_min   INTEGER NOT NULL DEFAULT 0,
        duration_hrs DECIMAL(4,2) NOT NULL,
        is_active   BOOLEAN DEFAULT true,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Operators — GWCL staff accounts
    await client.query(`
      CREATE TABLE IF NOT EXISTS operators (
        id          SERIAL PRIMARY KEY,
        email       VARCHAR(200) UNIQUE NOT NULL,
        password_hash VARCHAR(200) NOT NULL,
        name        VARCHAR(100) NOT NULL,
        role        VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin','operator','viewer')),
        is_active   BOOLEAN DEFAULT true,
        last_login  TIMESTAMPTZ,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subscribers_zone ON subscribers(zone_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON subscribers(phone);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_alerts_zone ON alerts(zone_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_deliveries_alert ON alert_deliveries(alert_id);`);

    await client.query('COMMIT');
    console.log('✅ Database migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
