// routes/schedule.js
const router = require('express').Router();
const db = require('../db');
const { authenticateOperator } = require('../middleware/auth');

// GET /api/schedule — all zone schedules (public)
router.get('/', async (req, res) => {
  const { rows } = await db.query(`
    SELECT ss.id, z.name as zone_name, z.slug, ss.day_of_week,
           ss.start_hour, ss.start_min, ss.duration_hrs, ss.is_active
    FROM supply_schedule ss
    JOIN zones z ON z.id = ss.zone_id
    ORDER BY z.name, ss.start_hour
  `);
  res.json({ schedule: rows });
});

// PUT /api/schedule/:id — update a schedule entry (operator)
router.put('/:id', authenticateOperator, async (req, res) => {
  const { day_of_week, start_hour, start_min, duration_hrs, is_active } = req.body;
  await db.query(
    `UPDATE supply_schedule SET day_of_week=$1, start_hour=$2, start_min=$3,
     duration_hrs=$4, is_active=$5 WHERE id=$6`,
    [day_of_week, start_hour, start_min, duration_hrs, is_active, req.params.id]
  );
  res.json({ success: true });
});

module.exports = router;
