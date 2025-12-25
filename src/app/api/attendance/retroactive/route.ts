import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { createApiError, createApiResponse } from '@/lib/api';
import ical from 'node-ical';

const DEFAULT_CALENDAR_URL = 'https://www.traillifeconnect.com/icalendar/tkmr6kntlwcv/na/public';

/**
 * POST /api/attendance/retroactive
 * Mark retroactive attendance for a family members for past events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { familyId, eventIds } = body;

    if (!familyId || !Array.isArray(eventIds)) {
      return createApiError('familyId and eventIds array are required');
    }

    if (eventIds.length === 0) {
      return createApiResponse({ success: true, marked: 0 });
    }

    // Get family and organization info
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: { organizationId: true },
    });

    if (!family) {
      return createApiError('Family not found', 404);
    }

    const organizationId = family.organizationId;

    // Get all active people in the family
    const people = await prisma.person.findMany({
      where: {
        familyId,
        active: true,
      },
    });

    if (people.length === 0) {
      return createApiError('No active people found in family', 404);
    }

    // Fetch calendar URLs
    let calendarUrls = await prisma.calendarUrl.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });

    // If no URLs found, use default
    if (calendarUrls.length === 0) {
      calendarUrls = [{ url: DEFAULT_CALENDAR_URL } as any];
    }

    const urls = calendarUrls.map(c => c.url);

    // Fetch calendar events from all URLs
    const eventMap = new Map<string, any>();
    for (const url of urls) {
      try {
        const calendarEvents = await ical.async.fromURL(url);
        for (const event of Object.values(calendarEvents)) {
          if (event.type === 'VEVENT') {
            eventMap.set(event.uid, event);
          }
        }
      } catch (error) {
        console.error(`Error fetching calendar from ${url}:`, error);
        // Continue with other calendars
      }
    }

    // Mark attendance for each person for each event
    let markedCount = 0;
    const failedEventIds: string[] = [];

    for (const eventId of eventIds) {
      const calendarEvent = eventMap.get(eventId);

      if (!calendarEvent) {
        failedEventIds.push(eventId);
        continue;
      }

      // Check if event exists in database, create if not
      const startDate = new Date(calendarEvent.start);
      const endDate = calendarEvent.end ? new Date(calendarEvent.end) : startDate;

      let dbEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!dbEvent) {
        // Create event if it doesn't exist
        dbEvent = await prisma.event.create({
          data: {
            id: eventId,
            organizationId,
            title: calendarEvent.summary || 'Untitled Event',
            description: calendarEvent.description || '',
            location: calendarEvent.location || '',
            startsAt: startDate,
            endsAt: endDate,
            status: 'ACTIVE',
          },
        });
      }

      // Mark attendance for each person
      for (const person of people) {
        await prisma.attendance.upsert({
          where: {
            eventId_personId: { eventId: dbEvent.id, personId: person.id },
          },
          create: {
            organizationId,
            eventId: dbEvent.id,
            personId: person.id,
            status: 'CHECKED_IN',
            checkInAt: new Date(),
          },
          update: {
            status: 'CHECKED_IN',
            checkInAt: new Date(),
          },
        });
        markedCount++;
      }
    }

    return createApiResponse({
      success: true,
      marked: markedCount,
      failedEventIds,
      message: `Marked ${markedCount} attendance records for ${people.length} family member(s)`,
    });
  } catch (error) {
    console.error('POST /api/attendance/retroactive error:', error);
    return createApiError('Internal server error', 500);
  }
}
