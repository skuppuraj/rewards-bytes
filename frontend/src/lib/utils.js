import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getDaysRemaining(endDate) {
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return diff;
}

export function getStatusColor(status) {
  const map = {
    active: 'bg-green-100 text-green-700 border-green-200',
    redeemed: 'bg-blue-100 text-blue-700 border-blue-200',
    expired: 'bg-red-100 text-red-700 border-red-200',
    deleted: 'bg-gray-100 text-gray-700 border-gray-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
    abandoned: 'bg-orange-100 text-orange-700 border-orange-200',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}
