import { NextRequest, NextResponse } from 'next/server';
import ical from 'node-ical';
import prisma from '@/lib/db';

const DEFAULT_CALENDAR_URL = 'https://www.traillifeconnect.com/icalendar/tkmr6kntlwcv/na/public';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || 'default-org';
    
    const now = new Date();
    // Get events from 6 months ago to today
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
    const pastEvents: any[] = [];

    // First, get locally created events from the Event table
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

    // Try to fetch calendar events with a timeout
    try {
      const calendarUrls = await prisma.calendarUrl.findMany({
        where: {
          organizationId,
          isActive: true,
        },
      });

      const urls = calendarUrls.length > 0 ? calendarUrls.map((c: any) => c.url) : [DEFAULT_CALENDAR_URL];

      // Fetch and parse events from all calendars with timeout
      for (const url of urls) {
        try {
          // Set a timeout for the fetch operation
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const events = await Promise.race([
            ical.async.fromURL(url),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Calendar fetch timeout')), 5000)
            )
          ]) as any;

          clearTimeout(timeoutId);

          for (const event of Object.values(events)) {
            if ((event as any).type === 'VEVENT') {
              const startDate = new Date((event as any).start);
              
              // Include events that started between 6 months ago and today
              if (startDate >= sixMonthsAgo && startDate <= now) {
                pastEvents.push({
                  id: (event as any).uid,
                  title: (event as any).summary || 'Untitled Event',
                  start: startDate.toISOString(),
                  isLocal: false, // Calendar events are synced
                });
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching calendar from ${url}:`, error instanceof Error ? error.message : error);
          // Continue with other calendars
        }
      }
    } catch (error) {
      console.error('Error fetching calendar URLs:', error);
      // Continue without calendar events
    }

    // Sort by date descending (most recent first)
    pastEvents.sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime());
    
    return NextResponse.json({ events: pastEvents });
  } catch (error) {
    console.error('Error fetching past calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past calendar events' },
      { status: 500 }
    );
  }
}
