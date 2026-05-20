// services/notifyService.js — orchestrates zone alerts and SMS dispatch
const db = require('../db');
const { sendBulkSMS, buildMessage } = require('./smsService');
const logger = require('../utils/logger');

async function notifyZoneOpen(zoneId, operatorEmail, io) {
  const { rows: zoneRows } = await db.query('SELECT * FROM zones WHERE id=$1', [zoneId]);
  if (!zoneRows.length) throw new Error('Zone not found');
  const zone = zoneRows[0];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', hour12: true });

  // Get zone schedule to estimate duration
  const { rows: schedRows } = await db.query(
    'SELECT duration_hrs FROM supply_schedule WHERE zone_id=$1 AND is_active=true LIMIT 1',
    [zoneId]
  );
  const durationHrs = schedRows[0]?.duration_hrs || 3;

  const msgs = buildMessage('open', zone.name, { time: timeStr, duration: durationHrs });

  // Get all active subscribers for this zone who want open alerts
  const { rows: subscribers } = await db.query(
    `SELECT id, phone, language FROM subscribers
     WHERE zone_id=$1 AND is_active=true AND alert_open=true`,
    [zoneId]
  );

  // Log the alert
  const { rows: alertRows } = await db.query(
    `INSERT INTO alerts (zone_id, type, message_en, message_tw, sent_to, triggered_by)
     VALUES ($1, 'open', $2, $3, $4, $5) RETURNING id`,
    [zoneId, msgs.en, msgs.tw, subscribers.length, operatorEmail]
  );
  const alertId = alertRows[0].id;

  // Send SMS
  const recipientsWithLang = subscribers.map(s => ({
    phone: s.phone,
    language: s.language,
    messageTw: msgs.tw,
  }));
  const results = await sendBulkSMS(recipientsWithLang, msgs.en);

  // Update delivery stats
  await db.query(
    'UPDATE alerts SET delivered=$1, failed=$2 WHERE id=$3',
    [results.sent, results.failed, alertId]
  );

  // Update subscriber last_alerted_at
  const phones = subscribers.map(s => s.phone);
  if (phones.length) {
    await db.query(
      `UPDATE subscribers SET last_alerted_at=NOW() WHERE zone_id=$1`,
      [zoneId]
    );
  }

  // Broadcast via WebSocket to operator dashboards
  if (io) {
    io.emit('zone:opened', {
      zoneId,
      zoneName: zone.name,
      alertId,
      subscribersNotified: results.sent,
      timestamp: now.toISOString(),
    });
  }

  logger.info(`Zone open alert sent: ${zone.name} → ${results.sent} SMS delivered, ${results.failed} failed`);
  return { alertId, sent: results.sent, failed: results.failed };
}

async function notifyZoneClose(zoneId, operatorEmail, io) {
  const { rows: zoneRows } = await db.query('SELECT * FROM zones WHERE id=$1', [zoneId]);
  if (!zoneRows.length) throw new Error('Zone not found');
  const zone = zoneRows[0];

  const msgs = buildMessage('close', zone.name, { nextWindow: 'Check schedule or app' });

  const { rows: subscribers } = await db.query(
    `SELECT id, phone, language FROM subscribers
     WHERE zone_id=$1 AND is_active=true AND alert_close=true`,
    [zoneId]
  );

  const { rows: alertRows } = await db.query(
    `INSERT INTO alerts (zone_id, type, message_en, message_tw, sent_to, triggered_by)
     VALUES ($1, 'close', $2, $3, $4, $5) RETURNING id`,
    [zoneId, msgs.en, msgs.tw, subscribers.length, operatorEmail]
  );

  const results = await sendBulkSMS(
    subscribers.map(s => ({ phone: s.phone, language: s.language, messageTw: msgs.tw })),
    msgs.en
  );

  await db.query('UPDATE alerts SET delivered=$1, failed=$2 WHERE id=$3',
    [results.sent, results.failed, alertRows[0].id]);

  if (io) {
    io.emit('zone:closed', { zoneId, zoneName: zone.name, timestamp: new Date().toISOString() });
  }

  return { alertId: alertRows[0].id, sent: results.sent, failed: results.failed };
}

async function sendEmergencyBroadcast(message, zoneIds, operatorEmail, io) {
  let subscriberQuery;
  let queryParams;

  if (zoneIds && zoneIds.length) {
    subscriberQuery = `SELECT DISTINCT phone, language FROM subscribers
      WHERE zone_id = ANY($1) AND is_active=true`;
    queryParams = [zoneIds];
  } else {
    subscriberQuery = `SELECT DISTINCT phone, language FROM subscribers WHERE is_active=true`;
    queryParams = [];
  }

  const { rows: subscribers } = await db.query(subscriberQuery, queryParams);
  const emergencyMsg = `GWCL EMERGENCY: ${message}\nCall 0800-WATER for info. - GWCL Tamale`;

  const results = await sendBulkSMS(
    subscribers.map(s => ({ phone: s.phone, language: s.language })),
    emergencyMsg
  );

  await db.query(
    `INSERT INTO alerts (zone_id, type, message_en, sent_to, delivered, failed, triggered_by)
     VALUES (NULL, 'emergency', $1, $2, $3, $4, $5)`,
    [emergencyMsg, subscribers.length, results.sent, results.failed, operatorEmail]
  );

  if (io) {
    io.emit('emergency:broadcast', { message, subscribersNotified: results.sent });
  }

  return { sent: results.sent, failed: results.failed };
}

module.exports = { notifyZoneOpen, notifyZoneClose, sendEmergencyBroadcast };
