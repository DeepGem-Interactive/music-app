'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownProps {
  deadline: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onExpire?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calculateTimeLeft(deadline: string): TimeLeft {
  const now = new Date().getTime();
  const deadlineTime = new Date(deadline).getTime();
  const difference = deadlineTime - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    expired: false,
  };
}

export function Countdown({ deadline, size = 'md', showLabel = true, onExpire }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(deadline));

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(deadline);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.expired && onExpire) {
        onExpire();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  if (timeLeft.expired) {
    return (
      <div
        className={cn('text-red-600 font-medium', {
          'text-sm': size === 'sm',
          'text-lg': size === 'md',
          'text-2xl': size === 'lg',
        })}
        role="timer"
        aria-live="polite"
      >
        Deadline passed
      </div>
    );
  }

  const blocks = [
    { value: timeLeft.days, label: 'days' },
    { value: timeLeft.hours, label: 'hrs' },
    { value: timeLeft.minutes, label: 'min' },
    { value: timeLeft.seconds, label: 'sec' },
  ];

  // Only show days if > 0, otherwise start with hours
  const visibleBlocks = timeLeft.days > 0 ? blocks : blocks.slice(1);

  return (
    <div
      className="flex items-center gap-2"
      role="timer"
      aria-live="polite"
      aria-label={`${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes, ${timeLeft.seconds} seconds remaining`}
    >
      {visibleBlocks.map((block, index) => (
        <div key={block.label} className="flex items-center gap-2">
          <div
            className={cn(
              'bg-gray-100 rounded-lg text-center',
              {
                'px-2 py-1 min-w-[40px]': size === 'sm',
                'px-3 py-2 min-w-[56px]': size === 'md',
                'px-4 py-3 min-w-[72px]': size === 'lg',
              }
            )}
          >
            <div
              className={cn('font-bold text-gray-900 tabular-nums', {
                'text-lg': size === 'sm',
                'text-2xl': size === 'md',
                'text-4xl': size === 'lg',
              })}
            >
              {block.value.toString().padStart(2, '0')}
            </div>
            {showLabel && (
              <div
                className={cn('text-gray-500 uppercase', {
                  'text-[10px]': size === 'sm',
                  'text-xs': size === 'md',
                  'text-sm': size === 'lg',
                })}
              >
                {block.label}
              </div>
            )}
          </div>
          {index < visibleBlocks.length - 1 && (
            <span
              className={cn('text-gray-400 font-bold', {
                'text-lg': size === 'sm',
                'text-2xl': size === 'md',
                'text-4xl': size === 'lg',
              })}
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
