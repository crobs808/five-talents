import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * GET /api/checkout?code=...&eventId=...
 * Lookup pickup code for redemption
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const eventId = searchParams.get('eventId');

    if (!code || !eventId) {
      return createApiError('code and eventId are required');
    }

    const pickupCode = await prisma.pickupCode.findFirst({
      where: {
        eventId,
        code: code.toUpperCase(),
      },
      include: {
        youthPerson: true,
        event: true,
      },
    });

    if (!pickupCode) {
      return createApiError('Pickup code not found', 404);
    }

    if (pickupCode.redeemedAt) {
      return createApiError('Code already redeemed', 400);
    }

    return createApiResponse(pickupCode);
  } catch (error) {
    console.error('GET /api/checkout error:', error);
    return createApiError('Internal server error', 500);
  }
}

/**
 * POST /api/checkout
 * Redeem a pickup code (check out)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, pickupCodeId, redeemedByAdultId } = body;

    if (!organizationId || !pickupCodeId) {
      return createApiError('Missing required fields');
    }

    const pickupCode = await prisma.pickupCode.findUnique({
      where: { id: pickupCodeId },
      include: { youthPerson: true, event: true },
    });

    if (!pickupCode) {
      return createApiError('Pickup code not found', 404);
    }

    if (pickupCode.redeemedAt) {
      return createApiError('Code already redeemed', 400);
    }

    // Update attendance to CHECKED_OUT
    const attendance = await prisma.attendance.update({
      where: {
        eventId_personId: {
          eventId: pickupCode.eventId,
          personId: pickupCode.youthPersonId,
        },
      },
      data: {
        status: 'CHECKED_OUT',
        checkOutAt: new Date(),
      },
    });

    // Mark code as redeemed
    const redeemed = await prisma.pickupCode.update({
      where: { id: pickupCodeId },
      data: {
        redeemedAt: new Date(),
        redeemedByAdultId: redeemedByAdultId || null,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        organizationId,
        action: 'CHECKOUT',
        details: JSON.stringify({
          pickupCodeId,
          personId: pickupCode.youthPersonId,
          eventId: pickupCode.eventId,
          redeemedByAdultId,
        }),
      },
    });

    return createApiResponse({ attendance, pickupCode: redeemed });
  } catch (error) {
    console.error('POST /api/checkout error:', error);
    return createApiError('Internal server error', 500);
  }
}
