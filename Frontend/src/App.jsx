import React, { useState } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import EmailModal from './components/email/EmailModal';

function App() {
  const [user, setUser] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleLogin = (credentials) => {
    // In a real app, you would validate credentials with your API
    setUser({
      username: credentials.username,
      // Add other user data as needed
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
    console.log('Sending email:', emailData);
    
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

