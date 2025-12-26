import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiResponse } from '@/lib/api';

/**
 * GET /api/debug/events
 * Debug endpoint to see all events
 */
export async function GET(request: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      where: { organizationId: 'default-org' },
      include: {
        attendances: true,
      },
    });

    return createApiResponse({
      count: events.length,
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        startsAt: e.startsAt,
        endsAt: e.endsAt,
        location: e.location,
        status: e.status,
        attendanceCount: e.attendances.length,
      })),
    });
  } catch (error) {
    console.error('GET /api/debug/events error:', error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
}
