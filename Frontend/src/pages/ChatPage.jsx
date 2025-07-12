import React, { useState } from 'react';
import { Layout, LayoutContent, MainContent } from '../components/layout/Layout';
import { Header, HeaderLogo, HeaderContent } from '../components/layout/Header';
import { Sidebar, SidebarHeader, SidebarContent, SidebarItem } from '../components/layout/Sidebar';
import ChatArea from '../components/chat/ChatArea';
import ChatInput from '../components/chat/ChatInput';

const ChatPage = ({ user, onLogout, onSendEmail }) => {
  const [chats, setChats] = useState([
    { id: 1, title: 'Chat 1', isActive: true },
    { id: 2, title: 'Chat 2', isActive: false },
    { id: 3, title: 'Chat 3', isActive: false },
  ]);

  const [messages, setMessages] = useState([
    {
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam diam arcu, dignissim sed sapien in, sagittis pellentesque risus. Cras augue mauris, tempus pretium placerat non, finibus luctus tortor. Phasellus laoreet sodales odio, eu fringilla elit placerat sit amet. Praesent elementum risus nunc, id bibendum orci molestie ac. Nunc eleifend quam ac ex pharetr",
      isUser: false,
      timestamp: "10:30 AM",
      document: {
        id: "srs-001",
        description: "Software Requirements Specification for Project Management System"
      }
    },
    {
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam diam arcu, dignissim sed sa",
      isUser: false,
      timestamp: "10:32 AM"
    },
    {
      content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam diam arcu, dignissim sed sapien in, sagittis pellentesque risus. Cras augue mauris, tempus pretium placerat non, finibus luctus tortor. Phasellus laoreet sodales odio, eu fringilla elit placerat sit amet. Praesent elementum risus nunc, id bibendum orci molestie ac. Nunc eleifend quam ac ex pharetr",
      isUser: false,
      timestamp: "10:35 AM",
      document: {
        id: "srs-002",
        description: "Updated SRS Document with Additional Requirements"
      }
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleNewChat = () => {
    const newChat = {
      id: chats.length + 1,
      title: `Chat ${chats.length + 1}`,
      isActive: false
    };
    setChats(prev => [...prev, newChat]);
  };

  const handleChatSelect = (chatId) => {
    setChats(prev => prev.map(chat => ({
      ...chat,
      isActive: chat.id === chatId
    })));
    // In a real app, you would load messages for the selected chat
  };

  const handleSendMessage = async (messageData) => {
    // Add user message
    const userMessage = {
      ...messageData,
      isUser: true
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        content: "I've analyzed your requirements and generated a comprehensive SRS document. The document includes functional requirements, non-functional requirements, system architecture, and user interface specifications.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        document: {
          id: `srs-${Date.now()}`,
          description: "Generated SRS Document based on your requirements"
        }
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <Layout>
      <LayoutContent>
        {/* Sidebar */}
        <Sidebar>
          <SidebarHeader onNewChat={handleNewChat} />
          <SidebarContent>
            {chats.map(chat => (
              <SidebarItem
                key={chat.id}
                isActive={chat.isActive}
                onClick={() => handleChatSelect(chat.id)}
              >
                {chat.title}
              </SidebarItem>
            ))}
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <MainContent>
          {/* Header */}
          <Header>
            <HeaderLogo>SprintSeed</HeaderLogo>
            <HeaderContent>
              <span className="text-sm text-muted-foreground">
                Welcome, {user?.username || 'User'}
              </span>
              <button
                onClick={onLogout}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Logout
              </button>
            </HeaderContent>
          </Header>

          {/* Chat Area */}
          <ChatArea messages={messages} />

          {/* Chat Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            onSendEmail={onSendEmail}
            disabled={isLoading}
          />
        </MainContent>
      </LayoutContent>
    </Layout>
  );
};

export default ChatPage;

