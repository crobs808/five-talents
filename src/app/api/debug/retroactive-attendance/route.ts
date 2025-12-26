import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiResponse } from '@/lib/api';

/**
 * GET /api/debug/retroactive-attendance?familyId=...
 * Debug endpoint to check retroactive attendance records for a family
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return createApiResponse({
        error: 'familyId is required',
        example: '/api/debug/retroactive-attendance?familyId=cmjm12qby0001rkqfff1297h0',
      });
    }

    // Get family
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        people: {
          where: { active: true },
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!family) {
      return createApiResponse({ error: 'Family not found' });
    }

    // Get all attendance records for this family's people
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        personId: {
          in: family.people.map(p => p.id),
        },
      },
      include: {
        person: { select: { id: true, firstName: true, lastName: true } },
        event: { select: { id: true, title: true, startsAt: true } },
      },
      orderBy: { checkInAt: 'desc' },
    });

    // Group by person
    const byPerson: Record<string, any> = {};
    family.people.forEach(person => {
      byPerson[person.id] = {
        name: `${person.firstName} ${person.lastName}`,
        records: [],
      };
    });

    attendanceRecords.forEach(record => {
      if (byPerson[record.personId]) {
        byPerson[record.personId].records.push({
          eventId: record.eventId,
          eventTitle: record.event.title,
          eventDate: record.event.startsAt,
          status: record.status,
          checkInAt: record.checkInAt,
        });
      }
    });

    return createApiResponse({
      family: {
        id: family.id,
        name: family.familyName,
        members: family.people,
      },
      totalRecords: attendanceRecords.length,
      byPerson,
    });
  } catch (error) {
    console.error('GET /api/debug/retroactive-attendance error:', error);
    return createApiResponse({ error: 'Internal server error', details: String(error) });
  }
}
