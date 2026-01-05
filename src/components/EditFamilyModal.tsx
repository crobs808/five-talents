'use client';

import { useState, useEffect, useRef } from 'react';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  role: 'ADULT' | 'YOUTH';
  levelGroup?: string;
  position?: string;
}

interface PastEvent {
  id: string;
  title: string;
  start: string;
  isLocal?: boolean;
}

interface EditFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  familyName: string;
  primaryPhone: string;
  people: Person[];
  onSave: (data: {
    familyName: string;
    primaryPhone: string;
    people: Person[];
  }) => Promise<void>;
  isLoading: boolean;
}

export function EditFamilyModal({
  isOpen,
  onClose,
  familyId,
  familyName,
  primaryPhone,
  people,
  onSave,
  isLoading,
}: EditFamilyModalProps) {
  const [formData, setFormData] = useState({
    familyName,
    primaryPhone,
    people: [...people],
  });
  const [error, setError] = useState('');
  const [pastEvents, setPastEvents] = useState<PastEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [initialSelectedEvents, setInitialSelectedEvents] = useState<string[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const lastPersonRef = useRef<HTMLDivElement>(null);
  const lastPersonFirstNameRef = useRef<HTMLInputElement>(null);
  const [selectedPeopleForAttendance, setSelectedPeopleForAttendance] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchPastEvents();
    }
  }, [isOpen]);

  const fetchPastEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch('/api/calendar/past-events');
      if (response.ok) {
        const data = await response.json();
        // Deduplicate events by ID, keeping the first occurrence
        const uniqueEvents = Array.from(
          new Map((data.events || []).map((event: PastEvent) => [event.id, event])).values()
        ) as PastEvent[];
        // Sort by date (most recent first)
        uniqueEvents.sort((a: PastEvent, b: PastEvent) => {
          const dateA = new Date(a.start).getTime();
          const dateB = new Date(b.start).getTime();
          return dateB - dateA; // Descending order (recent to oldest)
        });
        setPastEvents(uniqueEvents);
      }
    } catch (err) {
      console.error('Failed to fetch past events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const formatEventDate = (isoString: string) => {
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}-${day}-${year}`;
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId]
    );
  };

  const hasAttendanceChanges = selectedEvents.length > 0 && 
    selectedPeopleForAttendance.length > 0 &&
    JSON.stringify(selectedEvents.sort()) !== JSON.stringify(initialSelectedEvents.sort());

  const handleSaveAttendance = async () => {
    if (!hasAttendanceChanges || selectedPeopleForAttendance.length === 0) return;

    try {
      setSavingAttendance(true);
      setAttendanceError('');
      
      // Log the request for debugging
      console.log('Sending retroactive attendance request:', {
        familyId,
        eventIds: selectedEvents,
        personIds: selectedPeopleForAttendance,
      });
      
      const response = await fetch('/api/attendance/retroactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId,
          eventIds: selectedEvents,
          personIds: selectedPeopleForAttendance,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save attendance');
      }

      const data = await response.json();
      
      // Log the response for debugging
      console.log('Retroactive attendance response:', data);
      
      // Show feedback about what was saved
      let message = `Successfully marked ${data.marked} attendance records for ${selectedPeopleForAttendance.length} family member(s) and ${selectedEvents.length} event(s)`;
      if (data.failedEventIds && data.failedEventIds.length > 0) {
        message += `.\n\nNote: ${data.failedEventIds.length} event(s) could not be found in calendar.`;
        console.warn('Failed to find events in calendar:', data.failedEventIds);
      }
      
      setInitialSelectedEvents([...selectedEvents]);
      setAttendanceError(''); // Clear any errors
      
      // Show success but keep the dialog open so user can see the result
      alert(message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save attendance';
      console.error('Error saving attendance:', err);
      setAttendanceError(errorMessage);
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleFamilyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, familyName: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, primaryPhone: e.target.value });
  };

  const handlePersonChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...formData.people];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, people: updated });
  };

  const addPerson = () => {
    setFormData({
      ...formData,
      people: [
        ...formData.people,
        {
          id: `new-${Date.now()}`,
          firstName: '',
          lastName: '',
          role: 'YOUTH',
          levelGroup: '',
        },
      ],
    });
    
    // Scroll to the new person and focus first name input after render
    setTimeout(() => {
      lastPersonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      lastPersonFirstNameRef.current?.focus();
    }, 0);
  };

  const removePerson = (index: number) => {
    const updated = formData.people.filter((_, i) => i !== index);
    setFormData({ ...formData, people: updated });
  };

  const handleSave = async () => {
    if (!formData.familyName.trim()) {
      setError('Family name is required');
      return;
    }
    if (!formData.primaryPhone.trim()) {
      setError('Primary phone is required');
      return;
    }
    if (formData.people.length === 0) {
      setError('At least one person is required');
      return;
    }

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save family');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Edit Family</h2>
        </div>

        <div className="px-6 py-4 space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Family Name
            </label>
            <input
              type="text"
              value={formData.familyName}
              onChange={handleFamilyNameChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Primary Phone
            </label>
            <input
              type="tel"
              value={formData.primaryPhone}
              onChange={handlePhoneChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Family Members</h3>
              <button
                onClick={addPerson}
                className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Add Person
              </button>
            </div>

            <div className="space-y-4">
              {formData.people.map((person, index) => (
                <div
                  ref={index === formData.people.length - 1 ? lastPersonRef : null}
                  key={person.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                >
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        First Name
                      </label>
                      <input
                        ref={index === formData.people.length - 1 ? lastPersonFirstNameRef : null}
                        type="text"
                        value={person.firstName}
                        onChange={(e) =>
                          handlePersonChange(index, 'firstName', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={person.lastName}
                        onChange={(e) =>
                          handlePersonChange(index, 'lastName', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Role
                      </label>
                      <select
                        value={person.role}
                        onChange={(e) =>
                          handlePersonChange(index, 'role', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100"
                      >
                        <option value="ADULT">Adult</option>
                        <option value="YOUTH">Youth</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {person.role === 'ADULT' ? 'Position' : 'Level'}
                      </label>
                      <input
                        type="text"
                        value={person.role === 'ADULT' ? (person.position || '') : (person.levelGroup || '')}
                        onChange={(e) =>
                          handlePersonChange(
                            index,
                            person.role === 'ADULT' ? 'position' : 'levelGroup',
                            e.target.value
                          )
                        }
                        placeholder={person.role === 'ADULT' ? 'e.g., Leader' : 'e.g., Navigator'}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removePerson(index)}
                    className="text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    Remove Person
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Retroactive Attendance (Past 6 months)
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Family Members
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900 max-h-32 overflow-y-auto">
                {formData.people.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No family members to select</p>
                ) : (
                  <div className="space-y-2">
                    {formData.people.map((person) => (
                      <label key={person.id} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedPeopleForAttendance.includes(person.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPeopleForAttendance([...selectedPeopleForAttendance, person.id]);
                            } else {
                              setSelectedPeopleForAttendance(selectedPeopleForAttendance.filter(id => id !== person.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-gray-700 dark:text-gray-300">
                          {person.firstName} {person.lastName} ({person.role === 'YOUTH' ? 'Youth' : 'Adult'})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedPeopleForAttendance.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {selectedPeopleForAttendance.length} member{selectedPeopleForAttendance.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {loadingEvents ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">Loading events...</div>
            ) : pastEvents.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">No events found in the past 6 months</div>
            ) : (
              <>
                {attendanceError && (
                  <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-3 py-2 rounded mb-3 text-sm">
                    {attendanceError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 mb-3">
                  {pastEvents.map((event, index) => (
                    <label key={`${event.id}-${index}`} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={() => toggleEventSelection(event.id)}
                        className="rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatEventDate(event.start)}: {event.title}
                      </span>
                      {event.isLocal && (
                        <span className="inline-flex items-center gap-0.5 ml-auto px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs font-medium" title="Created locally, not synced to calendar">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5m-15-4h10m-10 3h10m-10 3h6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                <button
                  onClick={handleSaveAttendance}
                  disabled={!hasAttendanceChanges || savingAttendance}
                  className={`text-sm px-3 py-1 rounded ${
                    hasAttendanceChanges && !savingAttendance
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {savingAttendance ? 'Saving...' : 'Save Attendance'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
