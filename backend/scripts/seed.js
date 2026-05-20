// scripts/seed.js — Seed Tamale zones, schedule, and default operator
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const TAMALE_ZONES = [
  { slug: 'lamashegu',   name: 'Lamashegu',          area_name: 'Lamashegu Community',     lat: 9.4214,  lng: -0.8358, status: 'open',   flow_pct: 88 },
  { slug: 'choggu',      name: 'Choggu',              area_name: 'Choggu / Kakpayili',      lat: 9.4072,  lng: -0.8531, status: 'open',   flow_pct: 74 },
  { slug: 'savelugu-rd', name: 'Savelugu Road',       area_name: 'Savelugu Road Corridor',  lat: 9.4350,  lng: -0.8312, status: 'open',   flow_pct: 62 },
  { slug: 'nyanshegu',   name: 'Nyanshegu',           area_name: 'Nyanshegu / Kukuo',       lat: 9.4011,  lng: -0.8447, status: 'closed', flow_pct: 0  },
  { slug: 'kalpohin',    name: 'Kalpohin',            area_name: 'Kalpohin Estate',         lat: 9.3989,  lng: -0.8289, status: 'closed', flow_pct: 0  },
  { slug: 'sagnarigu',   name: 'Sagnarigu',           area_name: 'Sagnarigu Municipal',     lat: 9.3752,  lng: -0.8442, status: 'closed', flow_pct: 0  },
  { slug: 'bilpela',     name: "Bilp'ela",            area_name: 'Bilpela / Taha',          lat: 9.4481,  lng: -0.8175, status: 'closed', flow_pct: 0  },
  { slug: 'tamale-south',name: 'Tamale South',        area_name: 'Hospital Rd / Datoyili', lat: 9.3901,  lng: -0.8528, status: 'closed', flow_pct: 0  },
];

// Weekly schedule: day_of_week arrays (1=Mon..5=Fri, 0=Sun, 6=Sat)
const SCHEDULES = [
  { zone: 'lamashegu',    days: [1,3,5], start_hour: 6,  start_min: 0,  duration_hrs: 4   },
  { zone: 'choggu',       days: [1,3,5], start_hour: 6,  start_min: 30, duration_hrs: 3.5 },
  { zone: 'savelugu-rd',  days: [2,4,6], start_hour: 7,  start_min: 0,  duration_hrs: 3   },
  { zone: 'nyanshegu',    days: [2,4,6], start_hour: 9,  start_min: 30, duration_hrs: 3   },
  { zone: 'kalpohin',     days: [2,4],   start_hour: 6,  start_min: 0,  duration_hrs: 2.5 },
  { zone: 'sagnarigu',    days: [1,3],   start_hour: 8,  start_min: 0,  duration_hrs: 3   },
  { zone: 'bilpela',      days: [3,6],   start_hour: 7,  start_min: 30, duration_hrs: 2.5 },
  { zone: 'tamale-south', days: [1,4],   start_hour: 6,  start_min: 0,  duration_hrs: 3.5 },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert zones
    for (const z of TAMALE_ZONES) {
      await client.query(
        `INSERT INTO zones (slug, name, area_name, lat, lng, status, flow_pct)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (slug) DO UPDATE SET
           name=EXCLUDED.name, status=EXCLUDED.status, flow_pct=EXCLUDED.flow_pct`,
        [z.slug, z.name, z.area_name, z.lat, z.lng, z.status, z.flow_pct]
      );
    }
    console.log(`✅ Seeded ${TAMALE_ZONES.length} zones`);

    // Insert schedules
    for (const s of SCHEDULES) {
      const { rows } = await client.query('SELECT id FROM zones WHERE slug=$1', [s.zone]);
      if (rows.length) {
        await client.query(
          `INSERT INTO supply_schedule (zone_id, day_of_week, start_hour, start_min, duration_hrs)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT DO NOTHING`,
          [rows[0].id, s.days, s.start_hour, s.start_min, s.duration_hrs]
        );
      }
    }
    console.log(`✅ Seeded ${SCHEDULES.length} supply schedules`);

    // Default operator account
    const hash = await bcrypt.hash('changeme123', 12);
    await client.query(
      `INSERT INTO operators (email, password_hash, name, role)
       VALUES ('admin@gwcl.gov.gh', $1, 'GWCL Admin', 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [hash]
    );
    console.log('✅ Seeded default operator: admin@gwcl.gov.gh / changeme123');

    await client.query('COMMIT');
    console.log('\n🌊 AquaAlert database ready!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
