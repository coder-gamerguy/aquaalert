// routes/zones.js
const router = require('express').Router();
const db = require('../db');
const { authenticateOperator } = require('../middleware/auth');
const { notifyZoneOpen, notifyZoneClose } = require('../services/notifyService');
const logger = require('../utils/logger');

// GET /api/zones — public, returns all zones with status
router.get('/', async (req, res) => {
  const { rows } = await db.query(`
    SELECT z.id, z.slug, z.name, z.area_name, z.lat, z.lng,
           z.status, z.flow_pct, z.opened_at, z.estimated_close_at,
           z.subscriber_count,
           (SELECT COUNT(*) FROM subscribers s WHERE s.zone_id=z.id AND s.is_active=true) AS live_subscribers
    FROM zones z ORDER BY z.name
  `);
  res.json({ zones: rows });
});

// GET /api/zones/:id — single zone with schedule
router.get('/:id', async (req, res) => {
  const { rows } = await db.query(`
    SELECT z.*, ss.day_of_week, ss.start_hour, ss.start_min, ss.duration_hrs
    FROM zones z
    LEFT JOIN supply_schedule ss ON ss.zone_id = z.id AND ss.is_active=true
    WHERE z.id=$1 OR z.slug=$1
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Zone not found' });
  res.json({ zone: rows[0] });
});

// POST /api/zones/:id/open — operator only
router.post('/:id/open', authenticateOperator, async (req, res) => {
  const zoneId = req.params.id;
  const io = req.app.get('io');

  // Update zone status
  const estimatedClose = new Date(Date.now() + 3 * 60 * 60 * 1000); // default 3h
  await db.query(`
    UPDATE zones SET status='open', flow_pct=$1, opened_at=NOW(),
    estimated_close_at=$2, updated_at=NOW() WHERE id=$3
  `, [req.body.flow_pct || 75, estimatedClose, zoneId]);

  // Send notifications
  const result = await notifyZoneOpen(zoneId, req.operator.email, io);
  logger.info(`Zone ${zoneId} opened by ${req.operator.email}`);

  res.json({ success: true, ...result });
});

// POST /api/zones/:id/close — operator only
router.post('/:id/close', authenticateOperator, async (req, res) => {
  const zoneId = req.params.id;
  const io = req.app.get('io');

  await db.query(`
    UPDATE zones SET status='closed', flow_pct=0, estimated_close_at=NULL, updated_at=NOW()
    WHERE id=$1
  `, [zoneId]);

  const result = await notifyZoneClose(zoneId, req.operator.email, io);
  logger.info(`Zone ${zoneId} closed by ${req.operator.email}`);

  res.json({ success: true, ...result });
});

// PATCH /api/zones/:id — update zone metadata (operator only)
router.patch('/:id', authenticateOperator, async (req, res) => {
  const { flow_pct, estimated_close_at } = req.body;
  await db.query(
    'UPDATE zones SET flow_pct=$1, estimated_close_at=$2, updated_at=NOW() WHERE id=$3',
    [flow_pct, estimated_close_at, req.params.id]
  );
  res.json({ success: true });
});

module.exports = router;
