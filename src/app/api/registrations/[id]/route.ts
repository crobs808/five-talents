import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';
import { cancelPaymentIntent, refundPaymentIntent } from '@/lib/stripe';

/**
 * GET /api/registrations/[id]
 * Get registration details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!registration) {
      return createApiError('Registration not found', 404);
    }

    return createApiResponse(registration);
  } catch (error) {
    console.error('GET /api/registrations/[id] error:', error);
    return createApiError('Failed to fetch registration', 500);
  }
}

/**
 * PATCH /api/registrations/[id]
 * Update registration details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, email, phoneNumber, notes, registrationType } = body;

    const registration = await prisma.registration.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(phoneNumber && { phoneNumber }),
        ...(notes && { notes }),
        ...(registrationType && { registrationType }),
      },
    });

    return createApiResponse(registration);
  } catch (error) {
    console.error('PATCH /api/registrations/[id] error:', error);
    return createApiError('Failed to update registration', 500);
  }
}

/**
 * DELETE /api/registrations/[id]
 * Cancel registration and refund if applicable
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const registration = await prisma.registration.findUnique({
      where: { id },
    });

    if (!registration) {
      return createApiError('Registration not found', 404);
    }

    // If payment was made, issue a refund
    if (registration.paymentStatus === 'completed' && registration.stripePaymentIntentId) {
      try {
        await refundPaymentIntent(registration.stripePaymentIntentId, registration.amountPaid);
      } catch (error) {
        console.error('Error refunding payment:', error);
        // Continue with cancellation even if refund fails
      }
    }

    // Update registration status to cancelled
    const updated = await prisma.registration.update({
      where: { id },
      data: {
        status: 'cancelled',
        paymentStatus: registration.paymentStatus === 'completed' ? 'refunded' : 'cancelled',
      },
    });

    return createApiResponse({ message: 'Registration cancelled', registration: updated });
  } catch (error) {
    console.error('DELETE /api/registrations/[id] error:', error);
    return createApiError('Failed to cancel registration', 500);
  }
}
