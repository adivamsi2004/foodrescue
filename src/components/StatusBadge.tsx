import React from 'react';
import { DonationStatus } from '../types';

interface StatusBadgeProps {
  status: DonationStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStyles = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'CLAIM_REQUESTED':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'CLAIMED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'PICKUP_SCHEDULED':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'PICKED_UP':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'DELIVERED':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold';
      case 'EXPIRED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getLabel = () => {
    return status.replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStyles()} ${className}`}>
      {getLabel()}
    </span>
  );
};
