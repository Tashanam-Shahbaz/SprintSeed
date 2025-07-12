import React from 'react';
import { cn } from '../../lib/utils';

const Layout = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {children}
    </div>
  );
};

const LayoutContent = ({ children, className }) => (
  <div className={cn("flex h-screen", className)}>
    {children}
  </div>
);

const MainContent = ({ children, className }) => (
  <main className={cn("flex-1 flex flex-col overflow-hidden", className)}>
    {children}
  </main>
);

export { Layout, LayoutContent, MainContent };

