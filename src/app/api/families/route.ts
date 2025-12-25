import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';
import { normalizePhoneToE164, getPhoneLast4 } from '@/lib/utils';

/**
 * GET /api/families?organizationId=...&phoneLast4=...
 * Search families by phone last 4 digits within an organization
 * If phoneLast4 is not provided, returns all families
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const phoneLast4 = searchParams.get('phoneLast4');

    if (!organizationId) {
      return createApiError('organizationId is required');
    }

    let where: any = { organizationId };

    // If phoneLast4 is provided, filter by it; otherwise return all families
    if (phoneLast4) {
      if (phoneLast4.length !== 4) {
        return createApiError('phoneLast4 must be exactly 4 digits');
      }
      where.phoneLast4 = phoneLast4;
    }

    const families = await prisma.family.findMany({
      where,
      include: {
        people: {
          where: { active: true },
          orderBy: { role: 'asc' },
        },
      },
    });

    return createApiResponse(families);
  } catch (error) {
    console.error('GET /api/families error:', error);
    return createApiError('Internal server error', 500);
  }
}

/**
 * POST /api/families
 * Create a new family (staff only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      primaryPhoneE164,
      familyName,
    } = body;

    if (!organizationId || !primaryPhoneE164 || !familyName) {
      return createApiError('Missing required fields');
    }

    // Normalize phone
    const normalizedPhone = normalizePhoneToE164(primaryPhoneE164);
    const phoneLast4 = getPhoneLast4(normalizedPhone);

    // Check if family already exists
    const existing = await prisma.family.findUnique({
      where: {
        organizationId_primaryPhoneE164: {
          organizationId,
          primaryPhoneE164: normalizedPhone,
        },
      },
    });

    if (existing) {
      return createApiError('Family with this phone number already exists', 409);
    }

    const family = await prisma.family.create({
      data: {
        organizationId,
        primaryPhoneE164: normalizedPhone,
        phoneLast4,
        familyName,
      },
      include: {
        people: true,
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        organizationId,
        action: 'FAMILY_CREATED',
        details: JSON.stringify({ familyId: family.id, familyName }),
      },
    });

    return createApiResponse(family, 201);
  } catch (error) {
    console.error('POST /api/families error:', error);
    return createApiError('Internal server error', 500);
  }
}
