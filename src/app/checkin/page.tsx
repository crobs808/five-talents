'use client';

import { useState, useEffect, useCallback } from 'react';
import { NumericKeypad } from '@/components/NumericKeypad';
import { maskPhoneForDisplay } from '@/lib/utils';

interface Household {
  id: string;
  familyName: string;
  primaryPhoneE164: string;
  people: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string;
  end: string;
  allDay: boolean;
}

export default function CheckInPage() {
  const [organizationId] = useState('default-org');
  const [screen, setScreen] = useState<'keypad' | 'households' | 'roster'>('keypad');
  const [phoneLast4, setPhoneLast4] = useState('');
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nextEvent, setNextEvent] = useState<CalendarEvent | null>(null);
  const [eventStatus, setEventStatus] = useState<'active' | 'starting-soon' | 'upcoming'>('upcoming');
  const [graceMinutes, setGraceMinutes] = useState(30);
  const [activeEventId, setActiveEventId] = useState<string>('default-event');

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/api/settings?organizationId=${organizationId}`);
        const data = await response.json();
        if (data.checkInGraceMinutes !== undefined) {
          setGraceMinutes(data.checkInGraceMinutes);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    
    fetchSettings();
  }, [organizationId]);

  // Fetch next event on mount
  useEffect(() => {
    const fetchNextEvent = async () => {
      try {
        const response = await fetch(`/api/calendar?graceMinutes=${graceMinutes}`);
        const data = await response.json();
        if (data.nextEvent) {
          setNextEvent(data.nextEvent);
          setEventStatus(data.eventStatus || 'upcoming');
          // Use 'default-event' for check-ins (our main event in the database)
          // This ensures consistency across check-in sessions
          setActiveEventId('default-event');
        }
      } catch (err) {
        console.error('Error fetching calendar event:', err);
        // Fallback to default-event if calendar fails
        setActiveEventId('default-event');
      }
    };
    
    fetchNextEvent();
  }, [graceMinutes]);

  const handleKeypadSubmit = useCallback(
    async (value: string) => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `/api/families?organizationId=${organizationId}&phoneLast4=${value}`
        );
        const data = await response.json();

        if (!response.ok) {
          setError('Phone number not found. Please contact staff.');
          return;
        }

        if (data.length === 0) {
          setError('Phone number not found. Please contact staff.');
        } else if (data.length === 1) {
          setSelectedHousehold(data[0]);
          setScreen('roster');
        } else {
          setHouseholds(data);
          setScreen('households');
        }
      } catch (err) {
        setError('Error searching families. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [organizationId]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {screen === 'keypad' && (
          <div>
            <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
              Event Check In
            </h1>
            
            {/* Next Event Display */}
            {nextEvent && (
              <div className={`mb-8 p-6 border-2 rounded-lg ${
                eventStatus === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
                  : eventStatus === 'starting-soon'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600'
                  : 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
              }`}>
                <div className="text-center">
                  <div className={`text-sm font-semibold uppercase tracking-wide mb-1 ${
                    eventStatus === 'active'
                      ? 'text-green-700 dark:text-green-300'
                      : eventStatus === 'starting-soon'
                      ? 'text-yellow-700 dark:text-yellow-300'
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {eventStatus === 'active' ? '🟢 Happening Now' : eventStatus === 'starting-soon' ? '🕐 Starting Soon' : '🗓️ Coming Up'}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {nextEvent.title}
                  </div>
                  <div className="text-lg text-gray-700 dark:text-gray-300">
                    {new Date(nextEvent.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-md text-gray-600 dark:text-gray-400">
                    {new Date(nextEvent.start).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {nextEvent.location && ` • ${nextEvent.location}`}
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-lg">
                Enter the last 4 digits of your phone number
              </p>
              <NumericKeypad
                value={phoneLast4}
                maxLength={4}
                onSubmit={handleKeypadSubmit}
                onClear={() => setPhoneLast4('')}
                onChange={setPhoneLast4}
                disabled={loading}
              />
              {error && (
                <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg text-center font-medium">
                  {error}
                </div>
              )}
            </div>
          )}

          {screen === 'households' && households.length > 1 && (
            <div>
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Multiple Matches Found</h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                Which household is yours?
              </p>
              <div className="space-y-3">
                {households.map((household) => (
                  <button
                    key={household.id}
                    onClick={() => {
                      setSelectedHousehold(household);
                      setScreen('roster');
                    }}
                  className="w-full p-6 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                  >
                    <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {household.familyName}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {maskPhoneForDisplay(household.primaryPhoneE164)}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setScreen('keypad');
                  setPhoneLast4('');
                  setHouseholds([]);
                }}
                className="w-full mt-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Back
              </button>
            </div>
          )}

          {screen === 'roster' && selectedHousehold && (
            <HouseholdRoster household={selectedHousehold} nextEvent={nextEvent} eventStatus={eventStatus} activeEventId={activeEventId} onBack={() => {
              setScreen('keypad');
              setPhoneLast4('');
              setSelectedHousehold(null);
            }} />
          )}
        </div>
      </div>
    );
  }

function HouseholdRoster({
  household,
  nextEvent,
  eventStatus,
  activeEventId,
  onBack,
}: {
  household: Household;
  nextEvent: CalendarEvent | null;
  eventStatus: 'active' | 'starting-soon' | 'upcoming';
  activeEventId: string;
  onBack: () => void;
}) {
  const youth = household.people.filter((p) => p.role === 'YOUTH');
  const adults = household.people.filter((p) => p.role === 'ADULT');
  const [checkedInPeople, setCheckedInPeople] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState<Record<string, boolean>>({});
  const organizationId = 'default-org';

  // Load check-in status on mount
  useEffect(() => {
    const loadCheckinStatus = async () => {
      try {
        const url = `/api/checkin/status?organizationId=${organizationId}&eventId=${activeEventId}&familyId=${household.id}`;
        console.log('Loading check-in status from:', url);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          console.log('Check-in status response:', data);
          // Convert checkedInStatus map to boolean record
          const statusMap: Record<string, boolean> = {};
          Object.keys(data.checkedInStatus).forEach((personId) => {
            statusMap[personId] = true;
          });
          console.log('Status map:', statusMap);
          setAlreadyCheckedIn(statusMap);
        } else {
          console.log('Status check failed:', response.status);
        }
      } catch (err) {
        console.error('Error loading check-in status:', err);
      }
    };

    loadCheckinStatus();
  }, [household.id, activeEventId, organizationId]);

  // Track checked-in people
  const handlePersonCheckedIn = (personId: string) => {
    const updated = new Set(checkedInPeople);
    updated.add(personId);
    setCheckedInPeople(updated);
  };

  // Track unchecked people
  const handlePersonUncheckedIn = (personId: string) => {
    const updated = new Set(checkedInPeople);
    updated.delete(personId);
    setCheckedInPeople(updated);
  };

  // Check if at least one person is newly checked in
  const hasNewCheckins = checkedInPeople.size > 0;

  const handleDone = () => {
    if (hasNewCheckins) {
      setShowSuccess(true);
      setCountdown(4);
    }
  };

  // Countdown effect
  useEffect(() => {
    if (!showSuccess) return;
    
    if (countdown === 0) {
      onBack();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showSuccess, countdown, onBack]);

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mb-6 text-7xl animate-bounce">✓</div>
          <h2 className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
            Check-in Complete!
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
            {checkedInPeople.size} {checkedInPeople.size === 1 ? 'person' : 'people'} recorded
          </p>
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-400 dark:border-green-600 rounded-lg p-6 mb-8">
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Thank you! You're all set. Have a great event!
            </p>
          </div>
          <div className="mb-8 text-6xl font-bold text-blue-600 dark:text-blue-400">
            {countdown}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Returning to check-in screen...
          </p>
          <button
            onClick={onBack}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Check In Another Family
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-gray-100">{household.familyName}</h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        Select people to check in
      </p>

      {adults.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Adults:</h3>
          <div className="space-y-3">
            {adults.map((adult) => (
              <CheckInCard 
                key={adult.id} 
                person={adult} 
                eventId={activeEventId} 
                isEnabled={eventStatus === 'active' || eventStatus === 'starting-soon'}
                onCheckedIn={() => handlePersonCheckedIn(adult.id)}
                onUncheckedIn={() => handlePersonUncheckedIn(adult.id)}
                alreadyCheckedIn={!!alreadyCheckedIn[adult.id]}
              />
            ))}
          </div>
        </div>
      )}

      {youth.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Youth:</h3>
          <div className="space-y-3">
            {youth.map((child) => (
              <CheckInCard 
                key={child.id} 
                person={child} 
                eventId={activeEventId} 
                isEnabled={eventStatus === 'active' || eventStatus === 'starting-soon'}
                onCheckedIn={() => handlePersonCheckedIn(child.id)}
                onUncheckedIn={() => handlePersonUncheckedIn(child.id)}
                alreadyCheckedIn={!!alreadyCheckedIn[child.id]}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        <button
          onClick={handleDone}
          disabled={!hasNewCheckins}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            hasNewCheckins
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {hasNewCheckins ? `✓ Done - ${checkedInPeople.size} Checked In` : 'Select someone to check in'}
        </button>
        
        <button
          onClick={onBack}
          className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function CheckInCard({ person, eventId, isEnabled, onCheckedIn, onUncheckedIn, alreadyCheckedIn = false }: { person: any; eventId: string; isEnabled: boolean; onCheckedIn: () => void; onUncheckedIn: () => void; alreadyCheckedIn?: boolean }) {
  const [isChecked, setIsChecked] = useState(alreadyCheckedIn);
  const [loading, setLoading] = useState(false);
  const [pickupCode, setPickupCode] = useState('');
  const [isAlreadyChecked, setIsAlreadyChecked] = useState(alreadyCheckedIn);

  // Update state when alreadyCheckedIn prop changes (when status API responds)
  useEffect(() => {
    if (alreadyCheckedIn) {
      setIsChecked(true);
      setIsAlreadyChecked(true);
    }
  }, [alreadyCheckedIn]);

  const handleToggleCheckIn = async () => {
    if (!isEnabled) return;
    
    if (isChecked) {
      // Toggle off - clear the state (but not if they were already checked in)
      if (!isAlreadyChecked) {
        setIsChecked(false);
        setPickupCode('');
        onUncheckedIn(); // Notify parent that this person was unchecked
      }
      return;
    }

    // Toggle on - check in
    setLoading(true);
    try {
      const organizationId = 'default-org';

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          eventId,
          personId: person.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // pickupCode will only exist for youth
        if (data.pickupCode) {
          setPickupCode(data.pickupCode.code);
        }
        setIsChecked(true);
        onCheckedIn(); // Notify parent that this person was checked in
      }
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`border-2 rounded-lg p-6 transition-all ${
      isChecked
        ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {person.firstName} {person.lastName}
          </div>
          {pickupCode && (
            <div className="text-lg font-mono text-green-600 dark:text-green-400 mt-2">
              Pickup Code: {pickupCode}
            </div>
          )}
          {isChecked && !pickupCode && (
            <div className="text-sm text-green-600 dark:text-green-400 mt-2 font-semibold">
              ✓ Checked in {isAlreadyChecked && '(earlier)'}
            </div>
          )}
        </div>
        <button
          onClick={handleToggleCheckIn}
          disabled={loading || !isEnabled || isAlreadyChecked}
          className={`btn-kiosk ${
            !isEnabled 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : isAlreadyChecked
              ? 'bg-green-500 text-white cursor-not-allowed hover:bg-green-500'
              : isChecked 
              ? 'bg-green-600 text-white hover:bg-red-600' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {!isEnabled ? 'No Active Event' : isAlreadyChecked ? '✓ Already Checked In' : isChecked ? '✓ Checked In' : 'Check In'}
        </button>
      </div>
    </div>
  );
}
