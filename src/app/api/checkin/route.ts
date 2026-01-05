import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';
import { generatePickupCode } from '@/lib/utils';

/**
 * POST /api/checkin
 * Check in a person (youth or adult) for an event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, eventId, personId, eventTitle, eventLocation } = body;

    if (!organizationId || !eventId || !personId) {
      return createApiError('Missing required fields');
    }

    // Verify person exists
    const person = await prisma.person.findUnique({
      where: { id: personId },
    });

    if (!person) {
      return createApiError('Person not found', 404);
    }

    // Check if event exists in database, if not create a placeholder for calendar events
    let event = await prisma.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      // Create a placeholder event for calendar events (check-in events)
      // Use provided title and location if available, otherwise use defaults
      event = await prisma.event.create({
        data: {
          id: eventId,
          organizationId,
          title: eventTitle || 'Calendar Event',
          location: eventLocation || undefined,
          status: 'ACTIVE',
          startsAt: new Date(),
        },
      });
    } else if (eventTitle) {
      // Always update the event with the latest calendar data when we have a real title
      event = await prisma.event.update({
        where: { id: eventId },
        data: {
          title: eventTitle,
          location: eventLocation || event.location,
        },
      });
    }

    // Create or update attendance
    const attendance = await prisma.attendance.upsert({
      where: {
        eventId_personId: { eventId, personId },
      },
      create: {
        organizationId,
        eventId,
        personId,
        status: 'CHECKED_IN',
        checkInAt: new Date(),
      },
      update: {
        status: 'CHECKED_IN',
        checkInAt: new Date(),
      },
    });

    // Only create pickup codes for youth
    let pickupCode: any = null;
    if (person.role === 'YOUTH') {
      pickupCode = await prisma.pickupCode.findFirst({
        where: {
          eventId,
          youthPersonId: personId,
        },
      });

      if (!pickupCode) {
        // Generate unique code
        let code = generatePickupCode();
        let attempts = 0;
        while (attempts < 10) {
          const existing = await prisma.pickupCode.findFirst({
            where: { eventId, code },
          });
          if (!existing) break;
          code = generatePickupCode();
          attempts++;
        }

        pickupCode = await prisma.pickupCode.create({
          data: {
            organizationId,
            eventId,
            youthPersonId: personId,
            code,
          },
        });
      }
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        organizationId,
        action: 'CHECKIN',
        details: JSON.stringify({ eventId, personId, pickupCodeId: pickupCode && 'id' in pickupCode ? (pickupCode as any).id : null }),
      },
    });

    return createApiResponse(
      {
        attendance,
        pickupCode,
      },
      201
    );
  } catch (error) {
    console.error('POST /api/checkin error:', error);
    return createApiError('Internal server error', 500);
  }
}
