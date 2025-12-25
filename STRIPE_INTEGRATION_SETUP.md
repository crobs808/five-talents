# Stripe Integration Setup Guide

## 1. Install Stripe Package

```bash
npm install stripe
npm install --save-dev @types/stripe
```

## 2. Environment Variables

Add to `.env.local`:
```
# Stripe API Keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_... # Keep this secret, server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Safe for browser
STRIPE_WEBHOOK_SECRET=whsec_... # For webhook verification
```

## 3. Database Schema Updates

Add these models to `prisma/schema.prisma`:

```prisma
model Registration {
  id            String   @id @default(cuid())
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  // Registrant info
  firstName     String
  lastName      String
  email         String
  phoneNumber   String?
  
  // Registration details
  eventId       String?  // Link to event if applicable
  registrationType String // e.g., "YOUTH", "ADULT", "FAMILY"
  
  // Payment info
  stripeCustomerId String?
  stripePaymentIntentId String?
  paymentStatus String   // "pending" | "completed" | "failed" | "refunded"
  amount        Int      // Amount in cents
  amountPaid    Int      @default(0)
  
  // Status
  status        String   @default("pending") // "pending" | "registered" | "cancelled"
  notes         String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([organizationId])
  @@index([email])
  @@index([stripeCustomerId])
  @@index([paymentStatus])
}

model PaymentTransaction {
  id            String   @id @default(cuid())
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  
  registrationId String?
  registration  Registration? @relation(fields: [registrationId], references: [id], onDelete: SetNull)
  
  stripeEventId String?  // Stripe event ID for idempotency
  stripePaymentIntentId String
  
  amount        Int      // Amount in cents
  currency      String   @default("usd")
  status        String   // "pending" | "succeeded" | "failed" | "refunded"
  
  description   String?
  metadata      String?  // JSON string
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([organizationId])
  @@index([stripePaymentIntentId])
  @@index([registrationId])
}
```

Run migrations:
```bash
npx prisma migrate dev --name add_stripe_models
```

## 4. Backend API Endpoints to Create

### A. Payment Intent Endpoint
`/api/payments/create-intent`
- Creates a Stripe Payment Intent
- Returns client secret for Stripe payment form

### B. Payment Webhook Endpoint
`/api/webhooks/stripe`
- Handles payment completion events
- Updates registration status
- Creates payment transaction records

### C. Registration Endpoint
`/api/registrations`
- Create new registration
- Link to payment intent
- Store registration data

### D. Registration Details Endpoint
`/api/registrations/[id]`
- Get registration details
- Cancel registration
- Update registration

## 5. Utility Functions Needed

Create `src/lib/stripe.ts`:
```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-04-10',
});

export async function createPaymentIntent(
  amount: number,
  email: string,
  metadata?: Record<string, string>
) {
  return stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    receipt_email: email,
    metadata,
  });
}

export async function getPaymentIntent(intentId: string) {
  return stripe.paymentIntents.retrieve(intentId);
}
```

## 6. Webhook Handler Pattern

Create `src/app/api/webhooks/stripe/route.ts`:
- Listen for `payment_intent.succeeded` events
- Update registration status to "registered"
- Create PaymentTransaction record
- Handle refunds (`charge.refunded`)

## 7. Registration Form Component

Will need to create:
- `src/components/RegistrationForm.tsx` (client-side)
- Stripe payment element integration
- Form validation
- Error handling

## 8. Security Considerations

✅ Store `STRIPE_SECRET_KEY` server-side only
✅ Use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` for browser
✅ Verify webhook signatures with `STRIPE_WEBHOOK_SECRET`
✅ Never expose full payment details in API responses
✅ Use Stripe's built-in PCI compliance (avoid storing card data)
✅ Implement idempotency for payment operations

## 9. Testing Workflow

1. Use Stripe test mode keys
2. Test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
3. Any future expiry date, any CVC
4. Use `webhook test` in Stripe CLI for local testing

## Next Steps

1. Get API keys from Stripe Dashboard
2. Install stripe package
3. Set up environment variables
4. Run database migrations
5. Create API endpoints (start with `/api/payments/create-intent`)
6. Build registration form component
7. Set up webhook handler
8. Test end-to-end flow

