import React from 'react';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  align = 'center',
  className = '',
}) => {
  const alignClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <div className={`flex flex-col ${alignClass[align]} mb-8 sm:mb-12 ${className}`}>
      <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-text tracking-tight">
        {title}
      </h2>
      {/* Decorative gold touch as per Section 3.3 */}
      <div className="w-12 h-1 bg-brand-gold rounded-full mt-3 mb-3" />
      {subtitle && (
        <p className="text-base sm:text-lg text-brand-text-body max-w-2xl font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionTitle;

