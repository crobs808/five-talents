# Stripe Integration - Implementation Summary

## ✅ What's Been Set Up

### 1. Core Stripe Library (`src/lib/stripe.ts`)
- Stripe client initialization
- Payment intent creation and management
- Refund handling
- Webhook secret management
- Error handling with logging

### 2. API Endpoints Created

#### Payment Processing
- **POST** `/api/payments/create-intent` - Create registration and payment intent
  - Takes registration details and amount
  - Returns clientSecret for Stripe.js
  - Stores registration in database

#### Registration Management
- **GET** `/api/registrations` - List all registrations
  - Supports filtering by status and payment status
  - Includes payment transaction history
  
- **POST** `/api/registrations` - Create registration without payment
  - For free registrations or manual entries
  
- **GET** `/api/registrations/[id]` - Get specific registration
  - Includes full payment history
  
- **PATCH** `/api/registrations/[id]` - Update registration
  - Can update name, email, phone, notes
  
- **DELETE** `/api/registrations/[id]` - Cancel registration
  - Automatically refunds if payment was made
  - Updates status to "cancelled"

#### Webhook Handler
- **POST** `/api/webhooks/stripe` - Stripe webhook receiver
  - Verifies webhook signatures
  - Handles payment success, failure, and refunds
  - Updates registration status
  - Creates transaction records

### 3. Database Schema Updates (`prisma/schema.prisma`)

**Registration Model**
- Stores registrant information
- Links to Stripe Payment Intent
- Tracks payment and registration status
- Supports event linking

**PaymentTransaction Model**
- Tracks all payment events
- Linked to registrations
- Stores Stripe event IDs for idempotency
- Includes metadata for debugging

**Organization Model Updates**
- Added relationships to Registration and PaymentTransaction models

### 4. Documentation Created

- `STRIPE_INTEGRATION_SETUP.md` - High-level overview
- `STRIPE_SETUP_INSTRUCTIONS.md` - Step-by-step setup guide
- `STRIPE_API_QUICK_REFERENCE.md` - API reference and testing guide

## 🔧 Next Steps to Complete Integration

### 1. Install Stripe Package
```bash
npm install stripe
npm install --save-dev @types/stripe
```

### 2. Get Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get Secret Key (sk_test_...)
3. Get Publishable Key (pk_test_...)
4. Set up webhook and get Signing Secret (whsec_...)

### 3. Update Environment Variables
Add to `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

### 4. Run Database Migration
```bash
npx prisma migrate dev --name add_stripe_models
```

This creates the `Registration` and `PaymentTransaction` tables.

### 5. Create Frontend Registration Form Component

You'll need to create `src/components/RegistrationForm.tsx` that:
- Uses Stripe.js and Elements
- Collects registration information
- Calls `/api/payments/create-intent` to get clientSecret
- Uses Stripe Payment Element to handle payment
- Shows success/error messages

### 6. Set Up Local Testing

Use Stripe CLI for webhook testing:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 7. Create Admin Page for Registrations

Create `src/app/admin/registrations/page.tsx` to:
- View all registrations
- Filter by status/payment
- Process refunds
- Export registration data

## 📋 API Flow Example

### Create a Registration with Payment

```javascript
// 1. Frontend calls the create-intent endpoint
const response = await fetch('/api/payments/create-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    organizationId: 'default-org',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phoneNumber: '+15551234567',
    amount: 5000,  // $50.00 in cents
    registrationType: 'YOUTH',
    eventId: 'event-123'
  })
});

const { clientSecret, registration } = await response.json();

// 2. Frontend uses clientSecret with Stripe.js
const result = await stripe.confirmPayment({
  elements,
  clientSecret,
  confirmParams: {
    return_url: 'https://example.com/success'
  }
});

// 3. Stripe sends webhook to backend
// POST /api/webhooks/stripe { event: 'payment_intent.succeeded' }

// 4. Webhook handler updates registration
// Registration status: 'registered'
// Payment status: 'completed'
// Creates PaymentTransaction record
```

## 🔐 Security Implementation

✅ **Environment Variables**
- Secret key only in .env.local (never in git)
- Publishable key safe for browser

✅ **Webhook Security**
- Signature verification using STRIPE_WEBHOOK_SECRET
- Event ID stored to prevent duplicate processing

✅ **Payment Handling**
- Never stores full card details
- Uses Stripe's Payment Element (PCI compliant)
- Amount validated before processing

✅ **Data Isolation**
- Organization-based filtering
- User data not mixed between organizations

## 📊 Database Relationships

```
Organization
    ├── Registration
    │   └── PaymentTransaction
    │
    └── PaymentTransaction
        └── (back to Registration)
```

## 🧪 Testing Commands

```bash
# Check environment variables are set
echo $STRIPE_SECRET_KEY

# Run database migration
npx prisma migrate dev

# Start development server
npm run dev

# In another terminal, start Stripe webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test payment intent creation
curl -X POST http://localhost:3000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "default-org",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "amount": 1000
  }'

# Test payment success webhook
stripe trigger payment_intent.succeeded
```

## 📚 Frontend Component Template

```tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

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
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'default-org',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          amount: 5000
        })
      });

      const { clientSecret } = await res.json();

      // Confirm payment
      const { error } = await stripe!.confirmPayment({
        elements: elements!,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/success`
        }
      });

      if (error) {
        setError(error.message || 'Payment failed');
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-600">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}
```

## ✨ What Works After Setup

✅ Registration form with payment processing
✅ Stripe webhook handling
✅ Automatic status updates on successful payment
✅ Refund processing for cancelled registrations
✅ Payment transaction history
✅ Organization-based registration filtering
✅ Registration data export capability (add later)
✅ Email notifications (add later)

## 🎯 To-Do for Completion

- [ ] Install stripe package
- [ ] Add environment variables
- [ ] Run database migration
- [ ] Create registration form component
- [ ] Create admin registrations page
- [ ] Add email notifications
- [ ] Test full payment flow
- [ ] Set up webhook in Stripe Dashboard
- [ ] Switch to live keys when ready

