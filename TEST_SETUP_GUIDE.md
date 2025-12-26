/**
 * Test Setup Guide for Five Talents
 * 
 * This guide outlines how to set up and expand test coverage
 */

# Test Setup & Quality Assurance Guide

## Current Status

**What's Working:**
- ✅ TypeScript compilation (after TS server restart)
- ✅ API endpoints (runtime tested via Stripe test page)
- ✅ Database migrations
- ✅ Stripe integration (webhook verification)
- ✅ Security gate

**What Needs Testing:**
- API request validation
- Webhook event handling edge cases
- Payment failure scenarios
- Concurrent check-ins
- Database constraints

## Quick Setup: Add Basic Test Suite

### 1. Current Test Setup
```json
// package.json already has Jest configured
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### 2. Create Your First API Test

Create `src/__tests__/api/checkin.test.ts`:

\`\`\`typescript
import { POST } from '@/app/api/checkin/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';

jest.mock('@/lib/db');

describe('POST /api/checkin', () => {
  it('should require personId, eventId, organizationId', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkin', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should check in a person successfully', async () => {
    // Mock database responses
    (prisma.person.findUnique as jest.Mock).mockResolvedValue({
      id: 'person-123',
      role: 'YOUTH',
    });

    (prisma.event.findUnique as jest.Mock).mockResolvedValue({
      id: 'event-123',
    });

    (prisma.attendance.upsert as jest.Mock).mockResolvedValue({
      id: 'attendance-123',
      status: 'CHECKED_IN',
    });

    const request = new NextRequest('http://localhost:3000/api/checkin', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'default-org',
        eventId: 'event-123',
        personId: 'person-123',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
\`\`\`

### 3. Create Integration Test for Payment Flow

Create `src/__tests__/integration/payment.test.ts`:

\`\`\`typescript
import { POST as createIntent } from '@/app/api/payments/create-intent/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { stripe } from '@/lib/stripe';

jest.mock('@/lib/db');
jest.mock('@/lib/stripe');

describe('Payment Integration', () => {
  it('should create registration and payment intent', async () => {
    (prisma.registration.create as jest.Mock).mockResolvedValue({
      id: 'reg-123',
      organizationId: 'default-org',
      stripePaymentIntentId: 'pi_test_123',
    });

    (stripe.paymentIntents.create as jest.Mock).mockResolvedValue({
      id: 'pi_test_123',
      client_secret: 'secret_123',
    });

    const request = new NextRequest('http://localhost:3000/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'default-org',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+15551234567',
        amount: 5000,
        registrationType: 'YOUTH',
      }),
    });

    const response = await createIntent(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.clientSecret).toBe('secret_123');
  });
});
\`\`\`

### 4. Create Security Tests

Create `src/__tests__/security/validation.test.ts`:

\`\`\`typescript
/**
 * Security and Input Validation Tests
 */

describe('Input Validation', () => {
  it('should reject invalid email addresses', () => {
    const invalidEmails = [
      'invalid',
      'test@',
      '@example.com',
      'test@.com',
    ];

    invalidEmails.forEach(email => {
      expect(isValidEmail(email)).toBe(false);
    });
  });

  it('should reject invalid phone numbers', () => {
    const invalidPhones = [
      '123',
      'abc-def-ghij',
      '555-555', // incomplete
    ];

    invalidPhones.forEach(phone => {
      expect(isValidPhoneNumber(phone)).toBe(false);
    });
  });

  it('should sanitize user inputs', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('<script>');
  });
});

describe('Security Gate', () => {
  it('should reject invalid security codes', async () => {
    const response = await testSecurityGate('wrong-code');
    expect(response.authorized).toBe(false);
  });

  it('should accept valid security code', async () => {
    const response = await testSecurityGate('808080');
    expect(response.authorized).toBe(true);
  });
});
\`\`\`

## Testing Best Practices

### API Testing Checklist
```
□ Valid requests succeed (200)
□ Missing required fields fail (400)
□ Invalid data formats fail (400)
□ Unauthorized requests fail (401/403)
□ Non-existent resources fail (404)
□ Rate limiting works (429)
□ Database constraints enforced
□ Error messages are helpful
```

### Webhook Testing Checklist
```
□ Valid signatures accepted
□ Invalid signatures rejected
□ Missing metadata handled gracefully
□ Idempotency (duplicate events handled)
□ Failed operations logged
□ Success operations logged
□ Registration status updated correctly
□ Payment transactions recorded
```

### Security Checklist
```
□ Environment variables never logged
□ Passwords never in error messages
□ Admin endpoints require authentication
□ Rate limiting on public endpoints
□ Input validation on all endpoints
□ CORS properly configured
□ No SQL injection vulnerabilities
□ No XSS vulnerabilities
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- api/checkin.test.ts
```

## Coverage Targets

```
Statements:   > 80%
Branches:     > 75%
Functions:    > 80%
Lines:        > 80%
```

## Next Steps

1. **This Week:**
   - Add basic API endpoint tests
   - Add security input validation tests
   - Aim for 30% coverage

2. **Next Week:**
   - Add integration tests for payment flow
   - Add webhook event tests
   - Aim for 60% coverage

3. **Before Production:**
   - Add E2E tests with Cypress
   - Add load testing
   - Achieve 80%+ coverage
   - Security audit complete
   - Performance baseline established

## Tools Recommended

```bash
# Already installed:
- Jest (testing framework)
- TypeScript (type safety)

# Consider adding:
npm install --save-dev \
  supertest \           # API testing
  jest-mock-extended \  # Better mocking
  @testing-library/react \ # Component testing
  cypress \             # E2E testing
  @types/jest           # TypeScript support for Jest
```

## Example: Running a Specific Test

```bash
npm test -- --testPathPattern=checkin --verbose
```

This will run only tests matching "checkin" with detailed output.
