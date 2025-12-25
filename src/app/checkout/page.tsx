'use client';

import { useState } from 'react';
import { NumericKeypad } from '@/components/NumericKeypad';
import { QRCodeComponent } from '@/components/QRCode';

export default function CheckOutPage() {
  const [screen, setScreen] = useState<'pin' | 'code-entry' | 'confirm'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [pickupData, setPickupData] = useState<any>(null);

  const handlePinSubmit = (pin: string) => {
    // In production, verify PIN against hashed staff PIN
    if (pin === '5555') {
      // Demo PIN
      setScreen('code-entry');
      setPinInput('');
    } else {
      setError('Invalid PIN');
    }
  };

  const handleCodeSubmit = async (code: string) => {
    setError('');
    try {
      const response = await fetch(`/api/checkout?code=${code}&eventId=default-event`);
      const data = await response.json();

      if (response.ok) {
        setPickupData(data);
        setScreen('confirm');
      } else {
        setError(data.error || 'Code not found or already redeemed');
      }
    } catch {
      setError('Error looking up code');
    }
  };

  const handleRedeemCode = async () => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'default-org',
          pickupCodeId: pickupData.id,
        }),
      });

      if (response.ok) {
        setVerified(true);
        setError('');
      } else {
        const err = await response.json();
        setError(err.error || 'Error redeeming code');
      }
    } catch {
      setError('Error processing checkout');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-gray-50 dark:from-gray-900 dark:to-gray-950 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {screen === 'pin' && (
          <div>
            <h1 className="text-4xl font-bold text-center mb-2 text-gray-900 dark:text-gray-100">
              Pickup Verification
            </h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 text-lg">
                Staff PIN Required
              </p>
              <NumericKeypad
                value={pinInput}
                maxLength={4}
                onSubmit={handlePinSubmit}
                onClear={() => setPinInput('')}
                onChange={setPinInput}
              />
              {error && (
                <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg text-center font-medium">
                  {error}
                </div>
              )}
              <p className="text-center text-gray-500 text-sm mt-8">
                Demo PIN: 5555
              </p>
            </div>
          )}

          {screen === 'code-entry' && (
            <div>
              <h2 className="text-3xl font-bold text-center mb-2">Enter Pickup Code</h2>
              <p className="text-center text-gray-600 mb-12">
                Type or scan the code on the parent pickup tag
              </p>
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="ABC"
                className="w-full text-3xl p-6 text-center border-2 border-gray-300 rounded-lg font-mono mb-6 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleCodeSubmit(codeInput)}
                disabled={codeInput.length === 0}
                className="w-full btn-kiosk-success text-2xl mb-3"
              >
                Verify Code
              </button>
              <button
                onClick={() => {
                  setScreen('pin');
                  setCodeInput('');
                  setError('');
                }}
                className="w-full py-3 bg-gray-300 text-gray-900 rounded-lg font-semibold"
              >
                Back
              </button>
              {error && (
                <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-lg text-center">
                  {error}
                </div>
              )}
            </div>
          )}

          {screen === 'confirm' && !verified && pickupData && (
            <div>
              <h2 className="text-3xl font-bold text-center mb-8">Confirm Pickup</h2>
              <div className="bg-white border-2 border-gray-300 rounded-lg p-8 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    {pickupData.youthPerson.firstName}{' '}
                    {pickupData.youthPerson.lastName}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mb-6">
                    Code: {pickupData.code}
                  </div>
                  <div className="flex justify-center mb-6">
                    <QRCodeComponent value={pickupData.code} size={150} />
                  </div>
                </div>
              </div>
              <button
                onClick={handleRedeemCode}
                className="w-full btn-kiosk-success text-xl mb-3"
              >
                Confirm Pickup
              </button>
              <button
                onClick={() => {
                  setScreen('code-entry');
                  setCodeInput('');
                  setPickupData(null);
                  setError('');
                }}
                className="w-full py-3 bg-gray-300 text-gray-900 rounded-lg font-semibold"
              >
                Back
              </button>
            </div>
          )}

          {verified && (
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-3xl font-bold text-green-600 dark:text-green-400 mb-4">
                Pickup Verified
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xl mb-8">
                {pickupData.youthPerson.firstName} has been checked out.
              </p>
              <button
                onClick={() => {
                  setScreen('code-entry');
                  setCodeInput('');
                  setPickupData(null);
                  setVerified(false);
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
