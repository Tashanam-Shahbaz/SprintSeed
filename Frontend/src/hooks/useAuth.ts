import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '../state/store';
import { loginUser, logoutUser, checkAuthStatus, clearError } from '../state/slices/LoginSlice';
import { LoginCredentials} from '../types/Login';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);

  const login = useCallback(async (credentials: LoginCredentials) => {
    return dispatch(loginUser(credentials)).unwrap();
  }, [dispatch]);

  const logout = useCallback(async () => {
    return dispatch(logoutUser()).unwrap();
  }, [dispatch]);

  const checkAuth = useCallback(async () => {
    return dispatch(checkAuthStatus()).unwrap();
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    ...auth,
    login,
    logout,
    checkAuth,
    clearAuthError,
  };
};
