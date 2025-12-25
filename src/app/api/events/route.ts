import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * GET /api/events?organizationId=...&status=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');

    if (!organizationId) {
      return createApiError('organizationId is required');
    }

    const where: any = { organizationId };
    if (status) {
      where.status = status;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startsAt: 'desc' },
    });

    return createApiResponse(events);
  } catch (error) {
    console.error('GET /api/events error:', error);
    return createApiError('Internal server error', 500);
  }
}

/**
 * POST /api/events
 * Create a new event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
      title,
      description,
      startsAt,
      endsAt,
      location,
    } = body;

    if (!organizationId || !title || !startsAt) {
      return createApiError('Missing required fields');
    }

    const event = await prisma.event.create({
      data: {
        organizationId,
        title,
        description,
        startsAt: new Date(startsAt),
        endsAt: endsAt ? new Date(endsAt) : null,
        location,
        status: 'DRAFT',
      },
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        organizationId,
        action: 'EVENT_CREATED',
        details: JSON.stringify({ eventId: event.id, title }),
      },
    });

    return createApiResponse(event, 201);
  } catch (error) {
    console.error('POST /api/events error:', error);
    return createApiError('Internal server error', 500);
  }
}
