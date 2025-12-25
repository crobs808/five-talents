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

    const allEvents: any[] = [];
    
    // Fetch and parse events from all calendars
    for (const calendarUrl of calendarUrls) {
      try {
        const events = await ical.async.fromURL(calendarUrl.url);
        for (const event of Object.values(events)) {
          if (event.type === 'VEVENT') {
            const startDate = new Date(event.start);
            const endDate = event.end ? new Date(event.end) : startDate;
            
            allEvents.push({
              id: event.uid,
              title: event.summary || 'Untitled Event',
              description: event.description || '',
              location: event.location || '',
              startsAt: startDate.toISOString(),
              endsAt: endDate.toISOString(),
              status: 'SYNCED',
              source: 'calendar',
              sourceUrl: calendarUrl.url,
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching calendar from ${calendarUrl.url}:`, error);
        // Continue with other calendars
      }
    }
    
    // Sort by start date
    allEvents.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    
    return NextResponse.json(allEvents);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
