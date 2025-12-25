'use client';

import { useState } from 'react';

interface DeleteFamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  familyName: string;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
}

export function DeleteFamilyModal({
  isOpen,
  onClose,
  familyName,
  onConfirm,
  isLoading,
}: DeleteFamilyModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      setError('You must type "delete" to confirm');
      return;
    }

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete family');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Delete Family</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete <strong>{familyName}</strong>?
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will remove the family and all members from the system. However, all historical attendance records will be preserved.
          </p>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">delete</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              placeholder='Type "delete"'
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-900 dark:text-gray-100"
              autoFocus
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || confirmText.toLowerCase() !== 'delete'}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Deleting...' : 'Delete Family'}
          </button>
        </div>
      </div>
    </div>
  );
}
