import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

const Sidebar = ({ children, className }) => {
  return (
    <aside className={cn(
      "w-64 h-full bg-muted/30 border-r border-border flex flex-col",
      className
    )}>
      {children}
    </aside>
  );
};

const SidebarHeader = ({ onNewChat, className }) => (
  <div className={cn("p-4 border-b border-border", className)}>
    <Button 
      onClick={onNewChat}
      className="w-full justify-start gap-2"
      variant="outline"
    >
      <Plus className="h-4 w-4" />
      New Chat
    </Button>
  </div>
);

const SidebarContent = ({ children, className }) => (
  <div className={cn("flex-1 overflow-y-auto p-4", className)}>
    {children}
  </div>
);

const SidebarItem = ({ 
  children, 
  isActive = false, 
  onClick, 
  className 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "sidebar-item w-full text-left p-3 mb-2 text-sm font-medium",
      isActive ? "active" : "text-muted-foreground hover:text-foreground",
      className
    )}
  >
    {children}
  </button>
);

export { Sidebar, SidebarHeader, SidebarContent, SidebarItem };

