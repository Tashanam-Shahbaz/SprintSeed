import React from 'react';
import { Download, User, Bot } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';

const ChatMessage = ({ message, isUser = false }) => {
  const handleDownload = (documentId) => {
    // This would typically trigger a download from your API
    console.log('Downloading document:', documentId);
    // For demo purposes, we'll just show an alert
    alert(`Downloading SRS document ${documentId}`);
  };

  return (
    <div className={cn(
      "chat-message flex gap-4 p-4",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-3xl",
        isUser ? "text-right" : "text-left"
      )}>
        <Card className={cn(
          "shadow-soft border-0",
          isUser ? "bg-primary/5 border-primary/20" : "bg-muted/50"
        )}>
          <CardContent className="p-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-foreground leading-relaxed mb-0">
                {message.content}
              </p>
            </div>

            {/* SRS Document Display */}
            {message.document && (
              <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">
                    SRS Document Generated
                  </h4>
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => handleDownload(message.document.id)}
                    className="download-button gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {message.document.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-muted-foreground mt-1 px-1",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

