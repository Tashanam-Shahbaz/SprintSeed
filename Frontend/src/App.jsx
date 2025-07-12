import React, { useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import EmailModal from "./components/email/EmailModal";

function App() {
  const [user, setUser] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleLogin = (userData) => {
    if (!userData) return;

    setUser({
      user_id: userData.user_id,
      username: userData.username,
      email: userData.email,
      role_id: userData.role_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleSendEmail = () => {
    setIsEmailModalOpen(true);
  };

  const handleEmailSend = async (emailData) => {
    // In a real app, you would send this to your API
    console.log("Sending email:", emailData);

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        alert(`Email sent successfully to ${emailData.recipient}!`);
        resolve();
      }, 1000);
    });
  };

  const handleEmailModalClose = () => {
    setIsEmailModalOpen(false);
  };

  return (
    <div className="App">
      {!user ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <>
          <ChatPage
            user={user}
            onLogout={handleLogout}
            onSendEmail={handleSendEmail}
          />
          <EmailModal
            isOpen={isEmailModalOpen}
            onClose={handleEmailModalClose}
            onSend={handleEmailSend}
          />
        </>
      )}
    </div>
  );
}

export default App;
