import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * GET /api/reports/all-attendance?organizationId=...
 * Get all attendance records across all events
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return createApiError('organizationId is required');
    }

    // Fetch all attendances with related data
    const attendances = await prisma.attendance.findMany({
      where: { organizationId },
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
    });

    if (attendances.length === 0) {
      // Return empty result without trying to calculate min/max
      return createApiResponse({
        event: {
          id: 'all',
          organizationId,
          title: 'All Attendance Records',
          description: 'Combined attendance from all events',
          startsAt: new Date().toISOString(),
          endsAt: new Date().toISOString(),
          location: 'All Locations',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          attendances: [],
        },
        stats: {
          totalCheckedIn: 0,
          totalCheckedOut: 0,
          totalAttendances: 0,
        },
      });
    }

    // Calculate stats
    const checkedIn = attendances.filter((a) => a.status === 'CHECKED_IN').length;
    const checkedOut = attendances.filter((a) => a.status === 'CHECKED_OUT').length;

    // Create a virtual "All Attendance" event object
    const allAttendanceEvent = {
      id: 'all',
      organizationId,
      title: 'All Attendance Records',
      description: 'Combined attendance from all events',
      startsAt: new Date(Math.min(...attendances.map(a => new Date(a.checkInAt || a.createdAt).getTime()))).toISOString(),
      endsAt: new Date(Math.max(...attendances.map(a => new Date(a.checkOutAt || a.updatedAt).getTime()))).toISOString(),
      location: 'All Locations',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      attendances,
    };

    return createApiResponse({
      event: allAttendanceEvent,
      stats: {
        totalCheckedIn: checkedIn,
        totalCheckedOut: checkedOut,
        totalAttendances: attendances.length,
      },
    });
  } catch (error) {
    console.error('GET /api/reports/all-attendance error:', error);
    return createApiError('Internal server error', 500);
  }
}
