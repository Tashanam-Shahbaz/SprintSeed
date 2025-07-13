import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

const Modal = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0" 
        onClick={onClose}
      />
      <div className={cn(
        "modal-content relative bg-background rounded-2xl shadow-strong max-w-md w-full max-h-[90vh] overflow-auto",
        className
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        {children}
      </div>
    </div>
  );
};

const ModalHeader = ({ children, className }) => (
  <div className={cn("p-6 pb-4", className)}>
    {children}
  </div>
);

const ModalTitle = ({ children, className }) => (
  <h2 className={cn("text-lg font-semibold text-foreground", className)}>
    {children}
  </h2>
);

const ModalContent = ({ children, className }) => (
  <div className={cn("px-6 pb-6", className)}>
    {children}
  </div>
);

const ModalFooter = ({ children, className }) => (
  <div className={cn("flex justify-end gap-3 p-6 pt-4 border-t border-border", className)}>
    {children}
  </div>
);

export { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter };

