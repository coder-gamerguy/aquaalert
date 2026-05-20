// services/scheduleService.js
// Runs every 5 minutes via cron in server.js
// Automatically opens/closes zones based on supply_schedule table
// and sends advance warnings 30 minutes before supply opens

const db = require('../db');
const { notifyZoneOpen, notifyZoneClose } = require('./notifyService');
const { sendBulkSMS, buildMessage } = require('./smsService');
const logger = require('../utils/logger');

async function checkScheduledSupply(io) {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const currentTotalMin = currentHour * 60 + currentMin;

  try {
    // Get all active schedule entries for today
    const { rows: schedules } = await db.query(
      `SELECT ss.*, z.id as zone_id, z.slug, z.name, z.status
       FROM supply_schedule ss
       JOIN zones z ON z.id = ss.zone_id
       WHERE ss.is_active = true AND $1 = ANY(ss.day_of_week)`,
      [dayOfWeek]
    );

    for (const sched of schedules) {
      const startTotalMin = sched.start_hour * 60 + sched.start_min;
      const durationMin = Math.round(sched.duration_hrs * 60);
      const endTotalMin = startTotalMin + durationMin;

      // === OPEN: within 0–5 minutes of scheduled start ===
      if (
        currentTotalMin >= startTotalMin &&
        currentTotalMin < startTotalMin + 5 &&
        sched.status !== 'open'
      ) {
        logger.info(`Auto-opening zone: ${sched.name} (scheduled ${sched.start_hour}:${String(sched.start_min).padStart(2,'0')})`);

        const estimatedClose = new Date(now.getTime() + durationMin * 60 * 1000);
        await db.query(
          `UPDATE zones SET status='open', flow_pct=80, opened_at=NOW(),
           estimated_close_at=$1, updated_at=NOW() WHERE id=$2`,
          [estimatedClose, sched.zone_id]
        );

        await notifyZoneOpen(sched.zone_id, 'schedule@system', io);
      }

      // === CLOSE: within 0–5 minutes of scheduled end ===
      if (
        currentTotalMin >= endTotalMin &&
        currentTotalMin < endTotalMin + 5 &&
        sched.status === 'open'
      ) {
        logger.info(`Auto-closing zone: ${sched.name}`);

        await db.query(
          `UPDATE zones SET status='closed', flow_pct=0,
           estimated_close_at=NULL, updated_at=NOW() WHERE id=$1`,
          [sched.zone_id]
        );

        await notifyZoneClose(sched.zone_id, 'schedule@system', io);
      }

      // === ADVANCE WARNING: 30 min before opening ===
      const advanceMin = startTotalMin - 30;
      if (
        currentTotalMin >= advanceMin &&
        currentTotalMin < advanceMin + 5 &&
        sched.status !== 'open'
      ) {
        logger.info(`Sending 30-min advance warning for: ${sched.name}`);
        await sendAdvanceWarning(sched, io);
      }
    }
  } catch (err) {
    logger.error('scheduleService error:', err.message);
  }
}

async function sendAdvanceWarning(sched, io) {
  const timeStr = `${String(sched.start_hour).padStart(2,'0')}:${String(sched.start_min).padStart(2,'0')}`;
  const msgs = buildMessage('advance', sched.name, { time: timeStr });

  const { rows: subscribers } = await db.query(
    `SELECT phone, language FROM subscribers
     WHERE zone_id=$1 AND is_active=true AND alert_advance=true`,
    [sched.zone_id]
  );

  if (!subscribers.length) return;

  const { rows: alertRows } = await db.query(
    `INSERT INTO alerts (zone_id, type, message_en, message_tw, sent_to, triggered_by)
     VALUES ($1, 'advance', $2, $3, $4, 'schedule@system') RETURNING id`,
    [sched.zone_id, msgs.en, msgs.tw, subscribers.length]
  );

  const results = await sendBulkSMS(
    subscribers.map(s => ({ phone: s.phone, language: s.language, messageTw: msgs.tw })),
    msgs.en
  );

  await db.query(
    'UPDATE alerts SET delivered=$1, failed=$2 WHERE id=$3',
    [results.sent, results.failed, alertRows[0].id]
  );

  if (io) {
    io.emit('advance:warning', { zoneName: sched.name, supplyTime: timeStr });
  }

  logger.info(`Advance warning sent for ${sched.name}: ${results.sent} delivered`);
}

// Get next supply window for a zone (used in frontend schedule tab)
async function getNextSupplyWindow(zoneId) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const currentTotalMin = now.getHours() * 60 + now.getMinutes();

  const { rows } = await db.query(
    `SELECT * FROM supply_schedule WHERE zone_id=$1 AND is_active=true`,
    [zoneId]
  );

  if (!rows.length) return null;

  let earliest = null;
  let earliestDiff = Infinity;

  for (const sched of rows) {
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const checkDay = (dayOfWeek + dayOffset) % 7;
      if (!sched.day_of_week.includes(checkDay)) continue;

      const startMin = sched.start_hour * 60 + sched.start_min;
      const diffMin = dayOffset === 0
        ? startMin - currentTotalMin
        : dayOffset * 1440 + startMin - currentTotalMin;

      if (diffMin > 0 && diffMin < earliestDiff) {
        earliestDiff = diffMin;
        earliest = {
          ...sched,
          minutesUntil: diffMin,
          dayOffset,
          startTime: `${String(sched.start_hour).padStart(2,'0')}:${String(sched.start_min).padStart(2,'0')}`,
        };
      }
    }
  }

  return earliest;
}

module.exports = { checkScheduledSupply, getNextSupplyWindow };
