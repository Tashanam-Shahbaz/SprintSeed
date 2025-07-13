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
import { toast } from 'react-toastify';
import { getApiUrl } from '../config/api';

const ChatPage = ({ user, onLogout, onSendEmail }) => {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(getApiUrl("fetch-user-chat-info"), {
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
          const sortedChats = data.chat_info.sort((a, b) => {
            if (a.created_at && b.created_at) {
              return new Date(b.created_at) - new Date(a.created_at);
            }
            return b.project_id.localeCompare(a.project_id);
          });

          const formattedChats = sortedChats.map((chat) => ({
            id: chat.project_id,
            title: chat.project_name,
            isActive: false,
            projectId: chat.project_id,
            createdAt: chat.created_at
          }));
          
          setChats(formattedChats);
          setActiveChatId(null);
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
      const projectId = `project-${Date.now()}`;
      const projectName = `Project ${chats.length + 1}`;
      
      // Create project via API
      const response = await fetch(getApiUrl('create-project'), {
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
      const returnedProjectId = result.project_id || projectId;

      const newChat = {
        id: returnedProjectId,
        title: projectName,
        isActive: true,
        projectId: returnedProjectId,
      };

      setChats(prev => {
        const updatedChats = prev.map(chat => ({ ...chat, isActive: false }));
        return [newChat, ...updatedChats];
      });

      setActiveChatId(returnedProjectId);
      setMessages([]);

      return newChat;

    } catch (error) {
      console.error('Error creating project:', error);
      const fallbackProjectId = `project-${Date.now()}`;
      const newChat = {
        id: fallbackProjectId,
        title: `Chat ${chats.length + 1}`,
        isActive: true,
        projectId: fallbackProjectId,
        createdAt: new Date().toISOString()
      };
      
      setChats(prev => {
        const updatedChats = prev.map(chat => ({ ...chat, isActive: false }));
        return [newChat, ...updatedChats];
      });
      
      setActiveChatId(fallbackProjectId);
      setMessages([]);

      return newChat;
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
      const res = await fetch(getApiUrl("fetch-user-chat-details"), {
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
    
    let activeChat = chats.find(chat => chat.id === activeChatId);
    if (!activeChat) {
      console.log('No active chat found, creating new chat...');
      try {
        activeChat = await handleNewChat();
        console.log('New chat created:', activeChat);
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('Failed to create new chat:', error);
        return;
      }
    }

    if (!activeChat) {
      console.error('Still no active chat after creation attempt');
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      ...messageData,
      isUser: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const fileIds = [];
      if (messageData.file) {
        fileIds.push("uploaded-file-id");
      }

      // Call the generate-srs-proposal API
      const response = await fetch(getApiUrl('generate-srs-proposal'), {
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

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      const aiMessageId = `ai-${Date.now()}`;
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

      // NEW APPROACH: Use a more robust streaming handler
      let accumulatedContent = "";
      let isComplete = false;
      
      try {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let noDataCount = 0;
        const MAX_NO_DATA_COUNT = 10;

        console.log('Starting robust streaming...');

        while (!isComplete) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Stream marked as done');
            break;
          }
          
          if (!value || value.length === 0) {
            noDataCount++;
            if (noDataCount > MAX_NO_DATA_COUNT) {
              console.log('Too many empty chunks, ending stream');
              break;
            }
            continue;
          }
          
          noDataCount = 0;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process all complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            let content = "";
            
            if (line.startsWith('data: ')) {
              content = line.substring(6);
            } else if (line.trim() && !line.startsWith('event:') && !line.startsWith(':')) {
              content = line;
            }
            
            if (content.trim()) {
              accumulatedContent += content;
              
              // Check for completion markers
              const lowerContent = accumulatedContent.toLowerCase();
              if (lowerContent.includes('generate srs') || 
                  lowerContent.includes('suggest changes') ||
                  accumulatedContent.includes('[To generate') ||
                  accumulatedContent.includes('reply with')) {
                console.log('Found completion marker');
                isComplete = true;
              }
              
              // Update UI
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: accumulatedContent }
                  : msg
              ));
            }
          }
          
          // Also check if we've received a substantial amount of content
          if (accumulatedContent.length > 2000 && 
              (accumulatedContent.includes('Quality assurance approach') ||
               accumulatedContent.includes('Potential challenges'))) {
            console.log('Substantial content received, likely complete');
            isComplete = true;
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          if (buffer.startsWith('data: ')) {
            accumulatedContent += buffer.substring(6);
          } else {
            accumulatedContent += buffer;
          }
          
          setMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: accumulatedContent }
              : msg
          ));
        }

        reader.releaseLock();
        console.log('Final content length:', accumulatedContent.length);

      } catch (streamError) {
        console.error('Streaming error:', streamError);
        
        // Fallback: try to get the response as text
        try {
          const fallbackResponse = await fetch('http://localhost:8000/generate-srs-proposal', {
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
          
          if (fallbackResponse.ok) {
            const fallbackText = await fallbackResponse.text();
            if (fallbackText && fallbackText.length > accumulatedContent.length) {
              console.log('Using fallback response');
              accumulatedContent = fallbackText;
            }
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
        
        if (!accumulatedContent) {
          accumulatedContent = "Error occurred while generating response. Please try again.";
        }
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: accumulatedContent }
            : msg
        ));
      }

      // Mark as complete
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

    } catch (error) {
      console.error('Error generating SRS proposal:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        content: `Sorry, there was an error generating the SRS proposal: ${error.message}. Please try again.`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format SRS content with proper line breaks
  const formatSRSContent = (text) => {
    if (!text) return "";
    
    // Apply formatting rules in sequence
    let formatted = text;
    
    // Add breaks before major section headers
    const sectionHeaders = [
      "INTRODUCTION", 
      "FRONTEND SPECIFICATIONS", 
      "BACKEND ARCHITECTURE", 
      "DATABASE DESIGN", 
      "NON-FUNCTIONAL REQUIREMENTS", 
      "IMPLEMENTATION TIMELINE"
    ];
    
    sectionHeaders.forEach(header => {
      const headerRegex = new RegExp(`([.!?\\s])${header}`, 'g');
      formatted = formatted.replace(headerRegex, `$1\n\n${header}`);
    });
    
    // Add breaks before STAGE sections
    // formatted = formatted.replace(/([.!?\s])(STAGE \d+:)/g, '$1\n\n$2');
    
    // // Add breaks before numbered lists
    // formatted = formatted.replace(/(\d+\.\s+)([A-Z])/g, '\n$1$2');
    
    // // Add breaks before bullet points
    // formatted = formatted.replace(/([.!?\s])(-\s+)/g, '$1\n\n$2');
    
    // Normalize multiple line breaks
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    return formatted;
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
                toast.warning('Please select a chat first');
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