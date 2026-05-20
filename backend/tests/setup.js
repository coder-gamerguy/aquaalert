// tests/setup.js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/aquaalert_test';
process.env.HUBTEL_CLIENT_ID = 'test-id';
process.env.HUBTEL_CLIENT_SECRET = 'test-secret';
process.env.ARKESEL_API_KEY = 'test-key';

// Silence logger output during tests
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
