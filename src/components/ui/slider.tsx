'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  leftLabel?: string;
  rightLabel?: string;
  value: number;
  onChange: (value: number) => void;
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, leftLabel, rightLabel, value, onChange, min = 1, max = 10, id, ...props }, ref) => {
    const sliderId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={sliderId}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <div className="flex items-center gap-3">
          {leftLabel && (
            <span className="text-sm text-gray-500 min-w-[80px] text-right">
              {leftLabel}
            </span>
          )}
          <input
            ref={ref}
            type="range"
            id={sliderId}
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className={cn(
              'flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer',
              'accent-indigo-600',
              'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
              className
            )}
            {...props}
          />
          {rightLabel && (
            <span className="text-sm text-gray-500 min-w-[80px]">
              {rightLabel}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export { Slider };
