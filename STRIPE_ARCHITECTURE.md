# Stripe Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Registration Form Component                      │   │
│  │  - Collects name, email, phone                           │   │
│  │  - Stripe Payment Element                                │   │
│  │  - Uses client secret to process payment                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                       │
│                            │ (1) POST /api/payments/create-intent │
│                            │                                       │
└────────────────────────────┼───────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (Next.js Server)                       │
│                                                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  POST /api/payments/create-intent                          │  │
│  │  ├─ Validate request                                       │  │
│  │  ├─ Create Registration in database (status: pending)      │  │
│  │  └─ Create Stripe PaymentIntent                            │  │
│  │     └─ Return clientSecret                                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                            │                                       │
│                            │ (2) clientSecret                      │
│                            │                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Database (SQLite)                        │  │
│  │                                                             │  │
│  │  Registration Table:                                       │  │
│  │  ├─ id, organizationId, firstName, lastName               │  │
│  │  ├─ email, amount, registrationType                        │  │
│  │  └─ stripePaymentIntentId, paymentStatus, status           │  │
│  │                                                             │  │
│  │  PaymentTransaction Table:                                 │  │
│  │  ├─ id, registrationId                                     │  │
│  │  ├─ stripePaymentIntentId, amount, status                  │  │
│  │  └─ createdAt                                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
         │                                          │
         │ (3) Use clientSecret                      │
         │                                          │
         ▼                                          ▼
    ┌──────────────┐                    ┌─────────────────────┐
    │   Stripe.js  │                    │  Stripe Backend     │
    │   (Browser)  │                    │  (Payment Server)   │
    └──────────────┘                    └─────────────────────┘
         │                                          │
         │ (4) Collect card & process payment      │
         │◄────────────────────────────────────────►│
         │                                          │
         │                                 (5) Payment Success
         │                                          │
         │                                 (6) Webhook
         │                                          │
         └──────────────────────┬──────────────────►│
                                │                  │
                                │ Webhook Event   │
                                │ POST /api/webhooks/stripe
                                │                  │
                                │◄─────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │  Backend Webhook Handler │
                    │  - Verify signature      │
                    │  - Find registration     │
                    │  - Update status         │
                    │  - Create transaction    │
                    └──────────────────────────┘
                                │
                                ▼
                    ┌──────────────────────────┐
                    │   Update Database        │
                    │ - status: registered     │
                    │ - paymentStatus: complete│
                    │ - Create transaction log │
                    └──────────────────────────┘
```

## Data Flow Sequence

```
Time    Actor           Action
────────────────────────────────────────────────────────────────
T1      Frontend        User fills registration form
        │               ├─ First Name
        │               ├─ Last Name
        │               ├─ Email
        │               └─ Phone
        │
T2      Frontend        POST /api/payments/create-intent
        │
T3      Backend         Validate input
        │               ├─ Check required fields
        │               ├─ Check amount > 0
        │               └─ Check email format
        │
T4      Backend         Create Registration record
        │               ├─ organizationId
        │               ├─ firstName, lastName, email
        │               ├─ amount
        │               └─ status = "pending"
        │
T5      Backend         Call Stripe API
        │               └─ stripe.paymentIntents.create()
        │
T6      Stripe          Create Payment Intent
        │               ├─ id: pi_xxx
        │               ├─ client_secret: pi_xxx_secret_xxx
        │               └─ amount, currency, metadata
        │
T7      Backend         Update Registration
        │               └─ stripePaymentIntentId = pi_xxx
        │
T8      Backend         Return to Frontend
        │               ├─ clientSecret
        │               ├─ paymentIntentId
        │               └─ registrationId
        │
T9      Frontend        Return clientSecret
        │
T10     Frontend        Show Stripe Payment Element
        │               └─ User enters card details
        │
T11     User            Enter card number & click Pay
        │               └─ 4242 4242 4242 4242
        │
T12     Stripe.js       Send payment to Stripe
        │
T13     Stripe          Process payment
        │               ├─ Validate card
        │               ├─ Charge amount
        │               └─ Create charge
        │
T14     Stripe          Send webhook event
        │               └─ POST /api/webhooks/stripe
        │               └─ event: payment_intent.succeeded
        │
T15     Backend         Receive webhook
        │               ├─ Extract signature header
        │               ├─ Verify signature
        │               └─ Parse event
        │
T16     Backend         Handle payment_intent.succeeded
        │               ├─ Get registrationId from metadata
        │               ├─ Find Registration record
        │               ├─ Update:
        │               │  ├─ status = "registered"
        │               │  ├─ paymentStatus = "completed"
        │               │  └─ amountPaid = amount
        │               │
        │               └─ Create PaymentTransaction
        │                  ├─ registrationId
        │                  ├─ status = "succeeded"
        │                  └─ amount
        │
T17     Frontend        Show success message
        │               ├─ "Registration complete!"
        │               ├─ Pickup Code (for youth)
        │               └─ Redirect to success page
        │
