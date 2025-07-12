import React, { useState } from 'react';
import { Send, Mail } from 'lucide-react';
import { 
  Modal, 
  ModalHeader, 
  ModalTitle, 
  ModalContent, 
  ModalFooter 
} from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

const EmailModal = ({ isOpen, onClose, onSend }) => {
  const [emailData, setEmailData] = useState({
    recipient: '',
    subject: 'SRS Document from SprintSeed',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setEmailData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailData.recipient.trim()) {
      alert('Please enter a recipient email address');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSend(emailData);
      // Reset form
      setEmailData({
        recipient: '',
        subject: 'SRS Document from SprintSeed',
        message: ''
      });
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
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
          {/* Recipient Email */}
          <div className="space-y-2">
            <label htmlFor="recipient" className="text-sm font-medium text-foreground">
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
            <label htmlFor="subject" className="text-sm font-medium text-foreground">
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

          {/* Additional Message */}
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium text-foreground">
              Additional Message
            </label>
            <Textarea
              id="message"
              name="message"
              placeholder="Enter any additional message you want to include with the SRS document..."
              value={emailData.message}
              onChange={handleChange}
              disabled={isLoading}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              The SRS document will be automatically attached to this email.
            </p>
          </div>
        </ModalContent>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="accent"
            disabled={isLoading || !emailData.recipient.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Email
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EmailModal;

