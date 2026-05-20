// routes/broadcast.js
const router = require('express').Router();
const { authenticateOperator } = require('../middleware/auth');
const { sendEmergencyBroadcast } = require('../services/notifyService');

router.post('/', authenticateOperator, async (req, res) => {
  const { message, zone_ids } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const io = req.app.get('io');
  const result = await sendEmergencyBroadcast(message, zone_ids, req.operator.email, io);
  res.json({ success: true, ...result });
});

module.exports = router;
