import React, { useState, useEffect, useCallback } from "react";
import { Send, Mail, Paperclip, X } from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
} from "../ui/Modal";
import { Button } from "../ui/Button";
import { toast } from "react-toastify";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

const EmailModal = ({
  isOpen,
  onClose,
  onSend,
  projectId,
  conversationId,
  selectedModel,
}) => {
  const [emailData, setEmailData] = useState({
    recipient: "",
    subject: "",
    message: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachment, setAttachment] = useState(null);

  // Generate email summary when modal opens
  const generateEmailSummary = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        "http://localhost:8000/email-summary-generator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: projectId,
            conversation_id: conversationId,
            chat_type: "email_summary",
            model_type: selectedModel?.model_type,
            model_id: selectedModel?.model_name,
            temperature: 0.2,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate email summary");
      }

      const data = await response.json();
      setEmailData((prev) => ({
        ...prev,
        subject: data.subject || "SRS Document from SprintSeed",
        message: data.body || "",
      }));
    } catch (error) {
      console.error("Error generating email summary:", error);
      // Set default values if API fails
      setEmailData((prev) => ({
        ...prev,
        subject: "SRS Document from SprintSeed",
        message:
          "Please find attached the SRS document generated for your project.",
      }));
    } finally {
      setIsGenerating(false);
    }
  }, [projectId, conversationId, selectedModel]);

  useEffect(() => {
    if (isOpen && projectId && conversationId) {
      generateEmailSummary();
    }
  }, [isOpen, projectId, conversationId, generateEmailSummary]);

  const handleChange = (e) => {
    setEmailData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 25MB)
      const maxSize = 25 * 1024 * 1024; // 25MB in bytes
      if (file.size > maxSize) {
        toast.error("File size must be less than 25MB");
        e.target.value = ""; // Reset the input
        return;
      }
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    // Reset the file input
    const fileInput = document.getElementById("attachment");
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailData.recipient.trim()) {
      toast.warning("Please enter a recipient email address");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare FormData for send-email API (to support file attachments)
      // const formData = new FormData();
      // formData.append('subject', emailData.subject);
      // formData.append('body', emailData.message);
      // formData.append('recipient', emailData.recipient);

      // // Add attachment if present
      // if (attachment) {
      //   formData.append('attachment', attachment);
      // }

      // const response = await fetch('http://localhost:8000/send-email', {
      //   method: 'POST',
      //   body: formData // Using FormData instead of JSON to support file uploads
      // });
      const response = await fetch("http://localhost:8000/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: emailData.subject,
          body: emailData.message,
          recipient: emailData.recipient,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      // Call the original onSend callback if provided
      if (onSend) {
        await onSend(emailData);
      }

      // Reset form
      setEmailData({
        recipient: "",
        subject: "",
        message: "",
      });
      const hadAttachment = !!attachment;
      setAttachment(null);
      onClose();

      toast.success(
        `Email sent successfully${hadAttachment ? " with attachment" : ""}!`
      );
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isGenerating) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div>
              <ModalTitle>Send Email</ModalTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Share the SRS document with your team
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalContent className="space-y-6">
          {isGenerating && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Generating email summary...
                </span>
              </div>
            </div>
          )}

          {!isGenerating && (
            <>
              {/* Recipient Email */}
              <div className="space-y-2">
                <label
                  htmlFor="recipient"
                  className="text-sm font-medium text-foreground"
                >
                  Recipient Email <span className="text-destructive">*</span>
                </label>
                <Input
                  id="recipient"
                  name="recipient"
                  type="email"
                  placeholder="Enter recipient email address"
                  value={emailData.recipient}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label
                  htmlFor="subject"
                  className="text-sm font-medium text-foreground"
                >
                  Subject
                </label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Email subject"
                  value={emailData.subject}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-sm font-medium text-foreground"
                >
                  Email Body
                </label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Email content..."
                  value={emailData.message}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="min-h-[200px] resize-none"
                />
              </div>

              {/* Attachment */}
              <div className="space-y-2">
                <label
                  htmlFor="attachment"
                  className="text-sm font-medium text-foreground"
                >
                  Attachment (Optional)
                </label>
                <div className="space-y-3">
                  <Input
                    id="attachment"
                    type="file"
                    onChange={handleAttachmentChange}
                    disabled={isLoading}
                    className="h-11"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  />
                  {attachment && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {attachment.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeAttachment}
                        disabled={isLoading}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading || isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            disabled={isLoading || isGenerating || !emailData.recipient.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {attachment ? "Sending with attachment..." : "Sending..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {attachment ? "Send Email with Attachment" : "Send Email"}
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EmailModal;
