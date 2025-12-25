import { NextRequest, NextResponse } from 'next/server';
import ical from 'node-ical';
import prisma from '@/lib/db';

const DEFAULT_CALENDAR_URL = 'https://www.traillifeconnect.com/icalendar/tkmr6kntlwcv/na/public';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || 'default-org';
    
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
    const allEvents: any[] = [];
    for (const url of urls) {
      try {
        const events = await ical.async.fromURL(url);
        for (const event of Object.values(events)) {
          if (event.type === 'VEVENT') {
            allEvents.push(event);
          }
        }
      } catch (error) {
        console.error(`Error fetching calendar from ${url}:`, error);
        // Continue with other calendars
      }
    }
    
    const now = new Date();
    // Get events from 6 months ago to today
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const pastEvents: any[] = [];
    
    // Parse calendar events and filter for past events
    for (const event of allEvents) {
      const startDate = new Date(event.start);
      
      // Include events that ended between 6 months ago and today
      if (startDate >= sixMonthsAgo && startDate <= now) {
        const eventData = {
          id: event.uid,
          title: event.summary || 'Untitled Event',
          start: startDate.toISOString(),
          isLocal: false, // Calendar events are synced
        };
        pastEvents.push(eventData);
      }
    }

    // Also include locally created events from the Event table
    const localEvents = await prisma.event.findMany({
      where: {
        organizationId,
        startsAt: {
          gte: sixMonthsAgo,
          lte: now,
        },
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
      },
    });

    for (const event of localEvents) {
      pastEvents.push({
        id: event.id,
        title: event.title,
        start: event.startsAt.toISOString(),
        isLocal: true, // Locally created events
      });
    }
    
    // Sort by date descending (most recent first)
    pastEvents.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
    
    return NextResponse.json({ events: pastEvents });
  } catch (error) {
    console.error('Error fetching past calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past calendar events' },
      { status: 500 }
    );
  }
}
