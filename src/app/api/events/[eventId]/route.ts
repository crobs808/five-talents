import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';

/**
 * GET /api/events/[eventId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            attendances: true,
            pickupCodes: true,
          },
        },
      },
    });

    if (!event) {
      return createApiError('Event not found', 404);
    }

    return createApiResponse(event);
  } catch (error) {
    console.error('GET /api/events/[eventId] error:', error);
    return createApiError('Internal server error', 500);
  }
}

/**
 * PATCH /api/events/[eventId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { title, description, startsAt, endsAt, location, status } = body;

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(startsAt && { startsAt: new Date(startsAt) }),
        ...(endsAt !== undefined && { endsAt: endsAt ? new Date(endsAt) : null }),
        ...(location && { location }),
        ...(status && { status }),
      },
    });

    return createApiResponse(event);
  } catch (error) {
    console.error('PATCH /api/events/[eventId] error:', error);
    return createApiError('Internal server error', 500);
  }
}

/**
 * DELETE /api/events/[eventId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Delete all related attendance records first
    await prisma.attendance.deleteMany({
      where: { eventId },
    });

    // Delete all related pickup codes
    await prisma.pickupCode.deleteMany({
      where: { eventId },
    });

    // Delete the event
    const event = await prisma.event.delete({
      where: { id: eventId },
    });

    return createApiResponse({ success: true, deletedEvent: event });
  } catch (error) {
    console.error('DELETE /api/events/[eventId] error:', error);
    return createApiError('Internal server error', 500);
  }
}
