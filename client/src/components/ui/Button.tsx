import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'soft' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full select-none transition-all duration-150 focus:outline-none focus:shadow-focus-coral disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'min-h-[40px] px-5 py-2 text-sm gap-2',
    md: 'min-h-[48px] px-8 py-3.5 text-base gap-2.5',
    lg: 'min-h-[54px] px-10 py-4 text-lg gap-3',
  };

  const variantStyles = {
    primary: 'bg-brand-text text-white shadow-button hover:opacity-95',
    secondary: 'bg-brand-coral-soft text-brand-text hover:bg-[#fedbd7]',
    soft: 'bg-brand-soft text-brand-text-body hover:bg-brand-coral-soft',
    gold: 'bg-brand-gold text-white shadow-button hover:opacity-95',
    danger: 'bg-danger text-white shadow-sm hover:opacity-95',
  };

  return (
    <button
      className={twMerge(
        clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;

