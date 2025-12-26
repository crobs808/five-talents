import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * GET /api/reports/attendance?organizationId=...&eventId=...
 * Get attendance report for an event
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const eventId = searchParams.get('eventId');

    if (!organizationId || !eventId) {
      return createApiError('organizationId and eventId are required');
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendances: {
          include: {
            person: {
              include: {
                family: true,
              },
            },
            event: true,
          },
          orderBy: {
            checkInAt: 'desc',
          },
        },
      },
    });

    if (!event) {
      return createApiError('Event not found', 404);
    }

    // Calculate stats
    const checkedIn = event.attendances.filter((a) => a.status === 'CHECKED_IN').length;
    const checkedOut = event.attendances.filter((a) => a.status === 'CHECKED_OUT').length;

    return createApiResponse({
      event,
      stats: {
        totalCheckedIn: checkedIn,
        totalCheckedOut: checkedOut,
        totalAttendances: event.attendances.length,
      },
    });
  } catch (error) {
    console.error('GET /api/reports/attendance error:', error);
    return createApiError('Internal server error', 500);
  }
}
