import React from 'react';
import LoginForm from '../components/auth/LoginForm';

const LoginPage = ({ onLogin }) => {
  const handleLogin = (credentials) => {
    // Here you would typically validate credentials with your API
    console.log('Login attempt:', credentials);
    
    // For demo purposes, accept any non-empty credentials
    if (credentials.username && credentials.password) {
      onLogin(credentials);
    } else {
      alert('Please enter both username and password');
    }
  };

  return <LoginForm onLogin={handleLogin} />;
};

export default LoginPage;

