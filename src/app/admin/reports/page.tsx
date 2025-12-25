'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';

interface AttendanceReport {
  event: any;
  stats: {
    totalCheckedIn: number;
    totalCheckedOut: number;
    totalAttendances: number;
  };
}

export default function ReportsPage() {
  const [eventId, setEventId] = useState('default-event');
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">Attendance Reports</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex gap-4">
              <input
                type="text"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                placeholder="Event ID or use default"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleLoadReport}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Load Report'}
              </button>
            </div>
            {error && <div className="mt-4 text-red-600">{error}</div>}
          </div>

          {report && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  {report.event.title}
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Checked In</div>
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
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Attendances</div>
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {report.stats.totalAttendances}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                  Attendance Details
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                        <th className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Name
                        </th>
                        <th className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Status
                        </th>
                        <th className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Check-In
                        </th>
                        <th className="text-left py-2 px-4 font-semibold text-gray-700 dark:text-gray-300">
                          Check-Out
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.event.attendances.map((attendance: any) => (
                        <tr key={attendance.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                            {attendance.person.firstName} {attendance.person.lastName}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                                attendance.status === 'CHECKED_IN'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              }`}
                            >
                              {attendance.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                            {attendance.checkInAt
                              ? formatDate(new Date(attendance.checkInAt))
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                            {attendance.checkOutAt
                              ? formatDate(new Date(attendance.checkOutAt))
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!report && !error && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center text-gray-600 dark:text-gray-400">
              Select an event to view attendance details
            </div>
          )}
        </div>
    </div>
  );
}
