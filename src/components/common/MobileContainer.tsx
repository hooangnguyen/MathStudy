import React from 'react';
import { cn } from '../../utils/utils';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children, className }) => {
  return (
    <div className="min-h-[100dvh] bg-white md:bg-[#f7f7f7] flex justify-center w-full">
      <div 
        className={cn(
          "w-full h-[100dvh] bg-white relative overflow-hidden flex flex-col",
          className
        )}
      >
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
