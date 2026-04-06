import React from 'react';

type StatusBadgeProps = {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
};

const VARIANTS = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-uph-blue/10 text-uph-blue',
  neutral: 'bg-gray-100 text-gray-700',
};

export function StatusBadge({ status, variant = 'neutral' }: StatusBadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${VARIANTS[variant]}`}>
      {status}
    </span>
  );
}
