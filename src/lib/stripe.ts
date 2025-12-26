import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined');
}

export const stripe = new Stripe(stripeSecretKey);

export interface PaymentIntentOptions {
  amount: number; // Amount in cents
  email: string;
  description?: string;
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(options: PaymentIntentOptions) {
  try {
    const { amount, email, description, metadata } = options;

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      receipt_email: email,
      description,
      metadata: {
        email,
        ...metadata,
      },
    });

    return intent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function getPaymentIntent(intentId: string) {
  try {
    return await stripe.paymentIntents.retrieve(intentId);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
}

export async function cancelPaymentIntent(intentId: string) {
  try {
    return await stripe.paymentIntents.cancel(intentId);
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    throw error;
  }
}

export async function refundPaymentIntent(intentId: string, amount?: number) {
  try {
    // Get the charge ID from the payment intent
    const intent = await stripe.paymentIntents.retrieve(intentId);
    
    // PaymentIntent may have multiple charges, get the most recent one
    const charge = await stripe.charges.retrieve(intentId as string).catch(() => null);
    
    if (!charge && !intent) {
      throw new Error('No payment information found');
    }

    const chargeId = charge?.id || (intent.id as string);

    return await stripe.refunds.create({
      charge: chargeId,
      amount,
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
  }
  return secret;
}
