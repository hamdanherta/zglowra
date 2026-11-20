import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string | number; label: string }[];
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  children,
  className,
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          id={selectId}
          ref={ref}
          className={twMerge(
            clsx(
              'w-full min-h-[52px] bg-brand-soft text-brand-text-body appearance-none',
              'rounded-input px-5 pr-10 text-base transition-all duration-150',
              'focus:bg-white focus:shadow-focus-coral outline-none border-none cursor-pointer',
              error && 'shadow-[0_0_0_2px_#E5736B]',
              className
            )
          )}
          {...props}
        >
          {options ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )) : children}
        </select>
        <ChevronDown className="absolute right-4 w-5 h-5 text-brand-text-body/60 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;

