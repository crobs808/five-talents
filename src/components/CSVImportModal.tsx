'use client';

import { useState } from 'react';

interface DetectedFamily {
  familyName: string;
  primaryPhoneE164: string;
  adults: Array<{
    firstName: string;
    lastName: string;
    position?: string;
  }>;
  youth: Array<{
    firstName: string;
    lastName: string;
    levelGroup?: string;
  }>;
}

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (families: DetectedFamily[]) => void;
  isImporting: boolean;
}

export function CSVImportModal({
  isOpen,
  onClose,
  onImport,
  isImporting,
}: CSVImportModalProps) {
  const [detectedFamilies, setDetectedFamilies] = useState<DetectedFamily[]>([]);
  const [selectedFamilies, setSelectedFamilies] = useState<Set<number>>(new Set());
  const [step, setStep] = useState<'upload' | 'review'>('upload');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.trim().split('\n');

      if (lines.length < 2) {
        alert('CSV file must have at least a header row and one data row');
        return;
      }

      // Parse CSV - expect: lastName, firstName, role, phone, level
      // role: ADULT or YOUTH
      // phone: Required for ADULT, optional for YOUTH
      // level: For youth (Navigators, Adventurer, etc); for adults (position like "Adult", "Leader")
      const families: DetectedFamily[] = [];
      const familyMap = new Map<string, { data: DetectedFamily; phones: (string | undefined)[] }>();
      let rowIndex = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));

        if (values.length < 4) continue;

        const [lastName, firstName, role, phone, level] = values;

        if (!firstName || !lastName || !role) continue;

        // Validate: Adults must have phone number
        if (role.toUpperCase() === 'ADULT' && (!phone || phone.trim() === '')) {
          errors.push(`Row ${i}: Adult "${firstName} ${lastName}" requires a phone number`);
          continue;
        }

        const familyName = lastName;
        rowIndex++;

        // Group by family name first, then assign phones
        if (!familyMap.has(familyName)) {
          familyMap.set(familyName, {
            data: {
              familyName,
              primaryPhoneE164: phone || `temp-${rowIndex}`, // Placeholder for youth-only families
              adults: [],
              youth: [],
            },
            phones: [],
          });
        }

        const family = familyMap.get(familyName)!;
        family.phones.push(phone || undefined);

        if (role.toUpperCase() === 'ADULT') {
          family.data.adults.push({
            firstName,
            lastName,
            position: level || undefined,
          });
        } else if (role.toUpperCase() === 'YOUTH') {
          family.data.youth.push({
            firstName,
            lastName,
            levelGroup: level || undefined,
          });
        }
      }

      // Report any validation errors
      if (errors.length > 0) {
        alert(`CSV Validation Errors:\n\n${errors.join('\n')}`);
        event.target.value = '';
        return;
      }

      // Assign primary phone: use first non-empty phone, or if all empty, use generated one
      const familiesArray = Array.from(familyMap.values()).map(({ data, phones }) => {
        const primaryPhone = phones.find((p) => p && p.trim()) || data.primaryPhoneE164;
        return {
          ...data,
          primaryPhoneE164: primaryPhone,
        };
      });

      // Check for duplicates via API (only check actual phone numbers, not temp placeholders)
      const realPhones = familiesArray
        .map((f) => f.primaryPhoneE164)
        .filter((p) => !p.startsWith('temp-'));
      
      let existingPhones: string[] = [];
      if (realPhones.length > 0) {
        const response = await fetch('/api/families/check-duplicates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: 'default-org',
            phones: realPhones,
          }),
        });
        const data = await response.json();
        existingPhones = data.existingPhones || [];
      }

      // Filter out duplicates, but keep families with temp phones (they're always new)
      const newFamilies = familiesArray.filter(
        (f) => f.primaryPhoneE164.startsWith('temp-') || !existingPhones.includes(f.primaryPhoneE164)
      );

      if (newFamilies.length === 0) {
        alert('No new families found in this CSV. All families already exist.');
        event.target.value = '';
        return;
      }

      setDetectedFamilies(newFamilies);
      setSelectedFamilies(new Set(newFamilies.map((_, i) => i)));
      setStep('review');
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format.');
    }
  };

  const handleToggleFamily = (index: number) => {
    const newSelected = new Set(selectedFamilies);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedFamilies(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFamilies.size === detectedFamilies.length) {
      setSelectedFamilies(new Set());
    } else {
      setSelectedFamilies(new Set(detectedFamilies.map((_, i) => i)));
    }
  };

  const handleImport = () => {
    const familiesToImport = detectedFamilies.filter((_, i) => selectedFamilies.has(i));
    onImport(familiesToImport);
    setStep('upload');
    setDetectedFamilies([]);
    setSelectedFamilies(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Import Families from CSV</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            <strong>CSV Format:</strong> lastName, firstName, role, phone, level
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            <strong>role:</strong> ADULT or YOUTH<br />
            <strong>phone:</strong> Required for ADULT, optional for YOUTH<br />
            <strong>level:</strong> For youth: Navigators, Adventurers, Explorers, etc. For adults: position/title
          </p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            <strong>Examples:</strong><br />
            Roberts, Connor, Adult, 2143405244, Adult<br />
            Roberts, Kevin, Youth, 2148884344, Adventurer<br />
            Roberts, Owen, Youth, , Navigator
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {step === 'upload' ? (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Upload a CSV file with the following columns:
              </p>
              <div className="bg-gray-100 dark:bg-gray-900 rounded p-4 text-sm font-mono text-gray-700 dark:text-gray-300">
                lastName, firstName, role, phone, level
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                    Click to upload CSV file
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {detectedFamilies.length} New Family(ies) Detected
                </h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {selectedFamilies.size === detectedFamilies.length ? 'Uncheck All' : 'Check All'}
                </button>
              </div>

              <div className="space-y-3">
                {detectedFamilies.map((family, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        checked={selectedFamilies.has(index)}
                        onChange={() => handleToggleFamily(index)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {family.familyName}
                        </h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {family.primaryPhoneE164}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {family.adults.length > 0 && (
                            <>
                              <div className="font-semibold">Adults:</div>
                              {family.adults.map((a, idx) => (
                                <div key={idx} className="ml-2">
                                  {a.firstName} {a.lastName}
                                  {a.position && ` (${a.position})`}
                                </div>
                              ))}
                            </>
                          )}
                          {family.youth.length > 0 && (
                            <>
                              <div className="font-semibold mt-1">Youth:</div>
                              {family.youth.map((y, idx) => (
                                <div key={idx} className="ml-2">
                                  {y.firstName} {y.lastName}
                                  {y.levelGroup && ` (${y.levelGroup})`}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              setStep('upload');
              setDetectedFamilies([]);
              setSelectedFamilies(new Set());
            }}
            disabled={isImporting}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          {step === 'review' && (
            <button
              onClick={handleImport}
              disabled={isImporting || selectedFamilies.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : `Import (${selectedFamilies.size})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
