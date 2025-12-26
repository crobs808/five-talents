# Event Dropdown & Retroactive Attendance - Complete Fix

## Problems Fixed

### Issue 1: Event Dropdown Not Showing Events in Reports Page
**Symptom:** "Select an event" dropdown on the Attendance Reports page was empty

**Root Cause:** Reports page was loading from `/api/events?organizationId=default-org` which only returns database events, not calendar events. This list was sparse because most events exist only in the iCal calendar feed, not in the database.

**Solution:** Changed reports page to load from `/api/calendar/past-events` which combines:
- Calendar events from iCal feed
- Database events created locally
- Returns proper format with `start` timestamp and `id` field

### Issue 2: Retroactive Attendance Not Saving
**Symptom:** When selecting family members and events for retroactive attendance, clicking Save showed success but no records appeared in reports

**Root Cause:** Event ID mismatch - the retroactive API was only checking the iCal calendar event map, but `/api/calendar/past-events` returns both:
1. iCal UIDs (e.g., `TRAILLIFECONNECT-evmfesqf6nk7...`) from calendar
2. Database IDs (e.g., `cmjm12qby...`) from local Event table

The API couldn't find database event IDs in the calendar map, so all events failed.

**Solution:** Updated retroactive attendance API to:
1. Check database first with `findUnique()`
2. Only look in calendar if not found in database
3. Gracefully handle both types of event IDs
4. Added proper error handling with try-catch blocks

### Issue 3: Calendar Fetch Timeout
**Symptom:** `/api/calendar/past-events` was hanging when trying to fetch from external calendar

**Root Cause:** `node-ical` fetch was taking too long or timing out

**Solution:** 
- Added timeout mechanism (5 seconds) to calendar fetches
- Put calendar fetch in try-catch to gracefully handle failures
- Always return database events even if calendar fetch fails
- Prioritize local database events in response order

## Files Modified

### 1. `/src/app/admin/reports/page.tsx`
Changed event loading from database-only to combined source:
```typescript
// Before:
const response = await fetch('/api/events?organizationId=default-org');

// After:
const response = await fetch('/api/calendar/past-events?organizationId=default-org');
```

Also added "All Attendance (All Events)" option and proper event ID handling.

### 2. `/src/app/api/attendance/retroactive/route.ts`
Fixed event ID matching logic:
```typescript
// Before: Only checked calendar events
const calendarEvent = eventMap.get(eventId);
if (!calendarEvent) {
  failedEventIds.push(eventId);
  continue;
}

// After: Check database first, then calendar
let dbEvent = await prisma.event.findUnique({ where: { id: eventId } });
if (!dbEvent) {
  const calendarEvent = eventMap.get(eventId);
  if (!calendarEvent) {
    failedEventIds.push(eventId);
    continue;
  }
  // Create from calendar
}
```

### 3. `/src/app/api/calendar/past-events/route.ts`
Added timeout handling and better error management:
- Fetch database events first (fast)
- Try calendar fetch with 5-second timeout
- Return combined list sorted by date
- Graceful fallback if calendar unavailable

### 4. `/src/components/EditFamilyModal.tsx`
Enhanced logging and user feedback:
- Added console logs showing request/response details
- Improved alert message with counts of people/events
- Better error reporting

## How to Test

### Test 1: Event Dropdown Shows Events
1. Go to **Admin > Attendance Report**
2. Click "Select an event" dropdown
3. **Expected:** See list of past events (Christmas Party, Troop Meeting, etc.)
4. **Result:** Dropdown now shows ~30 calendar events from the Trail Life Connect calendar

### Test 2: Retroactive Attendance Works
1. Go to **Admin > Families**
2. Edit a family (e.g., Roberts)
3. Scroll to **Retroactive Attendance**
4. Check 2-3 family members
5. Check 5-6 past events
6. Click **Save Attendance**
7. **Expected Alert:** "Successfully marked X attendance records for Y family member(s) and Z event(s)"
   - X should be > 0 (e.g., 12 for 2 people × 6 events)
8. Go to **Attendance Report**
9. Select one of the marked events
10. **Expected:** Selected people appear with CHECKED_IN status

### Test 3: Events Appear in Reports
1. Go to **Attendance Report**
2. Select "Christmas Party: White Elephant Gift Exchange" from dropdown
3. **Expected:** Event loads and shows any attendance records
4. OR select "All Attendance (All Events)" to see all records

## Technical Details

### Event ID Formats
The system now handles two formats:
1. **iCal UID:** `TRAILLIFECONNECT-evmfesqf6nk7-20251225T225946` (from calendar)
2. **Database ID:** `cmjm12qby0001rkqfff1297h0` (from Event table)

The retroactive API intelligently identifies which type it is and handles accordingly.

### Data Flow for Retroactive Attendance
```
User selects events in EditFamilyModal
          ↓
Frontend sends to /api/attendance/retroactive
          ↓
API identifies event type (database vs calendar)
          ↓
For calendar events: Create in database if not exists
          ↓
Mark attendance for selected people
          ↓
Return success with marked count
          ↓
Frontend shows alert with details
```

## Backend API Responses

### `/api/calendar/past-events`
```json
{
  "events": [
    {
      "id": "TRAILLIFECONNECT-evsistj022v2-20251216T224848",
      "title": "Christmas Party: White Elephant Gift Exchange",
      "start": "2025-12-17T00:30:00.000Z",
      "isLocal": false
    },
    {
      "id": "cmjm12qby0001rkqfff1297h0",
      "title": "Default Event (Check-in Test)",
      "start": "2025-12-25T23:05:42.791Z",
      "isLocal": true
    }
  ]
}
```

### `/api/attendance/retroactive`
```json
{
  "success": true,
  "marked": 12,
  "failedEventIds": [],
  "message": "Marked 12 attendance records for 2 family member(s)"
}
```

## Debugging

If issues persist:

1. **Check browser console** (F12 → Console):
   - Look for "Sending retroactive attendance request" log
   - Look for "Retroactive attendance response" log
   - These show exactly what was sent and received

2. **Use debug endpoint** (if available):
   ```
   GET /api/debug/retroactive-attendance?familyId=<familyId>
   ```
   Shows all attendance records for a family

3. **Verify events endpoint**:
   ```
   GET /api/calendar/past-events?organizationId=default-org
   ```
   Should return list of events

4. **Check database directly**:
   ```sql
   SELECT id, title, startsAt FROM Event LIMIT 10;
   SELECT * FROM Attendance WHERE personId = '<personId>';
   ```

## Summary

✅ **Reports event dropdown** - Now shows ~30 calendar events
✅ **Retroactive attendance saving** - Events properly found and marked
✅ **Error handling** - Calendar timeouts don't break functionality
✅ **User feedback** - Clear success/failure messages
✅ **Event type detection** - Handles both database and calendar event IDs

The system is now production-ready for retroactive attendance marking!
