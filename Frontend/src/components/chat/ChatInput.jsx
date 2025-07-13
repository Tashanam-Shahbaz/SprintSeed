import React, { useState, useEffect } from "react";
import { Send, Paperclip, X, Mail } from "lucide-react";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { cn } from "../../lib/utils";
import { toast } from 'react-toastify';
import { getApiUrl } from '../../config/api';

const ChatInput = ({ onSendMessage, onSendEmail, disabled = false }) => {
  const [message, setMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((message.trim() || attachedFile) && selectedModel) {
      onSendMessage({
        content: message.trim(),
        file: attachedFile,
        model: selectedModel,
        timestamp: new Date().toLocaleTimeString(),
      });
      setMessage("");
      setAttachedFile(null);
    } else if (!selectedModel) {
      toast.warning("Please select a model before sending a message.");
    }
  };

  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
  };

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(getApiUrl("models"));
        const data = await res.json();
        if (data.status === "success") {
          setModels(data.models);
        }
      } catch (err) {
        console.error("Failed to fetch models", err);
      }
    };

    fetchModels();
  }, []);

  return (
    <div className="border-t border-border bg-background p-4">
      {/* Model Selection */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {models.map((model) => (
          <button
            key={model.model_id}
            type="button"
            onClick={() => setSelectedModel(model)}
            className={cn(
              "model-tag px-4 py-2 rounded-full text-sm font-medium border-2 transition-all duration-200 transform",
              selectedModel?.model_id === model.model_id
                ? "bg-accent text-white border-accent shadow-lg scale-105 ring-2 ring-accent/20"
                : "bg-muted text-muted-foreground border-muted hover:bg-muted/70 hover:border-accent/50 hover:scale-102"
            )}
          >
            {selectedModel?.model_id === model.model_id && (
              <span className="mr-2">✓</span>
            )}
            {model.display_model_name}
          </button>
        ))}
      </div>

      {/* File Attachment Display */}
      {attachedFile && (
        <div className="mb-3 p-3 bg-muted/50 rounded-lg border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{attachedFile.name}</span>
            <span className="text-xs text-muted-foreground">
              ({(attachedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <Button size="sm" variant="ghost" onClick={removeAttachment}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Select a model and type your requirements here or attach a file"
            className="min-h-[60px] pr-12 resize-none"
            disabled={disabled}
          />

          {/* File Attach Button */}
          <label className="absolute right-3 top-3 cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={handleFileAttach}
              accept=".txt,.doc,.docx,.pdf"
            />
            <Paperclip className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={disabled || (!message.trim() && !attachedFile)}
            className="h-[60px] px-6"
            variant="accent"
          >
            <Send className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            onClick={onSendEmail}
            className="send-email-button h-[60px] px-4 text-xs font-medium"
            variant="accent"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
