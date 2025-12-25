# Stripe Integration - Implementation Checklist

## Phase 1: Preparation (5 minutes)

- [ ] Go to [Stripe Dashboard](https://dashboard.stripe.com) and log in
- [ ] Navigate to Developers > API Keys
- [ ] Copy your **Secret Key** (sk_test_...)
- [ ] Copy your **Publishable Key** (pk_test_...)
- [ ] Keep dashboard open for webhook setup

## Phase 2: Backend Setup (10 minutes)

### Install Package
```bash
npm install stripe
npm install --save-dev @types/stripe
```
- [ ] Stripe package installed
- [ ] Type definitions installed

### Environment Variables
Create/update `.env.local`:
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER_FOR_NOW
```
- [ ] STRIPE_SECRET_KEY added
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY added
- [ ] STRIPE_WEBHOOK_SECRET added (can be placeholder for now)

### Database Migration
```bash
npx prisma migrate dev --name add_stripe_models
```
- [ ] Migration created successfully
- [ ] Registration table created
- [ ] PaymentTransaction table created
- [ ] Prisma client regenerated

### Verify Files Exist
- [ ] ✅ `src/lib/stripe.ts` - Stripe utilities
- [ ] ✅ `src/app/api/payments/create-intent/route.ts` - Payment intent API
- [ ] ✅ `src/app/api/webhooks/stripe/route.ts` - Webhook handler
- [ ] ✅ `src/app/api/registrations/route.ts` - Registration CRUD
- [ ] ✅ `src/app/api/registrations/[id]/route.ts` - Individual registration

## Phase 3: Webhook Setup (10 minutes)

### Option A: Local Testing with Stripe CLI

1. Install Stripe CLI from https://stripe.com/docs/stripe-cli
```bash
stripe login
```
- [ ] Stripe CLI installed
- [ ] Logged in to Stripe account

2. Start webhook listener in a new terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
- [ ] Webhook listener started
- [ ] Note your webhook signing secret that appears in the output

3. Add webhook secret to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890...
```
- [ ] Webhook signing secret added to .env.local

### Option B: Production Webhook Setup (for later)

When deploying to production:
- [ ] Go to Stripe Dashboard > Developers > Webhooks
- [ ] Click "Add endpoint"
- [ ] Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
- [ ] Copy signing secret to production `.env`

## Phase 4: Test API Endpoints (5 minutes)

### Start Development Server
```bash
npm run dev
```
- [ ] Server running on http://localhost:3000

### Test Create Payment Intent
```bash
curl -X POST http://localhost:3000/api/payments/create-intent \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "default-org",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+15551234567",
    "amount": 5000,
    "registrationType": "YOUTH"
  }'
```
- [ ] Returns 201 with clientSecret
- [ ] Registration created in database
- [ ] Stripe Payment Intent created

### Check Database
```bash
npx prisma studio
```
- [ ] Open Prisma Studio in browser
- [ ] Check Registration table has new record
- [ ] Verify stripePaymentIntentId is set
- [ ] [ ] Close Prisma Studio

## Phase 5: Frontend Integration (20 minutes)

### Install Stripe React Libraries
```bash
npm install @stripe/react-stripe-js @stripe/js
```
- [ ] @stripe/react-stripe-js installed
- [ ] @stripe/js installed

### Create Registration Form Component
Create `src/components/RegistrationForm.tsx` (use template from STRIPE_IMPLEMENTATION_SUMMARY.md)
- [ ] Component file created
- [ ] Imports Stripe libraries
- [ ] Has form inputs for name, email, phone
- [ ] Calls POST /api/payments/create-intent
- [ ] Uses Stripe Payment Element
- [ ] Handles success/error states
- [ ] Loads test public key from environment

### Create Registration Page
Create `src/app/registration/page.tsx`:
```tsx
'use client';

import { RegistrationForm } from '@/components/RegistrationForm';

export default function RegistrationPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Event Registration</h1>
        <RegistrationForm />
      </div>
    </div>
  );
}
```
- [ ] Page created
- [ ] Imports and displays RegistrationForm
- [ ] Styled appropriately

## Phase 6: Test Payment Flow (15 minutes)

### Start All Services
```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Stripe webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3: Prisma Studio (optional)
npx prisma studio
```
- [ ] All three services running

### Test Successful Payment
1. Navigate to http://localhost:3000/registration
2. Fill form:
   - Name: Test User
   - Email: test@example.com
   - Phone: +15551234567
3. Use test card: **4242 4242 4242 4242**
   - Expiry: 12/25 (any future date)
   - CVC: 123 (any 3 digits)
4. Click "Pay"

Expected Results:
- [ ] Form submits successfully
- [ ] No error messages appear
- [ ] Stripe processes payment
- [ ] Webhook fires in Stripe CLI terminal
- [ ] Check Prisma Studio:
  - [ ] Registration status changed to "registered"
  - [ ] paymentStatus changed to "completed"
  - [ ] PaymentTransaction record created
  - [ ] amountPaid shows 5000 (or amount you entered)

### Test Failed Payment
1. Navigate to http://localhost:3000/registration
2. Use test card: **4000 0000 0000 0002** (will be declined)
3. Click "Pay"

Expected Results:
- [ ] Error message appears: "Your card was declined"
- [ ] Payment not processed
- [ ] Registration stays in "pending" status
- [ ] No PaymentTransaction created

### Test Refund (Manual)
1. In Stripe Dashboard > Payments > Charges
2. Find test charge from successful payment
3. Click charge
4. Click "Refund Charge"
5. Enter refund amount and click "Refund"

Expected Results:
- [ ] Webhook fires for charge.refunded
- [ ] Registration status changes to "cancelled"
- [ ] paymentStatus changes to "refunded"
- [ ] New PaymentTransaction created with status "refunded"

## Phase 7: Admin Page (Optional)

Create `src/app/admin/registrations/page.tsx` to:
- [ ] List all registrations
- [ ] Filter by status and payment status
- [ ] View registration details
- [ ] Process refunds
- [ ] Export as CSV (future)

## Phase 8: Production Deployment (Future)

When ready to go live:
- [ ] Switch to live Stripe keys (sk_live_, pk_live_)
- [ ] Update .env in production
- [ ] Update webhook endpoint in Stripe Dashboard
- [ ] Enable HTTPS
- [ ] Test full flow in production
- [ ] Set up monitoring/alerting
- [ ] Configure email notifications
- [ ] Document refund policy

## Troubleshooting Checklist

If something doesn't work:

### Payment Intent Creation Fails
- [ ] Check environment variables are set
- [ ] Run `echo $STRIPE_SECRET_KEY` to verify
- [ ] Check Stripe API key format (should start with sk_test_ or sk_live_)
- [ ] Check API key has correct permissions in Stripe Dashboard

### Webhook Not Being Called
- [ ] Verify Stripe CLI is running
- [ ] Check webhook endpoint in Stripe CLI output
- [ ] Use `stripe trigger payment_intent.succeeded` to test
- [ ] Check webhook secret in .env.local
- [ ] Check browser console for errors

### Database Errors
- [ ] Run `npx prisma migrate reset` to reset database
- [ ] Check .env DATABASE_URL is set correctly
- [ ] Verify schema changes were applied: `npx prisma studio`
- [ ] Check migration folder for status files

### Payment Element Not Showing
- [ ] Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
- [ ] Check it's the correct publishable key (pk_test_ or pk_live_)
- [ ] Clear browser cache and hard refresh
- [ ] Check browser console for JavaScript errors

## Quick Reference Commands

```bash
# Check if Stripe package installed
npm list stripe

# Test environment variables
echo $STRIPE_SECRET_KEY
echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Run database migration
npx prisma migrate dev

# Reset database completely
npx prisma migrate reset

# View database
npx prisma studio

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger webhook event
stripe trigger payment_intent.succeeded

# Check API endpoint
curl -X GET http://localhost:3000/api/registrations?organizationId=default-org
```

## Success Criteria

You'll know everything is working when:

✅ Payment intent is created without errors
✅ Registration record appears in database with pending status
✅ Stripe payment form loads in browser
✅ Test payment processes successfully
✅ Webhook fires and shows in Stripe CLI
✅ Registration status updates to "registered" after payment
✅ PaymentTransaction record created in database
✅ Webhook signing secret is verified without errors

## Next Steps After Completion

1. **Email Notifications**
   - Send confirmation email after successful registration
   - Send receipt with payment details

2. **Admin Dashboard**
   - Create registration management page
   - View payment history
   - Process refunds
   - Export registrations

3. **Event Management**
   - Link registrations to events
   - Set registration fees per event
   - Track capacity and registrations

4. **Reporting**
   - Registration statistics
   - Revenue tracking
   - Payment method breakdown

## Support Resources

- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe React Library](https://stripe.com/docs/stripe-js/react)
- [Webhook Verification](https://stripe.com/docs/webhooks/signatures)
- [Test Cards](https://stripe.com/docs/testing)

---

**Last Updated**: December 25, 2025
**Status**: Ready for implementation
