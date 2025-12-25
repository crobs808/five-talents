'use client';

interface ActionButtonsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onCustom?: { label: string; onClick: () => void; color?: 'blue' | 'green' | 'red' };
  variant?: 'compact' | 'normal';
}

const colorClasses = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  red: 'bg-red-600 hover:bg-red-700',
};

export function ActionButtons({
  onEdit,
  onDelete,
  onCustom,
  variant = 'normal',
}: ActionButtonsProps) {
  const sizeClasses = variant === 'compact' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm';

  return (
    <div className="flex gap-2">
      {onEdit && (
        <button
          onClick={onEdit}
          className={`${sizeClasses} bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700`}
        >
          Edit
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className={`${sizeClasses} bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700`}
        >
          Delete
        </button>
      )}
      {onCustom && (
        <button
          onClick={onCustom.onClick}
          className={`${sizeClasses} text-white rounded-lg font-semibold ${
            colorClasses[onCustom.color || 'blue']
          }`}
        >
          {onCustom.label}
        </button>
      )}
    </div>
  );
}
