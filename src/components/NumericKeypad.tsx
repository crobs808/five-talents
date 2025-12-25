'use client';

import React, { useState } from 'react';

interface NumericKeypadProps {
  value: string;
  maxLength?: number;
  onSubmit: (value: string) => void;
  onClear: () => void;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function NumericKeypad({
  value,
  maxLength = 4,
  onSubmit,
  onClear,
  onChange,
  disabled = false,
}: NumericKeypadProps) {
  const handleDigit = (digit: string) => {
    if (disabled) return;
    if (value.length < maxLength) {
      onChange(value + digit);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onClear();
  };

  const handleSubmit = () => {
    if (disabled || value.length !== maxLength) return;
    onSubmit(value);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Display */}
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
        <div className="text-5xl font-bold tracking-widest text-gray-900 dark:text-gray-100 font-mono">
          {value.padEnd(maxLength, '_')}
        </div>
      </div>

      {/* Keypad */}
      <div className="keypad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit.toString())}
            disabled={disabled}
            className="keypad-btn"
          >
            {digit}
          </button>
        ))}
      </div>

      {/* Control buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleDelete}
          disabled={disabled || value.length === 0}
          className="btn-kiosk-secondary col-span-1"
        >
          ← Delete
        </button>
        <button
          onClick={() => handleDigit('0')}
          disabled={disabled}
          className="keypad-btn col-span-1"
        >
          0
        </button>
        <button
          onClick={handleClear}
          disabled={disabled || value.length === 0}
          className="btn-kiosk-danger col-span-1"
        >
          Clear
        </button>
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || value.length !== maxLength}
        className="btn-kiosk-success w-full text-2xl"
      >
        Enter
      </button>
    </div>
  );
}
