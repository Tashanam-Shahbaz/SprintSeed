import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, User, Bot, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';
import jsPDF from 'jspdf';

const ChatMessage = ({ message, isUser = false }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async (documentId) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      console.log('Starting PDF generation for:', documentId);
      
      // Get the message content
      const content = message.content || '';
      
      if (!content.trim()) {
        alert('No content available to download');
        return;
      }
      
      // Create PDF using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const lineHeight = 6;
      const maxLineWidth = pageWidth - 2 * margin;
      
      let yPosition = margin;
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`SRS Document - ${documentId}`, margin, yPosition);
      yPosition += lineHeight * 2;
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += lineHeight * 2;
      
      // Add separator line
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;
      
      // Process content - split by lines and handle formatting
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Skip empty lines but add some spacing
        if (line === '') {
          yPosition += lineHeight * 0.5;
          continue;
        }
        
        // Check if we need a new page
        if (yPosition > pageHeight - margin - lineHeight * 3) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Handle different content types
        if (line.match(/^#{1,6}\s/)) {
          // Markdown headers
          const headerLevel = line.match(/^#+/)[0].length;
          const headerText = line.replace(/^#+\s/, '');
          
          yPosition += lineHeight * 0.8;
          
          if (headerLevel === 1) {
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
          } else if (headerLevel === 2) {
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
          } else {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
          }
          
          const headerLines = pdf.splitTextToSize(headerText, maxLineWidth);
          for (const headerLine of headerLines) {
            pdf.text(headerLine, margin, yPosition);
            yPosition += lineHeight;
          }
          
          yPosition += lineHeight * 0.5;
          
        } else if (line.match(/^(INTRODUCTION|FRONTEND SPECIFICATIONS|BACKEND ARCHITECTURE|DATABASE DESIGN|NON-FUNCTIONAL REQUIREMENTS|IMPLEMENTATION TIMELINE)$/i)) {
          // Main section headers
          yPosition += lineHeight;
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          
          const sectionLines = pdf.splitTextToSize(line, maxLineWidth);
          for (const sectionLine of sectionLines) {
            pdf.text(sectionLine, margin, yPosition);
            yPosition += lineHeight;
          }
          
          // Add underline
          pdf.setLineWidth(0.3);
          pdf.line(margin, yPosition, margin + 60, yPosition);
          yPosition += lineHeight;
          
        } else if (line.match(/^\d+\.\s/)) {
          // Numbered lists
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          
          // Clean up formatting
          line = line.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markers
          line = line.replace(/\*(.*?)\*/g, '$1'); // Remove italic markers
          line = line.replace(/`(.*?)`/g, '$1'); // Remove code markers
          
          const listLines = pdf.splitTextToSize(line, maxLineWidth - 5);
          for (let j = 0; j < listLines.length; j++) {
            const xPos = j === 0 ? margin : margin + 5;
            pdf.text(listLines[j], xPos, yPosition);
            yPosition += lineHeight;
          }
          
          yPosition += lineHeight * 0.3;
          
        } else {
          // Regular paragraphs
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          
          // Clean up formatting
          line = line.replace(/\*\*(.*?)\*\*/g, '$1');
          line = line.replace(/\*(.*?)\*/g, '$1');
          line = line.replace(/`(.*?)`/g, '$1');
          line = line.replace(/\[(.*?)\]\(.*?\)/g, '$1');
          
          const paragraphLines = pdf.splitTextToSize(line, maxLineWidth);
          for (const paragraphLine of paragraphLines) {
            pdf.text(paragraphLine, margin, yPosition);
            yPosition += lineHeight;
          }
          
          yPosition += lineHeight * 0.5;
        }
      }
      
      // Add footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
        pdf.text('Generated by SprintSeed', margin, pageHeight - 10);
      }
      
      // Save the PDF
      const fileName = `SRS-Document-${documentId}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      console.log('PDF generated successfully:', fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback: download as markdown file
      try {
        const element = document.createElement('a');
        const file = new Blob([message.content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `SRS-Document-${documentId}-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        console.log('Fallback: Downloaded as markdown file');
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
        alert('Failed to download document. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  // Function to render content with proper formatting
  const renderContent = (content, isStreaming = false) => {
    if (isUser) {
      return (
        <p className="text-foreground leading-relaxed mb-0">
          {content}
        </p>
      );
    }

    // For streaming content, display as plain text with preserved line breaks
    if (isStreaming) {
      return (
        <div className="whitespace-pre-wrap text-foreground leading-relaxed">
          {content}
        </div>
      );
    }

    // For completed content, use ReactMarkdown for proper formatting
    return (
      <div className="markdown-content">
        <ReactMarkdown
          components={{
            h1: ({children}) => <h1 className="text-xl font-bold mb-4 mt-6 text-foreground border-b border-border pb-2">{children}</h1>,
            h2: ({children}) => <h2 className="text-lg font-semibold mb-3 mt-5 text-foreground">{children}</h2>,
            h3: ({children}) => <h3 className="text-base font-medium mb-2 mt-4 text-foreground">{children}</h3>,
            p: ({children}) => {
              const text = children?.toString() || '';
              
              // Check if it's a main section header
              if (text.match(/^(INTRODUCTION|FRONTEND SPECIFICATIONS|BACKEND ARCHITECTURE|DATABASE DESIGN|NON-FUNCTIONAL REQUIREMENTS|IMPLEMENTATION TIMELINE)$/i)) {
                return <h1 className="text-xl font-bold mb-4 mt-6 text-foreground border-b-2 border-primary pb-2 uppercase">{children}</h1>;
              }
              
              // Check if it's a numbered list item
              if (text.match(/^\d+\.\s/)) {
                return <div className="mb-3 text-foreground leading-relaxed font-medium pl-4 border-l-2 border-accent bg-accent/5 py-2">{children}</div>;
              }
              
              return <p className="mb-3 text-foreground leading-relaxed">{children}</p>;
            },
            ul: ({children}) => <ul className="list-disc list-inside mb-4 pl-4 text-foreground space-y-2">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal list-inside mb-4 pl-4 text-foreground space-y-2">{children}</ol>,
            li: ({children}) => <li className="mb-2 leading-relaxed">{children}</li>,
            code: ({children}) => <code className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground">{children}</code>,
            pre: ({children}) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono mb-4 whitespace-pre-wrap">{children}</pre>,
            strong: ({children}) => <strong className="font-bold text-foreground">{children}</strong>,
            em: ({children}) => <em className="italic text-foreground">{children}</em>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
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
              {renderContent(message.content, message.isStreaming)}
              
              {message.isStreaming && (
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Generating...</span>
                </div>
              )}
            </div>

            {/* SRS Document Display */}
            { !message.isUser && (
              <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-foreground">
                    SRS Document Generated
                  </h4>
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => handleDownload(message.document?.id || `srs-${message.id || Date.now()}`)}
                    disabled={isDownloading || message.isStreaming}
                    className="download-button gap-2 min-w-[100px]"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating PDF
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {message.document?.description || "Generated SRS Document based on your requirements"}
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