import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthInitializerProps {
  children: React.ReactNode;
}

const AuthInitializer: React.FC<AuthInitializerProps> = ({ children }) => {
  const { checkAuth, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only check auth if not already authenticated
    if (!isAuthenticated) {
      checkAuth().catch(() => {
        // Silently fail if no valid auth data
      });
    }
  }, [checkAuth, isAuthenticated]);

  return <>{children}</>;
};

export default AuthInitializer;
