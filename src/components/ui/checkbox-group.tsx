'use client';

import { cn } from '@/lib/utils';

export interface CheckboxGroupProps {
  label?: string;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  columns?: 2 | 3 | 4;
}

export function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
  error,
  columns = 2,
}: CheckboxGroupProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div
        className={cn('grid gap-2', {
          'grid-cols-2': columns === 2,
          'grid-cols-3': columns === 3,
          'grid-cols-4': columns === 4,
        })}
        role="group"
        aria-label={label}
      >
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              'flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
              selected.includes(option)
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => toggleOption(option)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
