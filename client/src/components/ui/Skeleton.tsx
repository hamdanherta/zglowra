import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx('animate-pulse bg-brand-soft/80 rounded-2xl', className)
      )}
      {...props}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-card shadow-card p-5 sm:p-6 flex flex-col gap-4">
      <Skeleton className="w-full aspect-square rounded-card-img" />
      <Skeleton className="w-1/3 h-4 rounded-full" />
      <Skeleton className="w-4/5 h-6 rounded-lg" />
      <div className="flex justify-between items-center mt-2">
        <Skeleton className="w-1/2 h-7 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </div>
  );
};

export default Skeleton;

