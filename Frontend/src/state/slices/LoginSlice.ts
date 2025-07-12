import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../utils/api';
import {User , LoginCredentials} from '../../types/Login';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken'),
  isLoading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('authToken'),
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/login', credentials);
      const { user } = response.data;
      
      // Since backend doesn't return a token, we'll create a simple session token
      const sessionToken = `session_${user.user_id}_${Date.now()}`;
      
      // Store token and user in localStorage
      localStorage.setItem('authToken', sessionToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token: sessionToken, user };
    } catch (error) {
      const apiError = error as ApiError;
      const message = apiError.response?.data?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Optional: Call logout endpoint if available
      // await api.post('/logout');
      
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return null;
    } catch {
      return rejectWithValue('Logout failed');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        return rejectWithValue('No auth data found');
      }
      
      const user = JSON.parse(userStr);
      
      // Optional: Verify token with backend
      // const response = await api.get('/verify-token');
      
      return { token, user };
    } catch {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      return rejectWithValue('Auth verification failed');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = null;
      state.isAuthenticated = false;
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<{ token: string; user: User }>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
        state.error = action.payload as string;
      })
      
    // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      
    // Check auth status
      .addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<{ token: string; user: User }>) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });
  },
});

export const { clearError, resetAuthState } = authSlice.actions;
export default authSlice.reducer;