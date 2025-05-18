'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

interface ProgressProps {
  value: number;
  className?: string;
}

const Progress = ({ value, className = '' }: ProgressProps) => {
  return (
    <ProgressPrimitive.Root
      className={`relative h-3 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="h-full bg-green-500 transition-transform"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
};

export { Progress };
