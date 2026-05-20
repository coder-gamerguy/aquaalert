// tests/zones.test.js
const request = require('supertest');
const { app } = require('../server');

// Mock DB and SMS so tests don't need real Postgres or Hubtel
jest.mock('../db', () => ({
  query: jest.fn(),
}));
jest.mock('../services/smsService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true, provider: 'mock', messageId: 'test-123' }),
  sendBulkSMS: jest.fn().mockResolvedValue({ sent: 5, failed: 0, details: [] }),
  buildMessage: jest.fn().mockReturnValue({ en: 'Test message', tw: 'Test message TW' }),
  normalizeGhanaPhone: jest.fn(p => p.replace(/^0/, '+233')),
}));
jest.mock('../services/notifyService', () => ({
  notifyZoneOpen: jest.fn().mockResolvedValue({ alertId: 1, sent: 5, failed: 0 }),
  notifyZoneClose: jest.fn().mockResolvedValue({ alertId: 2, sent: 5, failed: 0 }),
  sendEmergencyBroadcast: jest.fn().mockResolvedValue({ sent: 100, failed: 2 }),
}));

const db = require('../db');

// JWT for protected routes
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-secret-key';
const testToken = jwt.sign({ id: 1, email: 'test@gwcl.gov.gh', role: 'admin' }, 'test-secret-key');

describe('GET /api/zones', () => {
  it('returns list of zones', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, slug: 'lamashegu', name: 'Lamashegu', status: 'open', flow_pct: 80, subscriber_count: 500 },
        { id: 2, slug: 'choggu', name: 'Choggu', status: 'closed', flow_pct: 0, subscriber_count: 300 },
      ],
    });

    const res = await request(app).get('/api/zones');
    expect(res.status).toBe(200);
    expect(res.body.zones).toHaveLength(2);
    expect(res.body.zones[0].name).toBe('Lamashegu');
    expect(res.body.zones[0].status).toBe('open');
  });
});

describe('POST /api/zones/:id/open', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request(app).post('/api/zones/1/open');
    expect(res.status).toBe(401);
  });

  it('opens zone and triggers notifications when authenticated', async () => {
    db.query.mockResolvedValueOnce({ rows: [] }); // UPDATE zones
    const res = await request(app)
      .post('/api/zones/1/open')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ flow_pct: 85 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sent).toBe(5);
  });
});

describe('POST /api/zones/:id/close', () => {
  it('closes zone when authenticated', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/zones/1/close')
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/alerts', () => {
  it('returns recent alerts', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, type: 'open', message_en: 'Water flowing in Lamashegu', zone_name: 'Lamashegu', created_at: new Date() },
      ],
    });
    const res = await request(app).get('/api/alerts');
    expect(res.status).toBe(200);
    expect(res.body.alerts).toHaveLength(1);
    expect(res.body.alerts[0].type).toBe('open');
  });
});

describe('POST /api/subscribers', () => {
  it('registers a new subscriber', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Lamashegu' }] }) // zone check
      .mockResolvedValueOnce({ rows: [] }) // existing check
      .mockResolvedValueOnce({ rows: [] }) // insert
      .mockResolvedValueOnce({ rows: [] }); // update count

    const res = await request(app)
      .post('/api/subscribers')
      .send({ phone: '0244123456', zone_id: 1, name: 'Test User' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects missing phone number', async () => {
    const res = await request(app)
      .post('/api/subscribers')
      .send({ zone_id: 1 });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('rejects invalid zone_id', async () => {
    const res = await request(app)
      .post('/api/subscribers')
      .send({ phone: '0244123456', zone_id: 'abc' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/broadcast', () => {
  it('rejects non-operators', async () => {
    const res = await request(app).post('/api/broadcast').send({ message: 'Test' });
    expect(res.status).toBe(401);
  });

  it('sends broadcast when authenticated', async () => {
    const res = await request(app)
      .post('/api/broadcast')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ message: 'Emergency: water supply suspended until 8PM.' });
    expect(res.status).toBe(200);
    expect(res.body.sent).toBe(100);
  });

  it('rejects empty message', async () => {
    const res = await request(app)
      .post('/api/broadcast')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ message: '' });
    expect(res.status).toBe(400);
  });
});

describe('GET /health', () => {
  it('returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('AquaAlert Tamale API');
  });
});
