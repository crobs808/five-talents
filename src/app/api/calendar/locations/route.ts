import { NextRequest, NextResponse } from 'next/server';
import ical from 'node-ical';
import prisma from '@/lib/db';

const DEFAULT_CALENDAR_URL = 'https://www.traillifeconnect.com/icalendar/tkmr6kntlwcv/na/public';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || 'default-org';
    const query = searchParams.get('q')?.toLowerCase() || '';

    // Fetch calendar URLs from database
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

    // Fetch and parse events from all calendars
    // Only locations from active calendar events are included
    const locations = new Set<string>();

    for (const url of urls) {
      try {
        const events = await ical.async.fromURL(url);
        for (const event of Object.values(events)) {
          if (event.type === 'VEVENT' && event.location) {
            const location = event.location.trim();
            if (location) {
              locations.add(location);
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching calendar from ${url}:`, error);
        // Continue with other calendars
      }
    }

    // Also include locations from locally created events
    // Locations are only suggested if they're still tied to existing events
    // If an event is deleted, its location is no longer suggested
    const localEvents = await prisma.event.findMany({
      where: {
        organizationId,
        location: {
          not: '',
        },
      },
      select: {
        location: true,
      },
      distinct: ['location'],
    });

    for (const event of localEvents) {
      if (event.location?.trim()) {
        locations.add(event.location.trim());
      }
    }

    // Filter by query if provided
    const filtered = Array.from(locations)
      .filter(loc => loc.toLowerCase().includes(query))
      .sort();

    return NextResponse.json({ locations: filtered });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
