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
    const { familyId, eventIds, personIds } = body;

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

    // Get people to mark attendance for
    // If personIds provided, use those; otherwise get all active people in the family
    let people: any[];
    if (personIds && Array.isArray(personIds) && personIds.length > 0) {
      people = await prisma.person.findMany({
        where: {
          id: { in: personIds },
          familyId,
          active: true,
        },
      });
    } else {
      people = await prisma.person.findMany({
        where: {
          familyId,
          active: true,
        },
      });
    }

    if (people.length === 0) {
      return createApiError('No active people found for attendance marking', 404);
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

    const urls = calendarUrls.map((c: any) => c.url);

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
      // First check if event already exists in database
      let dbEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });

      // If not in database, try to find it in the calendar (iCal UID)
      if (!dbEvent) {
        const calendarEvent = eventMap.get(eventId);

        if (!calendarEvent) {
          console.log(`Event ${eventId} not found in database or calendar`);
          failedEventIds.push(eventId);
          continue;
        }

        // Create event from calendar data
        const startDate = new Date(calendarEvent.start);
        const endDate = calendarEvent.end ? new Date(calendarEvent.end) : startDate;

        try {
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
        } catch (error) {
          console.error(`Error creating event ${eventId}:`, error);
          failedEventIds.push(eventId);
          continue;
        }
      }

      // Mark attendance for each person
      for (const person of people) {
        try {
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
        } catch (error) {
          console.error(`Error marking attendance for person ${person.id} on event ${eventId}:`, error);
        }
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
