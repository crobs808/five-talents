# Stripe Integration - Quick Reference

## Files Created

### Core Libraries
- `src/lib/stripe.ts` - Stripe utility functions and initialization

### API Endpoints
- `src/app/api/payments/create-intent/route.ts` - Create payment intent
- `src/app/api/registrations/route.ts` - List/create registrations
- `src/app/api/registrations/[id]/route.ts` - Get/update/delete registration
- `src/app/api/webhooks/stripe/route.ts` - Stripe webhook handler

### Database
- `prisma/schema.prisma` - Added `Registration` and `PaymentTransaction` models

### Documentation
- `STRIPE_INTEGRATION_SETUP.md` - Setup overview
- `STRIPE_SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `STRIPE_API_QUICK_REFERENCE.md` - This file

## Environment Variables to Add

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Database Models

### Registration Model
```prisma
id                    String (primary key)
organizationId        String (foreign key)
firstName             String
lastName              String
email                 String
phoneNumber           String (optional)
eventId               String (optional)
registrationType      String
stripeCustomerId      String (optional)
stripePaymentIntentId String (optional)
paymentStatus         String (pending|completed|failed|refunded)
amount                Int (cents)
amountPaid            Int (cents)
status                String (pending|registered|cancelled)
notes                 String (optional)
createdAt             DateTime
updatedAt             DateTime
```

### PaymentTransaction Model
```prisma
id                    String (primary key)
organizationId        String (foreign key)
registrationId        String (foreign key, optional)
stripeEventId         String (optional)
stripePaymentIntentId String
amount                Int (cents)
currency              String
status                String (pending|succeeded|failed|refunded)
description           String (optional)
metadata              String (JSON, optional)
createdAt             DateTime
updatedAt             DateTime
```

## API Endpoints Summary

### POST /api/payments/create-intent
**Purpose**: Create a new registration and payment intent
**Input**:
```json
{
  "organizationId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phoneNumber": "string (optional)",
  "amount": 5000,
  "registrationType": "string (optional)",
  "eventId": "string (optional)",
  "description": "string (optional)"
}
```
**Output**:
```json
{
  "registration": {...},
  "clientSecret": "string",
  "paymentIntentId": "string"
}
```

### GET /api/registrations
**Purpose**: List all registrations
**Query Parameters**:
- `organizationId` - Filter by organization
- `status` - Filter by status (pending|registered|cancelled)
- `paymentStatus` - Filter by payment status (pending|completed|failed|refunded)

**Output**: Array of registration objects

### GET /api/registrations/[id]
**Purpose**: Get a specific registration
**Output**: Single registration object with payment transaction history

### PATCH /api/registrations/[id]
**Purpose**: Update registration details
**Input**: Any of (firstName, lastName, email, phoneNumber, notes, registrationType)
**Output**: Updated registration object

### DELETE /api/registrations/[id]
**Purpose**: Cancel registration (triggers refund if applicable)
**Output**: Success message with updated registration

### POST /api/webhooks/stripe
**Purpose**: Handle Stripe events (Stripe only, not called from browser)
**Handles**:
- `payment_intent.succeeded` - Update registration to registered
- `payment_intent.payment_failed` - Mark registration as pending
- `charge.refunded` - Cancel registration and refund

## Frontend Integration

### Install Dependencies
```bash
npm install @stripe/react-stripe-js @stripe/js
```

### Minimal Example
```tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function RegistrationPage() {
  return (
    <Elements stripe={stripePromise}>
      <RegistrationForm />
    </Elements>
  );
}
```

## Payment Flow Diagram

```
1. User fills registration form
   ↓
2. Frontend calls POST /api/payments/create-intent
   ↓
3. Backend creates Registration record (status: pending)
   ↓
4. Backend creates Stripe PaymentIntent
   ↓
5. Backend returns clientSecret to frontend
   ↓
6. Frontend uses clientSecret with Stripe.js
   ↓
7. User enters payment details
   ↓
8. Stripe processes payment
   ↓
9. Stripe sends webhook to POST /api/webhooks/stripe
   ↓
10. Webhook handler updates Registration (status: registered, paymentStatus: completed)
   ↓
11. User receives confirmation
```

## Testing Checklist

- [ ] Environment variables configured
- [ ] Database migration run (`npx prisma migrate dev`)
- [ ] Create test registration with `POST /api/payments/create-intent`
- [ ] Stripe CLI running (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- [ ] Test payment with card `4242 4242 4242 4242`
- [ ] Verify webhook received and processed
- [ ] Check registration status updated to "registered"
- [ ] Verify payment transaction recorded in database

## Common Error Codes

| Code | Issue | Solution |
|------|-------|----------|
| STRIPE_SECRET_KEY missing | API initialization | Add to .env.local |
| Invalid signature | Webhook verification failed | Check STRIPE_WEBHOOK_SECRET |
| No registrationId in metadata | Payment processing | Ensure metadata includes registrationId |
| Foreign key constraint | Event/Registration not found | Check IDs are valid |

## Security Notes

- ✅ Client secret is safe to expose (one-time use)
- ❌ Don't expose STRIPE_SECRET_KEY in browser
- ❌ Don't expose STRIPE_WEBHOOK_SECRET in browser
- ✅ Always verify webhook signatures
- ✅ Never store full card numbers (use Stripe's Payment Element)

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint URL to production domain
- [ ] Enable HTTPS
- [ ] Set up email notifications
- [ ] Configure refund policies
- [ ] Add analytics/reporting
- [ ] Test full payment flow in live mode
- [ ] Set up monitoring/alerting
