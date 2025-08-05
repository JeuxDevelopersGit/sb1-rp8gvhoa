import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const statusColors = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-800',
  done: 'bg-green-100 text-green-800',
};

export const statusEmojis = {
  not_started: '⚪',
  in_progress: '🟡',
  blocked: '🔴',
  done: '🟢',
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};