T18     User            Registration complete
        │               └─ Receives confirmation

```

## Request/Response Examples

### Create Payment Intent

**Request:**
```http
POST /api/payments/create-intent HTTP/1.1
Content-Type: application/json

{
  "organizationId": "default-org",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+15551234567",
  "amount": 5000,
  "registrationType": "YOUTH",
  "eventId": "event-123"
}
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "registration": {
    "id": "reg_abc123",
    "organizationId": "default-org",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+15551234567",
    "amount": 5000,
    "stripePaymentIntentId": "pi_1234567890",
    "paymentStatus": "pending",
    "status": "pending",
    "createdAt": "2025-12-25T12:00:00Z"
  },
  "clientSecret": "pi_1234567890_secret_abcdef123456",
  "paymentIntentId": "pi_1234567890"
}
```

### Webhook Event

**Incoming Webhook:**
```http
POST /api/webhooks/stripe HTTP/1.1
Content-Type: application/json
stripe-signature: t=1234567890,v1=signature_hex

{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "object": "payment_intent",
      "amount": 5000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "registrationId": "reg_abc123",
        "organizationId": "default-org"
      },
      "charges": {
        "object": "list",
        "data": [
          {
            "id": "ch_1234567890",
            "amount": 5000
          }
        ]
      }
    }
  }
}
```

**Webhook Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "received": true
}
```

## Error Flow

```
Payment Processing Error
│
├─ Card Declined
│  ├─ Stripe returns error to frontend
│  ├─ Frontend shows: "Your card was declined"
│  └─ Registration remains status: "pending"
│
├─ Invalid CVC
│  ├─ Stripe returns error to frontend
│  ├─ Frontend shows: "Invalid CVC"
│  └─ User can retry
│
├─ Expired Card
│  ├─ Stripe returns error to frontend
│  ├─ Frontend shows: "Card has expired"
│  └─ User must use different card
│
└─ Other Errors
   ├─ Webhook fires: payment_intent.payment_failed
   ├─ Backend updates: paymentStatus = "failed"
   ├─ Registration remains: status = "pending"
   └─ User can retry
```

## Refund Flow

```
User Initiates Refund
│
├─ Via API: DELETE /api/registrations/{id}
│  │
│  ├─ Backend calls: refundPaymentIntent()
│  │
│  ├─ Stripe processes refund
│  │
│  └─ Stripe sends webhook: charge.refunded
│     │
│     ├─ Backend receives webhook
│     │
│     ├─ Updates Registration:
│     │  ├─ status = "cancelled"
│     │  ├─ paymentStatus = "refunded"
│     │  └─ amountPaid = 0
│     │
│     └─ Creates PaymentTransaction:
│        └─ status = "refunded"
│
└─ User receives refund in 3-5 business days
```

## Security Flow

```
Payment Intent Creation (Authenticated)
│
├─ Validate organizationId matches user
├─ Sanitize all string inputs
├─ Validate amount > 0
├─ Create in database
├─ Create in Stripe
└─ Return clientSecret (safe - one-time use)

Webhook Reception (Verified)
│
├─ Extract stripe-signature header
├─ Use STRIPE_WEBHOOK_SECRET to verify
├─ Parse only if signature is valid
├─ Extract registrationId from metadata
├─ Verify registration exists
├─ Check for duplicate processing
├─ Update database atomically
└─ Return 200 OK

Payment Processing (Client-Side)
│
├─ Load Stripe.js from official CDN
├─ Use client-secret only once
├─ Never send card data to your server
├─ Use Stripe's encrypted Payment Element
└─ Stripe handles PCI compliance
```

## Database Schema

```
Organization (1)
├────┬─ (N) Registrations
│    │
│    └────┬─ (N) PaymentTransactions
│         │
│         └─ registrationId (optional)
│
└────┬─ (N) PaymentTransactions
     │
     └─ organizationId
```

## Deployment Architecture

```
Production Environment:
│
├─ Frontend (Vercel/AWS/GCP)
│  └─ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_...)
│
├─ Backend (Vercel/AWS/GCP)
│  ├─ STRIPE_SECRET_KEY (sk_live_...) [PRIVATE]
│  ├─ STRIPE_WEBHOOK_SECRET (whsec_...) [PRIVATE]
│  └─ DATABASE (PostgreSQL/MySQL)
│
├─ Stripe Dashboard
│  ├─ API Keys Management
│  ├─ Webhook Configuration
│  │  └─ Endpoint: https://yourdomain.com/api/webhooks/stripe
│  └─ Payment Monitoring
│
└─ Database Backups
   └─ Automatic daily backups
```

---

## Key Takeaway

The system is designed to be:
- ✅ **Secure** - Webhooks verified, secrets protected, no card data stored
- ✅ **Scalable** - Stripe handles all payment processing
- ✅ **Reliable** - Database transactions logged for auditing
- ✅ **Asynchronous** - Webhooks decouple payment from frontend
- ✅ **Recoverable** - All transactions recorded for debugging
