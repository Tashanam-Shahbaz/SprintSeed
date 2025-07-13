import React, { useState, useEffect } from "react";
import {
  Layout,
  LayoutContent,
  MainContent,
} from "../components/layout/Layout";
import { Header, HeaderLogo, HeaderContent } from "../components/layout/Header";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarItem,
} from "../components/layout/Sidebar";
import ChatArea from "../components/chat/ChatArea";
import ChatInput from "../components/chat/ChatInput";

const ChatPage = ({ user, onLogout, onSendEmail }) => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch("http://localhost:8000/fetch-user-chat-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.user_id,
            project_id: "",
          }),
        });

        const data = await res.json();

        if (data.status === "success" && Array.isArray(data.chat_info)) {
          const formattedChats = data.chat_info.map((chat, index) => ({
            id: chat.project_id,
            title: chat.project_name,
            isActive: index === 0, // Make the first chat active by default
          }));
          setChats(formattedChats);
          if (formattedChats.length > 0) {
            setActiveChatId(formattedChats[0].id);
          }
        } else {
          console.error("Failed to load chat info", data);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
      }
    };

    if (user?.user_id) {
      fetchChats();
    }
  }, [user]);

  const [messages, setMessages] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const handleNewChat = () => {
    const newChat = {
      id: chats.length + 1,
      title: `Chat ${chats.length + 1}`,
      isActive: false,
    };
    setChats((prev) => [...prev, newChat]);
  };

  const handleChatSelect = async (chatId) => {
    // Set active chat in sidebar
    setChats((prev) =>
      prev.map((chat) => ({
        ...chat,
        isActive: chat.id === chatId,
      }))
    );
    setActiveChatId(chatId);
    setMessages([]);
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/fetch-user-chat-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.user_id,
          project_id: chatId,
        }),
      });

      const data = await res.json();

      if (data.status === "success" && Array.isArray(data.chat_details)) {
        const formattedMessages = data.chat_details.flatMap((detail) => {
          const time = new Date(detail.message_created_at).toLocaleTimeString();
          return [
            {
              content: detail.user_query,
              isUser: true,
              timestamp: time,
            },
            {
              content: detail.agent_response,
              isUser: false,
              timestamp: time,
            },
          ];
        });

        setMessages(formattedMessages);
      } else {
        setMessages([]); // No messages or error
        console.warn("No chat details found or API returned error.");
      }
    } catch (error) {
      console.error("Failed to fetch chat details:", error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageData) => {
    // Add user message
    const userMessage = {
      ...messageData,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        content:
          "I've analyzed your requirements and generated a comprehensive SRS document. The document includes functional requirements, non-functional requirements, system architecture, and user interface specifications.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        document: {
          id: `srs-${Date.now()}`,
          description: "Generated SRS Document based on your requirements",
        },
      };
      setMessages((prev) => [...prev, aiResponse]);
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
            {chats.map((chat) => (
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
                Welcome, {user?.first_name || "User"}!
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
