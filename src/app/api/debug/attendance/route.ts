import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiResponse } from '@/lib/api';

/**
 * GET /api/debug/attendance?eventId=...
 * Debug endpoint to see all attendance records for an event
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId') || 'default-event';

    const attendances = await prisma.attendance.findMany({
      where: { eventId },
      include: {
        person: { include: { family: true } },
      },
    });

    const families = await prisma.family.findMany({
      where: { organizationId: 'default-org' },
      include: { people: true },
    });

    return createApiResponse({
      eventId,
      attendanceCount: attendances.length,
      attendances: attendances.map(a => ({
        personId: a.personId,
        personName: `${a.person.firstName} ${a.person.lastName}`,
        familyName: a.person.family?.familyName,
        status: a.status,
        checkInAt: a.checkInAt,
      })),
      familiesInDb: families.map(f => ({
        id: f.id,
        name: f.familyName,
        phoneLast4: f.phoneLast4,
        peopleCount: f.people.length,
        people: f.people.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })),
      })),
    });
  } catch (error) {
    console.error('GET /api/debug/attendance error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
