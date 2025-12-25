'use client';

import { useState, useEffect } from 'react';

interface CalendarUrl {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const [checkInGraceMinutes, setCheckInGraceMinutes] = useState(30);
  const [calendarUrls, setCalendarUrls] = useState<CalendarUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newCalendarName, setNewCalendarName] = useState('');
  const [newCalendarUrl, setNewCalendarUrl] = useState('');
  const organizationId = 'default-org';

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, calendarRes] = await Promise.all([
          fetch(`/api/settings?organizationId=${organizationId}`),
          fetch(`/api/calendar-urls?organizationId=${organizationId}`),
        ]);
        
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setCheckInGraceMinutes(data.checkInGraceMinutes);
        }
        
        if (calendarRes.ok) {
          const data = await calendarRes.json();
          setCalendarUrls(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          checkInGraceMinutes: parseInt(checkInGraceMinutes.toString()),
        }),
      });

      if (response.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCalendarUrl = async () => {
    if (!newCalendarName.trim() || !newCalendarUrl.trim()) {
      setMessage('Please fill in both name and URL');
      return;
    }

    try {
      const response = await fetch('/api/calendar-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          name: newCalendarName,
          url: newCalendarUrl,
        }),
      });

      if (response.ok) {
        const newUrl = await response.json();
        setCalendarUrls([...calendarUrls, newUrl]);
        setNewCalendarName('');
        setNewCalendarUrl('');
        setMessage('Calendar URL added successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to add calendar URL');
    }
  };

  const handleToggleCalendarUrl = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/calendar-urls', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });

      if (response.ok) {
        setCalendarUrls(calendarUrls.map(url => 
          url.id === id ? { ...url, isActive: !isActive } : url
        ));
      } else {
        setMessage('Failed to update calendar URL');
      }
    } catch (error) {
      setMessage('Failed to update calendar URL');
    }
  };

  const handleDeleteCalendarUrl = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calendar URL?')) return;

    try {
      const response = await fetch(`/api/calendar-urls?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCalendarUrls(calendarUrls.filter(url => url.id !== id));
        setMessage('Calendar URL deleted successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to delete calendar URL');
      }
    } catch (error) {
      setMessage('Failed to delete calendar URL');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">Settings</h1>

        {message && (
          <div className={`p-3 rounded-lg ${
            message.includes('Error') || message.includes('Failed')
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          }`}>
            {message}
          </div>
        )}

        {/* Check-In Settings */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Check-In Settings
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Early Check-In Grace Period
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Allow people to check in this many minutes before an event starts
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="120"
                value={checkInGraceMinutes}
                onChange={(e) => setCheckInGraceMinutes(parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
              />
              <span className="text-gray-700 dark:text-gray-300">minutes</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Example: With 30 minutes grace period, a 7:00pm event will show as "Happening Now" at 6:30pm
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Check-In Settings'}
          </button>
        </div>

        {/* Calendar URLs Management */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Calendar URLs
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Manage multiple webcal/ical links to sync events from different sources
          </p>

          {/* Add New Calendar URL */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Add New Calendar
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Calendar Name
                </label>
                <input
                  type="text"
                  value={newCalendarName}
                  onChange={(e) => setNewCalendarName(e.target.value)}
                  placeholder="e.g., Main Calendar, Youth Events"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Calendar URL (webcal or http)
                </label>
                <input
                  type="text"
                  value={newCalendarUrl}
                  onChange={(e) => setNewCalendarUrl(e.target.value)}
                  placeholder="https://... or webcal://..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <button
                onClick={handleAddCalendarUrl}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                + Add Calendar
              </button>
            </div>
          </div>

          {/* Calendar URLs List */}
          <div className="space-y-2">
            {calendarUrls.length === 0 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No calendar URLs configured yet. Add one to get started.
              </p>
            ) : (
              calendarUrls.map((cal) => (
                <div
                  key={cal.id}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{cal.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{cal.url}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cal.isActive}
                        onChange={() => handleToggleCalendarUrl(cal.id, cal.isActive)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {cal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteCalendarUrl(cal.id)}
                      className="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
