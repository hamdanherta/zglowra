import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  padded = true,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white rounded-card shadow-card overflow-hidden',
          padded && 'p-6 sm:p-8',
          hoverable && 'transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover cursor-pointer',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

