import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';
import { createPaymentIntent } from '@/lib/stripe';

/**
 * POST /api/payments/create-intent
 * Create a Stripe Payment Intent for a registration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      firstName,
      lastName,
      email,
      phoneNumber,
      amount, // in cents
      registrationType,
      eventId,
      description,
    } = body;

    if (!organizationId || !firstName || !lastName || !email || !amount) {
      return createApiError('Missing required fields');
    }

    if (amount < 0) {
      return createApiError('Amount must be positive');
    }

    // Create registration record first
    const registration = await prisma.registration.create({
      data: {
        organizationId,
        firstName,
        lastName,
        email,
        phoneNumber,
        amount,
        registrationType: registrationType || 'STANDARD',
        eventId,
        status: 'pending',
        paymentStatus: 'pending',
      },
    });

    // Create Stripe Payment Intent
    const paymentIntent = await createPaymentIntent({
      amount,
      email,
      description: description || `Registration for ${firstName} ${lastName}`,
      metadata: {
        registrationId: registration.id,
        organizationId,
        registrationType: registrationType || 'STANDARD',
      },
    });

    // Update registration with payment intent ID
    const updatedRegistration = await prisma.registration.update({
      where: { id: registration.id },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return createApiResponse({
      registration: updatedRegistration,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('POST /api/payments/create-intent error:', error);
    return createApiError('Failed to create payment intent', 500);
  }
}
