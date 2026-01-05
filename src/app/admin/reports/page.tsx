'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';

interface AttendanceReport {
  event: any;
  stats: {
    totalCheckedIn: number;
    totalCheckedOut: number;
    totalAttendances: number;
  };
}

interface Event {
  id: string;
  title: string;
  startsAt: string;
  attendanceCount?: number;
}

export default function ReportsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState('');
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventsLoading, setEventsLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedAttendances = () => {
    if (!report) return [];
    
    const attendances = [...report.event.attendances];
    
    attendances.sort((a: any, b: any) => {
      let aVal: any = '';
      let bVal: any = '';

      switch (sortColumn) {
        case 'name':
          aVal = `${a.person.firstName} ${a.person.lastName}`.toLowerCase();
          bVal = `${b.person.firstName} ${b.person.lastName}`.toLowerCase();
          break;
        case 'role':
          aVal = a.person.role;
          bVal = b.person.role;
          break;
        case 'level':
          aVal = (a.person.levelGroup || '').toLowerCase();
          bVal = (b.person.levelGroup || '').toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'checkin':
          aVal = a.checkInAt ? new Date(a.checkInAt).getTime() : 0;
          bVal = b.checkInAt ? new Date(b.checkInAt).getTime() : 0;
          break;
        case 'checkout':
          aVal = b.checkOutAt ? new Date(b.checkOutAt).getTime() : 0;
          bVal = b.checkOutAt ? new Date(b.checkOutAt).getTime() : 0;
          break;
        case 'duration':
          const aCheckIn = a.checkInAt ? new Date(a.checkInAt).getTime() : 0;
          const aCheckOut = a.checkOutAt ? new Date(a.checkOutAt).getTime() : 0;
          const bCheckIn = b.checkInAt ? new Date(b.checkInAt).getTime() : 0;
          const bCheckOut = b.checkOutAt ? new Date(b.checkOutAt).getTime() : 0;
          aVal = aCheckIn && aCheckOut ? aCheckOut - aCheckIn : 0;
          bVal = bCheckIn && bCheckOut ? bCheckOut - bCheckIn : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return attendances;
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Load available events on mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        // Fetch past calendar events (includes both calendar and database events)
        const response = await fetch(
          '/api/calendar/past-events?organizationId=default-org'
        );
        if (response.ok) {
          const data = await response.json();
          let eventsList = data.events || [];
          
          // Sort by date (most recent first)
          eventsList.sort((a: any, b: any) => {
            const dateA = new Date(a.start).getTime();
            const dateB = new Date(b.start).getTime();
            return dateB - dateA;
          });
          
          // Always include default-event for testing
          const defaultEventExists = eventsList.some((e: any) => e.id === 'default-event');
          if (!defaultEventExists) {
            eventsList.push({
              id: 'default-event',
              title: 'Default Event (Check-in Test)',
              start: new Date().toISOString(),
            });
          }
          
          const finalEvents = eventsList;
          setEvents(finalEvents);
          
          if (finalEvents.length > 0) {
            setEventId('all');
          }
        }
      } catch (err) {
        console.error('Failed to load events:', err);
        // Fallback to default-event
        const fallbackEvents = [
          {
            id: 'default-event',
            title: 'Default Event (Check-in Test)',
            startsAt: new Date().toISOString(),
          },
        ];
        setEvents(fallbackEvents);
        setEventId('all-events');
      } finally {
        setEventsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleLoadReport = async () => {
    if (!eventId) return;
    
    setLoading(true);
    setError('');
    try {
      const endpoint = eventId === 'all' 
        ? `/api/reports/all-attendance?organizationId=default-org`
        : `/api/reports/attendance?organizationId=default-org&eventId=${eventId}`;
      
      const response = await fetch(endpoint);

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        setError('Failed to load report');
      }
    } catch (err) {
      setError('Error loading report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!report) return;

    const headers = ['Name', 'Status', 'Check-In Time', 'Check-Out Time', 'Notes'];
    const rows: string[][] = report.event.attendances.map((attendance: any) => [
      `${attendance.person.firstName} ${attendance.person.lastName}`,
      attendance.status,
      attendance.checkInAt ? new Date(attendance.checkInAt).toLocaleString() : '',
      attendance.checkOutAt ? new Date(attendance.checkOutAt).toLocaleString() : '',
      attendance.notes || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${report.event.id}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportDetailedCSV = () => {
    if (!report) return;

    const headers = ['Event Title', 'Event Location', 'Event Start', 'Event End', 'Name', 'Role', 'Level', 'Status', 'Check-In Time', 'Check-Out Time', 'Duration (min)'];
    const rows: string[][] = report.event.attendances.map((attendance: any) => {
      const checkIn = attendance.checkInAt ? new Date(attendance.checkInAt) : null;
      const checkOut = attendance.checkOutAt ? new Date(attendance.checkOutAt) : null;
      const duration = checkIn && checkOut 
        ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) 
        : '';

      // Use event data from attendance.event (for all-attendance) or fallback to report.event
      const eventData = attendance.event || report.event;
      
      return [
        eventData.title || '',
        eventData.location || '',
        eventData.startsAt ? new Date(eventData.startsAt).toLocaleString() : '',
        eventData.endsAt ? new Date(eventData.endsAt).toLocaleString() : '',
        `${attendance.person.firstName} ${attendance.person.lastName}`,
        attendance.person.role === 'YOUTH' ? 'Youth' : 'Adult',
        attendance.person.levelGroup || '',
        attendance.status === 'CHECKED_IN' ? 'In' : 'Out',
        checkIn ? checkIn.toLocaleString() : '',
        checkOut ? checkOut.toLocaleString() : '',
        String(duration),
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = eventId === 'all' 
      ? `all-attendance-${new Date().toISOString().split('T')[0]}.csv`
      : `attendance-detailed-${report.event.id}-${new Date().toISOString().split('T')[0]}.csv`;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">Attendance Reports</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4 flex-wrap">
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={eventsLoading}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an event...</option>
              <option value="all">All Attendance (All Events)</option>
              {events.map((event) => {
                const eventDate = event.start ? new Date(event.start).toLocaleDateString() : 'Date not available';
                return (
                  <option key={event.id} value={event.id}>
                    {event.title} ({eventDate})
                  </option>
                );
              })}
            </select>
            <button
              onClick={handleLoadReport}
              disabled={loading || !eventId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Load Report'}
            </button>
          </div>
          {error && <div className="mt-4 text-red-600 dark:text-red-400">{error}</div>}
          {eventsLoading && <div className="mt-4 text-gray-600 dark:text-gray-400">Loading events...</div>}
        </div>

        {report && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {report.event.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {new Date(report.event.startsAt).toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Checked In</div>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {report.stats.totalCheckedIn}
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Checked Out</div>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {report.stats.totalCheckedOut}
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total</div>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {report.stats.totalAttendances}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 relative">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Attendance Details ({report.event.attendances.length} entries)
                </h3>
                <div className="flex gap-2">
                  {report && (
                    <>
                      <button
                        onClick={handleExportCSV}
                        title="Export attendance data as CSV"
                        className="px-2 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        .CSV
                        <span className="text-xs">⬇</span>
                      </button>
                      <button
                        onClick={handleExportDetailedCSV}
                        title="Export detailed report with event information"
                        className="px-2 py-1 bg-green-200 dark:bg-green-900/40 hover:bg-green-300 dark:hover:bg-green-900/60 text-green-800 dark:text-green-300 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        .CSV+
                        <span className="text-xs">⬇</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                      <th 
                        onClick={() => handleSort('name')}
                        className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50"
                      >
                        Name<SortIndicator column="name" />
                      </th>
                      <th 
                        onClick={() => handleSort('role')}
                        className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50"
                      >
                        Role<SortIndicator column="role" />
                      </th>
                      <th 
                        onClick={() => handleSort('level')}
                        className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50"
                      >
                        Level<SortIndicator column="level" />
                      </th>
                      <th 
                        onClick={() => handleSort('status')}
                        className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50"
                      >
                        Status<SortIndicator column="status" />
                      </th>
                      <th 
                        onClick={() => handleSort('checkin')}
                        className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50"
                      >
                        Check-In<SortIndicator column="checkin" />
                      </th>
                      <th 
                        onClick={() => handleSort('checkout')}
                        className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50"
                      >
                        Check-Out<SortIndicator column="checkout" />
                      </th>
                      <th 
                        onClick={() => handleSort('duration')}
                        className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50"
                      >
                        Dur.<SortIndicator column="duration" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedAttendances().map((attendance: any) => {
                      const checkIn = attendance.checkInAt ? new Date(attendance.checkInAt) : null;
                      const checkOut = attendance.checkOutAt ? new Date(attendance.checkOutAt) : null;
                      const duration = checkIn && checkOut 
                        ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) 
                        : null;

                      return (
                        <tr key={attendance.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-2 px-2 text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap">
                            {attendance.person.firstName} {attendance.person.lastName}
                          </td>
                          <td className="py-2 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {attendance.person.role === 'YOUTH' ? 'Youth' : 'Adult'}
                          </td>
                          <td className="py-2 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {attendance.person.levelGroup || '—'}
                          </td>
                          <td className="py-2 px-2">
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                                attendance.status === 'CHECKED_IN'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              }`}
                            >
                              {attendance.status === 'CHECKED_IN' ? 'In' : 'Out'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs">
                            {checkIn ? checkIn.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}
                          </td>
                          <td className="py-2 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap text-xs">
                            {checkOut ? checkOut.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}
                          </td>
                          <td className="py-2 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {duration ? `${duration}m` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!report && !error && !eventsLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center text-gray-600 dark:text-gray-400">
            Select an event to view attendance details
          </div>
        )}
        </div>
    </div>
  );
}
