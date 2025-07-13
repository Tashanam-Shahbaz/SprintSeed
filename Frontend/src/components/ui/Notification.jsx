import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const Notification = ({ 
  message, 
  type = 'info', 
  onClose,
  className,
  showIcon = true,
  showCloseButton = true
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg border",
      getStyles(),
      className
    )}>
      {showIcon && (
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
      )}
      <div className="flex-1 text-sm font-medium">
        {message}
      </div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Notification;



