'use client';

import { AlertTriangle } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorAlert({ message, className = '', onRetry, retryLabel = 'Try again' }: ErrorAlertProps) {
  return (
    <div className={`p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm ${className}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p>{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 text-red-800 underline hover:no-underline font-medium"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
