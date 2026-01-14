import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCountdown(deadline: string): string {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Deadline passed';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h remaining`;
  }

  return `${hours}h ${minutes}m remaining`;
}

export function getToneDescription(
  heartfeltFunny: number,
  intimateAnthem: number,
  minimalLyrical: number
): string {
  const parts: string[] = [];

  if (heartfeltFunny <= 3) parts.push('heartfelt');
  else if (heartfeltFunny >= 7) parts.push('playful');

  if (intimateAnthem <= 3) parts.push('intimate');
  else if (intimateAnthem >= 7) parts.push('anthemic');

  if (minimalLyrical <= 3) parts.push('minimal');
  else if (minimalLyrical >= 7) parts.push('lyrical');

  if (parts.length === 0) return 'balanced';
  return parts.join(', ');
}

export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function getDeadlineFromHours(hours: number): string {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline.toISOString();
}

export function isDeadlinePassed(deadline: string): boolean {
  return new Date(deadline) < new Date();
}

export function getHoursUntilDeadline(deadline: string): number {
  const diffMs = new Date(deadline).getTime() - new Date().getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
}
