import React, { useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import EmailModal from "./components/email/EmailModal";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [activeChatData, setActiveChatData] = useState(null);

  const handleLogin = (userData) => {
    if (!userData) return;

    const newUser = {
      user_id: userData.user_id,
      username: userData.username,
      email: userData.email,
      role_id: userData.role_id,
      first_name: userData.first_name,
      last_name: userData.last_name,
    };

    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const handleSendEmail = (chatData) => {
    setActiveChatData(chatData);
    setIsEmailModalOpen(true);
  };

  const handleEmailSend = async (emailData) => {
    // In a real app, you would send this to your API
    console.log("Sending email:", emailData);

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        toast.success(`Email sent successfully to ${emailData.recipient}!`);
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
            projectId={activeChatData?.projectId}
            conversationId={activeChatData?.conversationId}
            selectedModel={activeChatData?.model}
          />
        </>
      )}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;
