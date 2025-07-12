import React, { useState, useEffect } from 'react'
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearAuthError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by Redux state
      console.error('Login failed:', err);
    }
  };

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Redirecting...</div>
      </div>
    );
  }

  const handleSignUp = () => {
    navigate('/signup'); // Assuming you have a signup route
  };

  return (
    <div className="login-container flex flex-col items-center">
      <div className="login-nav mb-8">
        <img src="/logo.png" alt="Logo" className="login-nav-img h-16" />
      </div>
      <br />
      <br />
      <br />
      <form
        onSubmit={handleSubmit}
        className="space-y-6 w-full max-w-sm flex flex-col bg-white rounded-lg p-6 justify-center"
      >
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="input-container">
          <Label htmlFor="email" className='input-label'>Email</Label>
          <Input
            id="email"
            type="email"
            className='input-feilds'
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-container">
          <Label htmlFor="password" className='input-label'>Password</Label>
          <Input
            id="password"
            type="password"
            className='input-feilds'
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-center w-full">
          <button
            type="submit"
            disabled={isLoading}
            className="login-btn w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </form>
      <div>
        <p className="mt-4 text-sm text-gray-600">
          Not registered yet? <span onClick={handleSignUp} className="hover:underline">Sign up here</span>
        </p>
      </div>
    </div>
  );
}

export default Login