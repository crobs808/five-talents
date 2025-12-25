import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * GET /api/registrations
 * List registrations for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || 'default-org';
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');

    const registrations = await prisma.registration.findMany({
      where: {
        organizationId,
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return createApiResponse(registrations);
  } catch (error) {
    console.error('GET /api/registrations error:', error);
    return createApiError('Failed to fetch registrations', 500);
  }
}

/**
 * POST /api/registrations
 * Create a new registration (without payment)
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
      registrationType,
      eventId,
      notes,
    } = body;

    if (!organizationId || !firstName || !lastName || !email) {
      return createApiError('Missing required fields');
    }

    const registration = await prisma.registration.create({
      data: {
        organizationId,
        firstName,
        lastName,
        email,
        phoneNumber,
        registrationType: registrationType || 'STANDARD',
        eventId,
        notes,
        status: 'registered',
        paymentStatus: 'completed',
        amount: 0,
        amountPaid: 0,
      },
    });

    return createApiResponse(registration, 201);
  } catch (error) {
    console.error('POST /api/registrations error:', error);
    return createApiError('Failed to create registration', 500);
  }
}
