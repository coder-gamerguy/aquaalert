// routes/alerts.js
const router = require('express').Router();
const db = require('../db');
const { authenticateOperator } = require('../middleware/auth');

// GET /api/alerts — recent alerts (public)
router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const zone = req.query.zone;

  let query = `
    SELECT a.id, a.type, a.message_en, a.sent_to, a.delivered, a.created_at,
           z.name as zone_name, z.slug as zone_slug
    FROM alerts a
    LEFT JOIN zones z ON z.id = a.zone_id
    WHERE 1=1
  `;
  const params = [];
  if (zone) { params.push(zone); query += ` AND z.slug=$${params.length}`; }
  query += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const { rows } = await db.query(query, params);
  res.json({ alerts: rows });
});

// GET /api/alerts/stats — operator analytics
router.get('/stats', authenticateOperator, async (req, res) => {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE type='open') as open_alerts,
      COUNT(*) FILTER (WHERE type='close') as close_alerts,
      COUNT(*) FILTER (WHERE type='emergency') as emergency_alerts,
      SUM(sent_to) as total_sms_sent,
      SUM(delivered) as total_delivered,
      ROUND(AVG(CASE WHEN sent_to > 0 THEN delivered::float/sent_to*100 END), 1) as avg_delivery_rate
    FROM alerts
    WHERE created_at > NOW() - INTERVAL '30 days'
  `);
  res.json({ stats: rows[0] });
});

module.exports = router;
