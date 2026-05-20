// db.js — PostgreSQL connection pool
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (err) => require('./utils/logger').error('DB pool error:', err));
module.exports = pool;
