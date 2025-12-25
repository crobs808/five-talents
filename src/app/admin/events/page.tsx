'use client';

import { useState, useEffect } from 'react';
import { ActionButtons } from '@/components/ActionButtons';
import { Modal } from '@/components/Modal';

interface Event {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  status: string;
  attendanceCount?: number;
  source?: 'local' | 'calendar';
  sourceUrl?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLocalOnly, setShowLocalOnly] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
  });
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
  });

  useEffect(() => {
    // Load preference from localStorage on mount
    const savedPreference = localStorage.getItem('eventsShowLocalOnly');
    if (savedPreference !== null) {
      setShowLocalOnly(JSON.parse(savedPreference));
    }
    setIsHydrated(true);
    loadEvents();
  }, []);

  // Save preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('eventsShowLocalOnly', JSON.stringify(showLocalOnly));
  }, [showLocalOnly]);

  const loadEvents = async () => {
    try {
      // Fetch local events
      const localResponse = await fetch('/api/events?organizationId=default-org');
      const localData = localResponse.ok ? await localResponse.json() : [];
      
      // Fetch calendar events
      const calendarResponse = await fetch('/api/calendar/all-events?organizationId=default-org');
      const calendarData = calendarResponse.ok ? await calendarResponse.json() : [];
      
      // Add attendance counts for local events only
      const eventsWithAttendance = await Promise.all(
        localData.map(async (event: Event) => {
          try {
            const attendanceResponse = await fetch(
              `/api/reports/attendance?organizationId=default-org&eventId=${event.id}`
            );
            if (attendanceResponse.ok) {
              const attendanceData = await attendanceResponse.json();
              return {
                ...event,
                source: 'local',
                attendanceCount: attendanceData.stats?.totalAttendances || 0,
              };
            }
          } catch (err) {
            console.error('Error fetching attendance for event:', event.id, err);
          }
          return { ...event, source: 'local', attendanceCount: 0 };
        })
      );
      
      // Mark calendar events
      const calendarEventsWithSource = calendarData.map((event: any) => ({
        ...event,
        source: 'calendar',
        attendanceCount: 0,
      }));
      
      // Combine and sort by start date
      const allEvents = [...eventsWithAttendance, ...calendarEventsWithSource];
      allEvents.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      
      setEvents(allEvents);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateTimeChange = (field: 'startsAt' | 'endsAt', date: string, time: string) => {
    if (date && time) {
      const datetime = `${date}T${time}`;
      setFormData({ ...formData, [field]: datetime });
    } else {
      setFormData({ ...formData, [field]: '' });
    }
  };

  const handleEditDateTimeChange = (field: 'startsAt' | 'endsAt', date: string, time: string) => {
    if (date && time) {
      const datetime = `${date}T${time}`;
      setEditFormData({ ...editFormData, [field]: datetime });
    } else {
      setEditFormData({ ...editFormData, [field]: '' });
    }
  };

  const getDateFromDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    return dateTime.split('T')[0];
  };

  const getTimeFromDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    return dateTime.split('T')[1]?.substring(0, 5) || '';
  };

  const convertTo12Hour = (hour24: string) => {
    const h = parseInt(hour24, 10);
    if (h === 0) return '12';
    if (h > 12) return (h - 12).toString();
    return h.toString();
  };

  const getAmPm = (hour24: string) => {
    const h = parseInt(hour24, 10);
    return h >= 12 ? 'PM' : 'AM';
  };

  const convertTo24Hour = (hour12: string, ampm: string) => {
    let h = parseInt(hour12, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h.toString().padStart(2, '0');
  };

  const fetchLocationSuggestions = async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/calendar/locations?q=${encodeURIComponent(query)}&organizationId=default-org`);
      if (response.ok) {
        const data = await response.json();
        setLocationSuggestions(data.locations);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Error fetching location suggestions:', err);
    }
  };

  const handleLocationChange = (value: string) => {
    setFormData({ ...formData, location: value });
    fetchLocationSuggestions(value);
  };

  const selectLocation = (location: string) => {
    setFormData({ ...formData, location });
    setShowSuggestions(false);
  };

  const fetchTitleSuggestions = async (query: string) => {
    if (!query.trim()) {
      setTitleSuggestions([]);
      setShowTitleSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/calendar/event-titles?q=${encodeURIComponent(query)}&organizationId=default-org`);
      if (response.ok) {
        const data = await response.json();
        console.log('Title suggestions received:', data);
        setTitleSuggestions(data.titles || []);
        setShowTitleSuggestions(true);
      } else {
        console.error('API response not ok:', response.status);
      }
    } catch (err) {
      console.error('Error fetching title suggestions:', err);
    }
  };

  const handleTitleChange = (value: string) => {
    setFormData({ ...formData, title: value });
    fetchTitleSuggestions(value);
  };

  const selectTitle = (title: string) => {
    setFormData({ ...formData, title });
    setShowTitleSuggestions(false);
  };


  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'default-org',
          ...formData,
        }),
      });

      if (response.ok) {
        setFormData({ title: '', description: '', startsAt: '', endsAt: '', location: '' });
        setShowForm(false);
        loadEvents();
      }
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  const handleSetActive = async (eventId: string) => {
    try {
      // First, set all other events to DRAFT
      for (const event of events) {
        if (event.id !== eventId && event.status === 'ACTIVE') {
          await fetch(`/api/events/${event.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'DRAFT' }),
          });
        }
      }

      // Set selected event to ACTIVE
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });

      loadEvents();
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const handleSetInactive = async (eventId: string) => {
    try {
      await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' }),
      });

      loadEvents();
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title,
      description: '',
      startsAt: event.startsAt,
      endsAt: event.endsAt || '',
      location: event.location || '',
    });
    setShowEditForm(true);
  };

  const hasEditFormChanged = () => {
    if (!editingEvent) return false;
    return (
      editFormData.title !== editingEvent.title ||
      editFormData.startsAt !== editingEvent.startsAt ||
      editFormData.endsAt !== (editingEvent.endsAt || '') ||
      editFormData.location !== (editingEvent.location || '')
    );
  };

  const isCreateFormValid = () => {
    return formData.title.trim() && formData.startsAt;
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          organizationId: 'default-org',
        }),
      });

      if (response.ok) {
        setShowEditForm(false);
        setEditingEvent(null);
        setEditFormData({ title: '', description: '', startsAt: '', endsAt: '', location: '' });
        loadEvents();
      }
    } catch (err) {
      console.error('Error updating event:', err);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        loadEvents();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Events</h1>
              {isHydrated && (
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${showLocalOnly ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                    All
                  </span>
                  <button
                    onClick={() => setShowLocalOnly(!showLocalOnly)}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                      showLocalOnly 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        showLocalOnly ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${showLocalOnly ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                    Local Only
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              + New Event
            </button>
          </div>

        {showForm && (
          <Modal 
            isOpen={showForm} 
            onClose={() => setShowForm(false)} 
            title="Add New Event"
            onCloseAttempt={() => {
              // Only allow close if form is empty
              const isFormEmpty = !formData.title.trim() && !formData.startsAt && !formData.endsAt && !formData.location.trim();
              return isFormEmpty;
            }}
          >
            <form onSubmit={(e) => { e.preventDefault(); handleCreateEvent(e); }}>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onFocus={() => formData.title && setShowTitleSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 200)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start typing to see suggestions..."
                    required
                  />
                  {showTitleSuggestions && titleSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {titleSuggestions.map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => selectTitle(title)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date & Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={getDateFromDateTime(formData.startsAt)}
                      onChange={(e) => handleDateTimeChange('startsAt', e.target.value, getTimeFromDateTime(formData.startsAt))}
                      onFocus={(e) => e.currentTarget.showPicker?.()}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      required
                    />
                    <div className="flex gap-1">
                      <select
                        value={convertTo12Hour(getTimeFromDateTime(formData.startsAt).split(':')[0] || '00')}
                        onChange={(e) => {
                          const minutes = getTimeFromDateTime(formData.startsAt).split(':')[1] || '00';
                          const ampm = getAmPm(getTimeFromDateTime(formData.startsAt).split(':')[0] || '00');
                          const hour24 = convertTo24Hour(e.target.value, ampm);
                          handleDateTimeChange('startsAt', getDateFromDateTime(formData.startsAt), `${hour24}:${minutes}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                          <option key={h} value={h.toString()}>{h.toString()}</option>
                        ))}
                      </select>
                      <span className="py-2 text-gray-700 dark:text-gray-300">:</span>
                      <select
                        value={getTimeFromDateTime(formData.startsAt).split(':')[1] || '00'}
                        onChange={(e) => {
                          const hour = getTimeFromDateTime(formData.startsAt).split(':')[0] || '00';
                          handleDateTimeChange('startsAt', getDateFromDateTime(formData.startsAt), `${hour}:${e.target.value}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="00">00</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                      </select>
                      <select
                        value={getAmPm(getTimeFromDateTime(formData.startsAt).split(':')[0] || '00')}
                        onChange={(e) => {
                          const hour12 = convertTo12Hour(getTimeFromDateTime(formData.startsAt).split(':')[0] || '00');
                          const minutes = getTimeFromDateTime(formData.startsAt).split(':')[1] || '00';
                          const hour24 = convertTo24Hour(hour12, e.target.value);
                          handleDateTimeChange('startsAt', getDateFromDateTime(formData.startsAt), `${hour24}:${minutes}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date & Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={getDateFromDateTime(formData.endsAt)}
                      onChange={(e) => handleDateTimeChange('endsAt', e.target.value, getTimeFromDateTime(formData.endsAt))}
                      onFocus={(e) => e.currentTarget.showPicker?.()}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex gap-1">
                      <select
                        value={convertTo12Hour(getTimeFromDateTime(formData.endsAt).split(':')[0] || '00')}
                        onChange={(e) => {
                          const minutes = getTimeFromDateTime(formData.endsAt).split(':')[1] || '00';
                          const ampm = getAmPm(getTimeFromDateTime(formData.endsAt).split(':')[0] || '00');
                          const hour24 = convertTo24Hour(e.target.value, ampm);
                          handleDateTimeChange('endsAt', getDateFromDateTime(formData.endsAt), `${hour24}:${minutes}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                          <option key={h} value={h.toString()}>{h.toString()}</option>
                        ))}
                      </select>
                      <span className="py-2 text-gray-700 dark:text-gray-300">:</span>
                      <select
                        value={getTimeFromDateTime(formData.endsAt).split(':')[1] || '00'}
                        onChange={(e) => {
                          const hour = getTimeFromDateTime(formData.endsAt).split(':')[0] || '00';
                          handleDateTimeChange('endsAt', getDateFromDateTime(formData.endsAt), `${hour}:${e.target.value}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="00">00</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                      </select>
                      <select
                        value={getAmPm(getTimeFromDateTime(formData.endsAt).split(':')[0] || '00')}
                        onChange={(e) => {
                          const hour12 = convertTo12Hour(getTimeFromDateTime(formData.endsAt).split(':')[0] || '00');
                          const minutes = getTimeFromDateTime(formData.endsAt).split(':')[1] || '00';
                          const hour24 = convertTo24Hour(hour12, e.target.value);
                          handleDateTimeChange('endsAt', getDateFromDateTime(formData.endsAt), `${hour24}:${minutes}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onFocus={() => formData.location && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Start typing to see suggestions..."
                  />
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {locationSuggestions.map((location) => (
                        <button
                          key={location}
                          type="button"
                          onClick={() => selectLocation(location)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          {location}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!isCreateFormValid()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                  >
                    Create Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Modal>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-900 dark:text-gray-100">Loading events...</div>
        ) : (() => {
          const filteredEvents = showLocalOnly 
            ? events.filter(e => e.source === 'local')
            : events;
          return filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              {showLocalOnly ? 'No local events found.' : 'No events found. Create one to get started.'}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-lg p-6 transition-shadow ${
                    event.source === 'calendar'
                      ? 'bg-gray-100 dark:bg-gray-900 border-2 border-gray-400 dark:border-gray-700 opacity-75'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-xl font-semibold ${
                          event.source === 'calendar'
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {event.title}
                        </h3>
                        {event.source === 'local' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium" title="Created locally, not synced to calendar">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5m-15-4h10m-10 3h10m-10 3h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Local
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium" title="Synced from Google Calendar">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" fillOpacity="0.3"/>
                              <path d="M6 5v2m8-2v2M7 13h6m-6 2h6m-9-7h12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                            </svg>
                            GCal
                          </span>
                        )}
                        {event.status === 'ACTIVE' && event.source !== 'calendar' && (
                          <button
                            onClick={() => handleSetInactive(event.id)}
                            className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-semibold hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer transition-colors"
                            title="Click to deactivate this event"
                          >
                            ACTIVE
                          </button>
                        )}
                        {event.source === 'local' && event.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleSetActive(event.id)}
                            className="px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                            title="Click to activate this event"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                      <p className={`text-sm ${
                        event.source === 'calendar'
                          ? 'text-gray-600 dark:text-gray-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {new Date(event.startsAt).toLocaleDateString()} at{' '}
                        {new Date(event.startsAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {event.location && (
                        <p className={`text-sm ${
                          event.source === 'calendar'
                            ? 'text-gray-600 dark:text-gray-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>{event.location}</p>
                      )}
                      {event.source === 'local' && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                          Attended: {event.attendanceCount || 0}
                        </p>
                      )}
                    </div>
                    {event.source === 'local' && (
                      <ActionButtons onEdit={() => openEditModal(event)} onDelete={() => handleDeleteEvent(event.id)} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
        </div>

        {showEditForm && editingEvent && (
          <Modal 
            isOpen={showEditForm} 
            onClose={() => setShowEditForm(false)} 
            title="Edit Event"
            onCloseAttempt={() => {
              // Only allow close if no changes were made
              return !hasEditFormChanged();
            }}
          >
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateEvent(e); }}>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date & Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={getDateFromDateTime(editFormData.startsAt)}
                      onChange={(e) => handleEditDateTimeChange('startsAt', e.target.value, getTimeFromDateTime(editFormData.startsAt))}
                      onFocus={(e) => e.currentTarget.showPicker?.()}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      required
                    />
                    <div className="flex gap-1">
                      <select
                        value={convertTo12Hour(getTimeFromDateTime(editFormData.startsAt).split(':')[0] || '00')}
                        onChange={(e) => {
                          const minutes = getTimeFromDateTime(editFormData.startsAt).split(':')[1] || '00';
                          const ampm = getAmPm(getTimeFromDateTime(editFormData.startsAt).split(':')[0] || '00');
                          const hour24 = convertTo24Hour(e.target.value, ampm);
                          handleEditDateTimeChange('startsAt', getDateFromDateTime(editFormData.startsAt), `${hour24}:${minutes}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                          <option key={h} value={h.toString()}>{h.toString()}</option>
                        ))}
                      </select>
                      <span className="py-2 text-gray-700 dark:text-gray-300">:</span>
                      <select
                        value={getTimeFromDateTime(editFormData.startsAt).split(':')[1] || '00'}
                        onChange={(e) => {
                          const hour = getTimeFromDateTime(editFormData.startsAt).split(':')[0] || '00';
                          handleEditDateTimeChange('startsAt', getDateFromDateTime(editFormData.startsAt), `${hour}:${e.target.value}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="00">00</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                      </select>
                      <select
                        value={getAmPm(getTimeFromDateTime(editFormData.startsAt).split(':')[0] || '00')}
                        onChange={(e) => {
                          const hour12 = convertTo12Hour(getTimeFromDateTime(editFormData.startsAt).split(':')[0] || '00');
                          const minutes = getTimeFromDateTime(editFormData.startsAt).split(':')[1] || '00';
                          const hour24 = convertTo24Hour(hour12, e.target.value);
                          handleEditDateTimeChange('startsAt', getDateFromDateTime(editFormData.startsAt), `${hour24}:${minutes}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date & Time
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={getDateFromDateTime(editFormData.endsAt)}
                      onChange={(e) => handleEditDateTimeChange('endsAt', e.target.value, getTimeFromDateTime(editFormData.endsAt))}
                      onFocus={(e) => e.currentTarget.showPicker?.()}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex gap-1">
                      <select
                        value={convertTo12Hour(getTimeFromDateTime(editFormData.endsAt).split(':')[0] || '00')}
                        onChange={(e) => {
                          const minutes = getTimeFromDateTime(editFormData.endsAt).split(':')[1] || '00';
                          const ampm = getAmPm(getTimeFromDateTime(editFormData.endsAt).split(':')[0] || '00');
                          const hour24 = convertTo24Hour(e.target.value, ampm);
                          handleEditDateTimeChange('endsAt', getDateFromDateTime(editFormData.endsAt), `${hour24}:${minutes}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                          <option key={h} value={h.toString()}>{h.toString()}</option>
                        ))}
                      </select>
                      <span className="py-2 text-gray-700 dark:text-gray-300">:</span>
                      <select
                        value={getTimeFromDateTime(editFormData.endsAt).split(':')[1] || '00'}
                        onChange={(e) => {
                          const hour = getTimeFromDateTime(editFormData.endsAt).split(':')[0] || '00';
                          handleEditDateTimeChange('endsAt', getDateFromDateTime(editFormData.endsAt), `${hour}:${e.target.value}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="00">00</option>
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                      </select>
                      <select
                        value={getAmPm(getTimeFromDateTime(editFormData.endsAt).split(':')[0] || '00')}
                        onChange={(e) => {
                          const hour12 = convertTo12Hour(getTimeFromDateTime(editFormData.endsAt).split(':')[0] || '00');
                          const minutes = getTimeFromDateTime(editFormData.endsAt).split(':')[1] || '00';
                          const hour24 = convertTo24Hour(hour12, e.target.value);
                          handleEditDateTimeChange('endsAt', getDateFromDateTime(editFormData.endsAt), `${hour24}:${minutes}`);
                        }}
                        className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Location"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={!hasEditFormChanged()}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Modal>
        )}
    </div>
  );
}
