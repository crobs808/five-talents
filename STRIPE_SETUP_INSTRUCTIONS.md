# Stripe Integration - Setup Instructions

## Step 1: Install Stripe Package

```bash
npm install stripe
npm install --save-dev @types/stripe
```

## Step 2: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Login to your account
3. Click "Developers" → "API Keys" in the left menu
4. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
5. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)

## Step 3: Set Up Webhook Secret

1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
   - For local testing, use Stripe CLI (see below)
4. Select events to listen for:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.refunded`
5. Copy the **Signing Secret** (starts with `whsec_`)

## Step 4: Add Environment Variables

Create/update `.env.local`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

⚠️ **Important**: Only `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe to expose to the browser. Never expose the secret key or webhook secret in client-side code.

## Step 5: Update Database Schema

The schema has been updated with two new models:
- `Registration` - Stores registration information
- `PaymentTransaction` - Tracks all payment transactions

Run the migration:

```bash
npx prisma migrate dev --name add_stripe_models
```

## Step 6: Review Backend API Endpoints

The following endpoints have been created:

### Create Payment Intent
**POST** `/api/payments/create-intent`
```json
{
  "organizationId": "default-org",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+15551234567",
  "amount": 5000,  // in cents ($50.00)
  "registrationType": "YOUTH",
  "eventId": "event123",
  "description": "Registration for Camp"
}
```

Response:
```json
{
  "registration": {...},
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### List Registrations
**GET** `/api/registrations?organizationId=default-org&status=registered&paymentStatus=completed`

### Get Registration Details
**GET** `/api/registrations/{id}`

### Update Registration
**PATCH** `/api/registrations/{id}`

### Cancel Registration (with refund if applicable)
**DELETE** `/api/registrations/{id}`

### Webhook Handler
**POST** `/api/webhooks/stripe` (Stripe only)

## Step 7: Set Up Local Testing with Stripe CLI

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Authenticate with Stripe
stripe login

# Forward webhook events to local development
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will output your webhook signing secret - add it to .env.local
```

## Step 8: Test with Stripe Test Cards

Use these test card numbers in payment forms:

| Card Number | Description |
|---|---|
| `4242 4242 4242 4242` | Success (all scenarios) |
| `4000 0000 0000 0002` | Decline (card_declined) |
| `4000 0000 0000 0069` | Decline (expired_card) |
| `4000 0000 0000 0127` | Decline (incorrect_cvc) |

- Expiry: Any date in the future (e.g., 12/25)
- CVC: Any 3 digits (e.g., 123)

## Step 9: Frontend Implementation

You'll need to create a registration form component that:
1. Calls `/api/payments/create-intent` to get the client secret
2. Uses Stripe's Payment Element or Card Element to handle payment
3. Submits payment confirmation

Install Stripe React library:
```bash
npm install @stripe/react-stripe-js @stripe/js
```

Example component structure:
```tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function RegistrationForm() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Create payment intent
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: 'default-org',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        amount: 5000,
      }),
    });

    const { clientSecret } = await response.json();

    // Confirm payment
    const result = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/registration-success`,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit">Pay</button>
      {error && <div>{error}</div>}
    </form>
  );
}
```

## Step 10: Testing Workflow

1. ✅ Start development server: `npm run dev`
2. ✅ Create a registration with `POST /api/payments/create-intent`
3. ✅ Use Stripe test card `4242 4242 4242 4242`
4. ✅ Payment should succeed
5. ✅ Check webhook delivery in Stripe Dashboard
6. ✅ Verify registration status is updated to "registered"

## Troubleshooting

### Webhook not being called
- Check webhook endpoint in Stripe Dashboard
- Use Stripe CLI to test: `stripe trigger payment_intent.succeeded`
- Verify webhook secret in `.env.local`

### Payment Intent creation fails
- Check environment variables are set correctly
- Verify Stripe API keys have appropriate permissions
- Check error logs in Stripe Dashboard

### Database migration fails
- Ensure Prisma is up to date: `npm install @prisma/client@latest`
- Reset database if needed: `npx prisma migrate reset`

## Security Checklist

- ✅ `STRIPE_SECRET_KEY` only in `.env.local` (never in git)
- ✅ `NEXT_PUBLIC_*` is safe for browser, but keep others private
- ✅ Verify webhook signatures before processing
- ✅ Always update database after successful payment
- ✅ Never store full card details (use Stripe's Payment Element)
- ✅ Use HTTPS in production
- ✅ Implement idempotency for payment operations

## Next Steps

1. Create registration form component
2. Add admin page to view registrations
3. Send confirmation emails after successful registration
4. Add refund/cancellation handling UI
5. Implement receipts and invoicing
6. Add analytics for registration data

## Resources

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe React Library](https://stripe.com/docs/stripe-js/react)
- [Payment Element Guide](https://stripe.com/docs/payments/payment-element)
- [Webhook Security](https://stripe.com/docs/webhooks/signatures)
