import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/db';
import { stripe, getWebhookSecret } from '@/lib/stripe';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  try {
    const webhookSecret = getWebhookSecret();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      status: 400,
    });
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const registrationId = paymentIntent.metadata?.registrationId;

    if (!registrationId) {
      console.error('No registrationId in payment intent metadata');
      return;
    }

    // Update registration status
    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: 'completed',
        status: 'registered',
        amountPaid: paymentIntent.amount,
      },
    });

    // Create payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        organizationId: registration.organizationId,
        registrationId,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'succeeded',
        description: `Payment received for registration ${registrationId}`,
        metadata: JSON.stringify({
          chargeId: paymentIntent.charges.data[0]?.id,
          receiptEmail: paymentIntent.receipt_email,
        }),
      },
    });

    console.log(`✅ Payment succeeded for registration ${registrationId}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const registrationId = paymentIntent.metadata?.registrationId;

    if (!registrationId) {
      console.error('No registrationId in payment intent metadata');
      return;
    }

    // Update registration status
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: 'failed',
        status: 'pending',
      },
    });

    // Create payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        organizationId: paymentIntent.metadata.organizationId,
        registrationId,
        stripePaymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: 'failed',
        description: `Payment failed for registration ${registrationId}`,
        metadata: JSON.stringify({
          lastPaymentError: paymentIntent.last_payment_error?.message,
        }),
      },
    });

    console.log(`❌ Payment failed for registration ${registrationId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
    throw error;
  }
}

async function handleRefund(charge: Stripe.Charge) {
  try {
    // Find the registration by payment intent
    const registration = await prisma.registration.findFirst({
      where: {
        stripePaymentIntentId: charge.payment_intent as string,
      },
    });

    if (!registration) {
      console.log(`No registration found for charge ${charge.id}`);
      return;
    }

    // Update registration status
    await prisma.registration.update({
      where: { id: registration.id },
      data: {
        paymentStatus: 'refunded',
        status: 'cancelled',
        amountPaid: 0,
      },
    });

    // Create refund transaction record
    await prisma.paymentTransaction.create({
      data: {
        organizationId: registration.organizationId,
        registrationId: registration.id,
        stripePaymentIntentId: charge.payment_intent as string,
        amount: charge.amount_refunded,
        currency: charge.currency,
        status: 'refunded',
        description: `Refund issued for registration ${registration.id}`,
        metadata: JSON.stringify({
          chargeId: charge.id,
          refundReason: charge.refunded ? 'Refunded' : 'Partial refund',
        }),
      },
    });

    console.log(`💰 Refund processed for registration ${registration.id}`);
  } catch (error) {
    console.error('Error handling refund:', error);
    throw error;
  }
}
