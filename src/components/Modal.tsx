'use client';

import React, { useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  onCloseAttempt?: () => boolean; // Returns true if close is allowed
}

const widthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '2xl',
  onCloseAttempt,
}: ModalProps) {
  const [isShaking, setIsShaking] = useState(false);

  const handleCloseClick = () => {
    if (onCloseAttempt) {
      const isAllowed = onCloseAttempt();
      if (!isAllowed) {
        // Shake animation
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        return;
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .modal-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${widthClasses[maxWidth]} w-full max-h-[90vh] overflow-y-auto ${isShaking ? 'modal-shake' : ''}`}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={handleCloseClick}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
