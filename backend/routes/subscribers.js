// routes/subscribers.js
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { sendSMS, buildMessage, normalizeGhanaPhone } = require('../services/smsService');
const { authenticateOperator } = require('../middleware/auth');

// POST /api/subscribers — register new subscriber
router.post('/',
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('zone_id').isInt({ min: 1 }).withMessage('Valid zone ID required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { phone, zone_id, name, language = 'en', alert_open = true,
            alert_close = true, alert_advance = true, alert_pressure = false } = req.body;

    const normalizedPhone = normalizeGhanaPhone(phone);

    // Verify zone exists
    const { rows: zoneRows } = await db.query('SELECT id, name FROM zones WHERE id=$1', [zone_id]);
    if (!zoneRows.length) return res.status(404).json({ error: 'Zone not found' });
    const zone = zoneRows[0];

    // Check if already subscribed
    const { rows: existing } = await db.query(
      'SELECT id, is_active FROM subscribers WHERE phone=$1 AND zone_id=$2',
      [normalizedPhone, zone_id]
    );

    if (existing.length) {
      if (existing[0].is_active) {
        return res.status(409).json({ error: 'Already subscribed to this zone' });
      }
      // Re-activate
      await db.query(
        'UPDATE subscribers SET is_active=true, subscribed_at=NOW() WHERE id=$1',
        [existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO subscribers (phone, zone_id, name, language, alert_open, alert_close, alert_advance, alert_pressure)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [normalizedPhone, zone_id, name, language, alert_open, alert_close, alert_advance, alert_pressure]
      );
    }

    // Update zone subscriber count
    await db.query(
      `UPDATE zones SET subscriber_count=(
        SELECT COUNT(*) FROM subscribers WHERE zone_id=$1 AND is_active=true
      ) WHERE id=$1`,
      [zone_id]
    );

    // Send welcome SMS
    const msgs = buildMessage('welcome', zone.name);
    await sendSMS(normalizedPhone, msgs.en);

    res.status(201).json({
      success: true,
      message: `Subscribed to ${zone.name} alerts. Welcome SMS sent.`,
    });
  }
);

// DELETE /api/subscribers/:phone — unsubscribe
router.delete('/:phone', async (req, res) => {
  const phone = normalizeGhanaPhone(req.params.phone);
  const { zone_id } = req.query;

  let query, params;
  if (zone_id) {
    query = 'UPDATE subscribers SET is_active=false WHERE phone=$1 AND zone_id=$2';
    params = [phone, zone_id];
  } else {
    query = 'UPDATE subscribers SET is_active=false WHERE phone=$1';
    params = [phone];
  }

  const result = await db.query(query, params);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Subscriber not found' });
  res.json({ success: true, message: 'Unsubscribed successfully' });
});

// GET /api/subscribers — operator: list all (paginated)
router.get('/', authenticateOperator, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const zone = req.query.zone;

  let query = `
    SELECT s.id, s.phone, s.name, z.name as zone_name, s.language,
           s.is_active, s.subscribed_at, s.last_alerted_at
    FROM subscribers s
    LEFT JOIN zones z ON z.id = s.zone_id
    WHERE 1=1
  `;
  const params = [];
  if (zone) { params.push(zone); query += ` AND z.slug=$${params.length}`; }
  query += ` ORDER BY s.subscribed_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
  params.push(limit, offset);

  const { rows } = await db.query(query, params);
  const { rows: countRows } = await db.query('SELECT COUNT(*) FROM subscribers WHERE is_active=true');

  res.json({
    subscribers: rows,
    total: parseInt(countRows[0].count),
    page, limit,
  });
});

module.exports = router;
