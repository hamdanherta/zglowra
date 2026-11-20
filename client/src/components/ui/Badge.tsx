import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'gold' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
}) => {
  const variantStyles = {
    primary: 'bg-brand-coral-soft text-brand-text font-semibold',
    gold: 'bg-brand-gold-soft text-[#8C6D1F] font-semibold',
    success: 'bg-[#E6F4EA] text-[#137333] font-semibold',
    warning: 'bg-[#FEF7E0] text-[#B06000] font-semibold',
    danger: 'bg-[#FCE8E6] text-[#C5221F] font-semibold',
    neutral: 'bg-brand-soft text-brand-text-body font-medium',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-xs px-3.5 py-1',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full select-none tracking-wide',
          variantStyles[variant],
          sizeStyles[size],
          className
        )
      )}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  let variant: 'primary' | 'gold' | 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';

  switch (status) {
    case 'Menunggu Pembayaran':
    case 'Dibuat':
      variant = 'warning';
      break;
    case 'Menunggu Verifikasi':
    case 'Dikonfirmasi Supplier':
      variant = 'gold';
      break;
    case 'Diproses':
      variant = 'primary';
      break;
    case 'Dikirim':
      variant = 'primary';
      break;
    case 'Selesai':
    case 'Diterima':
      variant = 'success';
      break;
    case 'Dibatalkan':
    case 'Pembayaran Ditolak':
    case 'Ditolak':
      variant = 'danger';
      break;
    default:
      variant = 'neutral';
  }

  return (
    <Badge variant={variant} className={className}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status}
    </Badge>
  );
};

export default Badge;

