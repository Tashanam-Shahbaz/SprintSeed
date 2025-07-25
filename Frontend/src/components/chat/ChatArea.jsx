import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import ChatMessage from './ChatMessage';

const ChatArea = ({ messages, isLoading = false }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {messages.length === 0 && !isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md">
            <div className="sprintseed-logo inline-block text-3xl mb-4">
              SprintSeed
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Welcome to SprintSeed
            </h2>
            <p className="text-muted-foreground">
              Share your project idea or upload a file to get started. 
              Our AI will generate a comprehensive SRS document for you.
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {isLoading && messages.length === 0 && (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading chat history...</span>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <ChatMessage
              key={message.id || message.timestamp}
              message={message}
              isUser={message.isUser}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default ChatArea;