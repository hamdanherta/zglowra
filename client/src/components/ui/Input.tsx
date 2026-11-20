import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  icon,
  className,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-4 text-brand-text-body pointer-events-none opacity-60">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full min-h-[52px] bg-brand-soft text-brand-text-body placeholder:text-brand-text-body/40',
              'rounded-input px-5 text-base transition-all duration-150',
              'focus:bg-white focus:shadow-focus-coral outline-none border-none',
              icon && 'pl-12',
              error && 'shadow-[0_0_0_2px_#E5736B]',
              className
            )
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1.5 text-xs text-brand-text-body/70">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;

