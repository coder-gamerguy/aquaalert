// services/smsService.js — Ghana SMS gateway integration
// Primary: Hubtel | Fallback: Arkesel
const axios = require('axios');
const logger = require('../utils/logger');

// ─── Hubtel SMS (Primary) ──────────────────────────────────────────────────
async function sendViaHubtel(phone, message) {
  const normalized = normalizeGhanaPhone(phone);
  const url = 'https://smsc.hubtel.com/v1/messages/send';
  const params = {
    clientid: process.env.HUBTEL_CLIENT_ID,
    clientsecret: process.env.HUBTEL_CLIENT_SECRET,
    from: process.env.HUBTEL_SENDER_ID || 'AquaAlert',
    to: normalized,
    content: message,
  };

  const res = await axios.get(url, { params, timeout: 8000 });
  if (res.data.status === 0) {
    return { success: true, provider: 'hubtel', messageId: res.data.messageId };
  }
  throw new Error(`Hubtel error: ${res.data.message}`);
}

// ─── Arkesel SMS (Fallback) ────────────────────────────────────────────────
async function sendViaArkesel(phone, message) {
  const normalized = normalizeGhanaPhone(phone);
  const res = await axios.get('https://sms.arkesel.com/sms/api', {
    params: {
      action: 'send-sms',
      api_key: process.env.ARKESEL_API_KEY,
      to: normalized,
      from: process.env.ARKESEL_SENDER_ID || 'GWCL-Alert',
      sms: message,
    },
    timeout: 8000,
  });
  if (res.data.code === 'ok') {
    return { success: true, provider: 'arkesel', messageId: res.data.data?.[0]?.['message-id'] };
  }
  throw new Error(`Arkesel error: ${JSON.stringify(res.data)}`);
}

// ─── Main send function with automatic fallback ────────────────────────────
async function sendSMS(phone, message) {
  // In development, just log — don't send real SMS
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`[SMS DEV] To: ${phone} | Msg: ${message}`);
    return { success: true, provider: 'dev-mock', messageId: `dev-${Date.now()}` };
  }

  try {
    return await sendViaHubtel(phone, message);
  } catch (hubtelErr) {
    logger.warn(`Hubtel failed for ${phone}: ${hubtelErr.message} — trying Arkesel`);
    try {
      return await sendViaArkesel(phone, message);
    } catch (arkeselErr) {
      logger.error(`Both SMS providers failed for ${phone}`, {
        hubtel: hubtelErr.message,
        arkesel: arkeselErr.message,
      });
      return { success: false, provider: null, error: arkeselErr.message };
    }
  }
}

// ─── Bulk send (for zone alerts) ──────────────────────────────────────────
async function sendBulkSMS(recipients, message) {
  // Process in batches of 50 to avoid overwhelming the API
  const BATCH_SIZE = 50;
  const results = { sent: 0, failed: 0, details: [] };

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (r) => {
      const msg = r.language === 'tw' && r.messageTw ? r.messageTw : message;
      const result = await sendSMS(r.phone, msg);
      if (result.success) results.sent++;
      else results.failed++;
      results.details.push({ phone: r.phone, ...result });
      return result;
    });
    await Promise.allSettled(promises);

    // Small delay between batches
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

// ─── Message templates ────────────────────────────────────────────────────
function buildMessage(type, zoneName, opts = {}) {
  const templates = {
    open: `AquaAlert: Water is NOW flowing in ${zoneName}. Supply started ${opts.time || 'just now'}. Est. ${opts.duration || '3'} hours. Fill your tanks now!\n- GWCL Tamale. Reply STOP to unsubscribe.`,

    advance: `AquaAlert: Water supply in ${zoneName} starts in ~30 minutes (around ${opts.time}). Prepare your containers.\n- GWCL Tamale`,

    close: `AquaAlert: Water supply in ${zoneName} will END in ~30 minutes. Next supply: ${opts.nextWindow || 'check schedule'}.\n- GWCL Tamale`,

    emergency: `GWCL ALERT: ${opts.message || 'Important update for your zone.'} For info: 0800-WATER (092837).\n- GWCL Tamale`,

    maintenance: `AquaAlert: Maintenance work in ${zoneName} on ${opts.date}. Supply may be interrupted. We apologise for inconvenience.\n- GWCL Tamale`,

    welcome: `Welcome to AquaAlert! You'll now get water supply alerts for ${zoneName}. Reply STOP anytime to unsubscribe.\n- GWCL Tamale`,
  };

  // Twi (Dagbani) translations — common local language in Tamale
  const templatesTw = {
    open: `AquaAlert: Pi naa ${zoneName} yeli. A bi gbanli ${opts.time || 'ti dana'}. A bi kpe din ${opts.duration || '3'} awula. Tali yeli wula!\n- GWCL Tamale`,
    advance: `AquaAlert: Pi naa ${zoneName} yeli be kpe din awula 30 (${opts.time} poŋ). Tali ni boli ni ti gari.\n- GWCL Tamale`,
  };

  return {
    en: templates[type] || templates.emergency,
    tw: templatesTw[type] || templates[type] || templates.emergency,
  };
}

// ─── Phone normalization for Ghana ────────────────────────────────────────
function normalizeGhanaPhone(phone) {
  let p = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (p.startsWith('0')) p = '233' + p.slice(1);
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

module.exports = { sendSMS, sendBulkSMS, buildMessage, normalizeGhanaPhone };
