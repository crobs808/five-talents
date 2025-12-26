import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * GET /api/checkin/status?organizationId=...&eventId=...&familyId=...
 * Get check-in status for all people in a household for a specific event
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const eventId = searchParams.get('eventId');
    const familyId = searchParams.get('familyId');

    if (!organizationId || !eventId || !familyId) {
      return createApiError('organizationId, eventId, and familyId are required');
    }

    // Get all people in the family
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        people: {
          where: { active: true },
        },
      },
    });

    if (!family) {
      return createApiError('Family not found', 404);
    }

    // Get attendance records for these people at this event
    const attendances = await prisma.attendance.findMany({
      where: {
        eventId,
        organizationId,
        personId: {
          in: family.people.map((p) => p.id),
        },
      },
      include: {
        person: true,
      },
    });

    // Create a map of personId -> status
    const checkedInMap: Record<string, string> = {};
    attendances.forEach((att) => {
      checkedInMap[att.personId] = att.status;
    });

    return createApiResponse({
      familyId,
      eventId,
      checkedInStatus: checkedInMap,
    });
  } catch (error) {
    console.error('GET /api/checkin/status error:', error);
    return createApiError('Internal server error', 500);
  }
}
