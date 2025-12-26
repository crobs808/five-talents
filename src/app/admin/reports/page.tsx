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
}

export default function ReportsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState('');
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eventsLoading, setEventsLoading] = useState(true);

  // Load available events on mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch(
          '/api/events?organizationId=default-org'
        );
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
          if (data.events && data.events.length > 0) {
            setEventId(data.events[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load events');
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
      const response = await fetch(
        `/api/reports/attendance?organizationId=default-org&eventId=${eventId}`
      );

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      } else {
        setError('Event not found');
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
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} ({new Date(event.startsAt).toLocaleDateString()})
                </option>
              ))}
            </select>
            <button
              onClick={handleLoadReport}
              disabled={loading || !eventId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Load Report'}
            </button>
            {report && (
              <button
                onClick={handleExportCSV}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                Export CSV
              </button>
            )}
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Attendance Details ({report.event.attendances.length} entries)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Check-In</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Check-Out</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.event.attendances.map((attendance: any) => {
                      const checkIn = attendance.checkInAt ? new Date(attendance.checkInAt) : null;
                      const checkOut = attendance.checkOutAt ? new Date(attendance.checkOutAt) : null;
                      const duration = checkIn && checkOut 
                        ? Math.round((checkOut.getTime() - checkIn.getTime()) / 60000) 
                        : null;

                      return (
                        <tr key={attendance.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100 font-medium">
                            {attendance.person.firstName} {attendance.person.lastName}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                                attendance.status === 'CHECKED_IN'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              }`}
                            >
                              {attendance.status === 'CHECKED_IN' ? 'In' : 'Out'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {checkIn ? checkIn.toLocaleString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {checkOut ? checkOut.toLocaleString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            {duration ? `${duration} min` : '—'}
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
