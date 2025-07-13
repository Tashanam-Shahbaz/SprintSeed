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
            projectId: chat.project_id
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
  const [lastSelectedModel, setLastSelectedModel] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const handleNewChat = async () => {
    try {
      // Generate unique project ID
      const projectId = `project-${Date.now()}`;
      const projectName = `Project ${chats.length + 1}`;
      console.log(user)
      // Create project via API
      const response = await fetch('http://localhost:8000/create-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          project_name: projectName,
          conversation_id: projectId,
          chat_type: "srs_document",
          user_id: user?.user_id 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const result = await response.json();
      console.log('Project created successfully:', result);

      // Use the project_id from the response
      const returnedProjectId = result.project_id || projectId;

      // Add new chat to the list
      const newChat = {
        id: returnedProjectId,
        title: projectName,
        isActive: false,
        projectId: returnedProjectId
      };
      setChats(prev => [...prev, newChat]);
    } catch (error) {
      console.error('Error creating project:', error);
      // Still add the chat locally even if API fails
      const fallbackProjectId = `project-${Date.now()}`;
      const newChat = {
        id: fallbackProjectId,
        title: `Chat ${chats.length + 1}`,
        isActive: false,
        projectId: fallbackProjectId
      };
      setChats(prev => [...prev, newChat]);
    }
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
    // Store the selected model for email functionality
    if (messageData.model) {
      setLastSelectedModel(messageData.model);
    }
    
    // Get the active chat to retrieve project ID
    const activeChat = chats.find(chat => chat.id === activeChatId);
    if (!activeChat) {
      console.error('No active chat found');
      return;
    }

    // Add user message
    const userMessage = {
      id: Date.now(),
      ...messageData,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare file_ids array
      const fileIds = [];
      if (messageData.file) {
        // In a real implementation, you would upload the file first and get its ID
        // For now, we'll use a placeholder or skip files
        fileIds.push("uploaded-file-id"); // Replace with actual file upload logic
      }

      // Call the generate-srs-proposal API
      const response = await fetch('http://localhost:8000/generate-srs-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: activeChat.projectId || activeChat.id,
          project_name: activeChat.title,
          conversation_id: activeChat.projectId || activeChat.id,
          model_type: messageData.model?.model_type || 'openai',
          model_id: messageData.model?.model_name || messageData.model?.model_id || 'gpt-4o',
          temperature: 0.2,
          user_query: messageData.content,
          file_ids: fileIds,
          chat_type: "srs_document",
          user_id: user?.user_id
        })
      });
      console.log("RESponse:", response)

      if (!response.ok) {
        throw new Error('Failed to generate SRS proposal');
      }

      // Create AI message placeholder for streaming content
      const aiMessageId = Date.now();
      const aiMessage = {
        id: aiMessageId,
        content: "",
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        document: {
          id: `srs-${aiMessageId}`,
          description: "Generated SRS Document based on your requirements"
        },
        isStreaming: true
      };
      
      setMessages(prev => [...prev, aiMessage]);

      // Handle streaming response
      const reader = response.body.getReader();
      console.log("GEt:",reader.read())
      const decoder = new TextDecoder();
      console.log("text:",decoder)
      let fullMessage = "";
      let accumulatedContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        console.log("chunk",chunk)
        // buffer += chunk;
        
        // // Process complete lines from buffer
        // const lines = buffer.split('\n');
        // buffer = lines.pop() || ""; // Keep incomplete line in buffer
        
        // for (const line of lines) {
        //   if (line.startsWith('data: ')) {
        //     // Extract content after "data: " prefix
        //     const content = line.substring(6);
        //     if (content.trim()) {
        //       // Add the content directly
        //       accumulatedContent += content;
              
        //       // Apply minimal formatting - just add line breaks for readability
        //       let formattedContent = accumulatedContent;
              
        //       // Add line breaks before numbered lists
        //       formattedContent = formattedContent.replace(/([.!?])\s*(\d+\.\s+[A-Z])/g, '$1\n\n$2');
              
        //       // Add line breaks before major sections (without adding markdown syntax)
        //       formattedContent = formattedContent.replace(/([.!?])\s*(INTRODUCTION|FRONTEND SPECIFICATIONS|BACKEND ARCHITECTURE|DATABASE DESIGN|NON-FUNCTIONAL REQUIREMENTS|IMPLEMENTATION TIMELINE)/g, '$1\n\n$2');
              
        //       // Add line breaks before STAGE headers (without adding markdown syntax)
        //       formattedContent = formattedContent.replace(/([.!?])\s*(STAGE \d+:)/g, '$1\n\n$2');
              
        //       // Add proper spacing for bullet points
        //       formattedContent = formattedContent.replace(/([.!?])\s*(-\s+)/g, '$1\n\n$2');
              
        //       // Clean up multiple line breaks
        //       formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
        //       formattedContent = formattedContent.replace(/^\n+/, '');
              
        //       // Update the AI message with formatted content
        //       setMessages(prev => prev.map(msg => 
        //         msg.id === aiMessageId 
        //           ? { ...msg, content: formattedContent }
        //           : msg
        //       ));
        //     }
        //   }
        // }
      }

      // Process any remaining buffer content
      if (buffer.startsWith('data: ')) {
        const content = buffer.substring(6);
        if (content.trim()) {
          accumulatedContent += content;
          
          // Final formatting pass - just clean line breaks
          let formattedContent = accumulatedContent;
          
          // Add line breaks before numbered lists
          formattedContent = formattedContent.replace(/([.!?])\s*(\d+\.\s+[A-Z])/g, '$1\n\n$2');
          
          // Add line breaks before major sections (without markdown syntax)
          formattedContent = formattedContent.replace(/([.!?])\s*(INTRODUCTION|FRONTEND SPECIFICATIONS|BACKEND ARCHITECTURE|DATABASE DESIGN|NON-FUNCTIONAL REQUIREMENTS|IMPLEMENTATION TIMELINE)/g, '$1\n\n$2');
          
          // Add line breaks before STAGE headers (without markdown syntax)
          formattedContent = formattedContent.replace(/([.!?])\s*(STAGE \d+:)/g, '$1\n\n$2');
          
          // Add proper spacing for bullet points
          formattedContent = formattedContent.replace(/([.!?])\s*(-\s+)/g, '$1\n\n$2');
          
          // Clean up multiple line breaks
          formattedContent = formattedContent.replace(/\n{3,}/g, '\n\n');
          formattedContent = formattedContent.replace(/^\n+/, '');
          
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: formattedContent }
              : msg
          ));
        }
      }

      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error('Error generating SRS proposal:', error);
      
      // Add error message
      const errorMessage = {
        content: "Sorry, there was an error generating the SRS proposal. Please try again.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
            onSendEmail={() => {
              const activeChat = chats.find(chat => chat.id === activeChatId);
              if (activeChat) {
                onSendEmail({
                  projectId: activeChat.projectId || activeChat.id,
                  conversationId: activeChat.projectId || activeChat.id,
                  model: lastSelectedModel
                });
              } else {
                alert('Please select a chat first');
              }
            }}
            disabled={isLoading}
          />
        </MainContent>
      </LayoutContent>
    </Layout>
  );
};

export default ChatPage;
