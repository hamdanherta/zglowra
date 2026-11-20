import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  className,
  id,
  rows = 4,
  ...props
}, ref) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold uppercase tracking-wider text-brand-text-body mb-2">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        rows={rows}
        className={twMerge(
          clsx(
            'w-full bg-brand-soft text-brand-text-body placeholder:text-brand-text-body/40',
            'rounded-input p-4 text-base transition-all duration-150 resize-y',
            'focus:bg-white focus:shadow-focus-coral outline-none border-none',
            error && 'shadow-[0_0_0_2px_#E5736B]',
            className
          )
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;

