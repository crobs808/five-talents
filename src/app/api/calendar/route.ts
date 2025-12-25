import { NextRequest, NextResponse } from 'next/server';
import ical from 'node-ical';
import prisma from '@/lib/db';

const DEFAULT_CALENDAR_URL = 'https://www.traillifeconnect.com/icalendar/tkmr6kntlwcv/na/public';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const graceMinutes = parseInt(searchParams.get('graceMinutes') || '30');
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
    const graceTime = new Date(now.getTime() + graceMinutes * 60 * 1000);
    const activeEvents: any[] = [];
    const startingSoonEvents: any[] = [];
    const upcomingEvents: any[] = [];
    
    // Parse events and categorize them
    for (const event of allEvents) {
      const startDate = new Date(event.start);
      const endDate = event.end ? new Date(event.end) : startDate;
      
      const eventData = {
        id: event.uid,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        location: event.location || '',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: !event.start.getHours && !event.start.getMinutes,
      };
      
      // Check if event has already started and hasn't ended yet
      if (startDate <= now && endDate >= now) {
        activeEvents.push(eventData);
      }
      // Check if event is starting soon (within grace period but hasn't started)
      else if (startDate > now && startDate <= graceTime) {
        startingSoonEvents.push(eventData);
      }
      // Otherwise check if it's upcoming (starts after grace period)
      else if (startDate > graceTime) {
        upcomingEvents.push(eventData);
      }
    }
    
    // Prioritize: active events > starting soon > upcoming events
    let nextEvent = null;
    let eventStatus = 'upcoming';
    
    if (activeEvents.length > 0) {
      activeEvents.sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
      nextEvent = activeEvents[0];
      eventStatus = 'active';
    } else if (startingSoonEvents.length > 0) {
      startingSoonEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      nextEvent = startingSoonEvents[0];
      eventStatus = 'starting-soon';
    } else if (upcomingEvents.length > 0) {
      upcomingEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      nextEvent = upcomingEvents[0];
      eventStatus = 'upcoming';
    }
    
    return NextResponse.json({
      nextEvent,
      eventStatus,
      upcomingCount: activeEvents.length + startingSoonEvents.length + upcomingEvents.length,
    });
  } catch (error) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}
