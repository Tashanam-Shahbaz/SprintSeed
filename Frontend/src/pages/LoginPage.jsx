import React from "react";
import LoginForm from "../components/auth/LoginForm";

const LoginPage = ({ onLogin }) => {
  const handleLogin = async (credentials) => {
    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user);
        return { success: true };
      } else {
        return {
          success: false,
          message: data?.detail || "Invalid credentials",
        };
      }
    } catch (error) {
      console.error(error)
      return { success: false, message: "Network error. Please try again." };
    }
  }

  return <LoginForm onLogin={handleLogin} />;
};

export default LoginPage;
