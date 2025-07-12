import React from 'react';
import { cn } from '../../lib/utils';

const Header = ({ children, className }) => {
  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container flex h-16 items-center justify-between px-6">
        {children}
      </div>
    </header>
  );
};

const HeaderLogo = ({ children, className }) => (
  <div className={cn("sprintseed-logo", className)}>
    {children}
  </div>
);

const HeaderContent = ({ children, className }) => (
  <div className={cn("flex items-center gap-4", className)}>
    {children}
  </div>
);

export { Header, HeaderLogo, HeaderContent };

