// routes/auth.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const { rows } = await db.query(
    'SELECT * FROM operators WHERE email=$1 AND is_active=true',
    [email.toLowerCase()]
  );
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

  const op = rows[0];
  const valid = await bcrypt.compare(password, op.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  await db.query('UPDATE operators SET last_login=NOW() WHERE id=$1', [op.id]);

  const token = jwt.sign(
    { id: op.id, email: op.email, role: op.role, name: op.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    operator: { id: op.id, email: op.email, name: op.name, role: op.role },
  });
});

// POST /api/auth/change-password
router.post('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const { rows } = await db.query('SELECT * FROM operators WHERE email=$1', [email]);
  if (!rows.length) return res.status(404).json({ error: 'Operator not found' });

  const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Current password incorrect' });

  const hash = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE operators SET password_hash=$1 WHERE id=$2', [hash, rows[0].id]);
  res.json({ success: true });
});

module.exports = router;
