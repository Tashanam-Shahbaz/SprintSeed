import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Download, User, Bot, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import { toast } from 'react-toastify';

const ChatMessage = ({ message, isUser = false }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async (documentId) => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      console.log('Starting PDF generation for:', documentId);
      
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
      
      // Process markdown content
      const content = message.content || '';
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // Skip empty lines but add some spacing
        if (line === '') {
          yPosition += lineHeight * 0.5;
          continue;
        }
        
        // Check if we need a new page
        if (yPosition > pageHeight - margin - lineHeight) {
          pdf.addPage();
          yPosition = margin;
        }
        
        // Handle different markdown elements
        if (line.match(/^#{1,6}\s/)) {
          // Headers
          const headerLevel = line.match(/^#+/)[0].length;
          const headerText = line.replace(/^#+\s/, '');
          
          yPosition += lineHeight * 0.8; // Add space before header
          
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
          
          // Split long headers
          const headerLines = pdf.splitTextToSize(headerText, maxLineWidth);
          for (const headerLine of headerLines) {
            pdf.text(headerLine, margin, yPosition);
            yPosition += lineHeight;
          }
          
          yPosition += lineHeight * 0.5; // Add space after header
          
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
            const xPos = j === 0 ? margin : margin + 5; // Indent continuation lines
            pdf.text(listLines[j], xPos, yPosition);
            yPosition += lineHeight;
          }
          
          yPosition += lineHeight * 0.3; // Add space after list item
          
        } else if (line.match(/^[-*+]\s/)) {
          // Bullet lists
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          
          line = line.replace(/^[-*+]\s/, '• '); // Replace with bullet
          line = line.replace(/\*\*(.*?)\*\*/g, '$1');
          line = line.replace(/\*(.*?)\*/g, '$1');
          line = line.replace(/`(.*?)`/g, '$1');
          
          const bulletLines = pdf.splitTextToSize(line, maxLineWidth - 5);
          for (let j = 0; j < bulletLines.length; j++) {
            const xPos = j === 0 ? margin : margin + 5;
            pdf.text(bulletLines[j], xPos, yPosition);
            yPosition += lineHeight;
          }
          
          yPosition += lineHeight * 0.3;
          
        } else if (line.match(/^\*\*.*\*\*:?$/)) {
          // Bold section headers
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          
          const boldText = line.replace(/\*\*/g, ''); // Remove bold markers
          const boldLines = pdf.splitTextToSize(boldText, maxLineWidth);
          for (const boldLine of boldLines) {
            pdf.text(boldLine, margin, yPosition);
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
          line = line.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links, keep text
          
          const paragraphLines = pdf.splitTextToSize(line, maxLineWidth);
          for (const paragraphLine of paragraphLines) {
            pdf.text(paragraphLine, margin, yPosition);
            yPosition += lineHeight;
          }
          
          yPosition += lineHeight * 0.5; // Add space after paragraph
        }
      }
      
      // Add footer
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
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
        toast.error('Failed to download document. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
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
              {isUser ? (
                <p className="text-foreground leading-relaxed mb-0">
                  {message.content}
                </p>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown
                    components={{
                      h1: ({children}) => <h1 className="text-xl font-bold mb-4 mt-6 text-foreground border-b border-border pb-2">{children}</h1>,
                      h2: ({children}) => <h2 className="text-lg font-semibold mb-3 mt-5 text-foreground">{children}</h2>,
                      h3: ({children}) => <h3 className="text-base font-medium mb-2 mt-4 text-foreground">{children}</h3>,
                      p: ({children}) => {
                        const text = children?.toString() || '';
                        
                        // Check if it's a main section header (INTRODUCTION, BACKEND ARCHITECTURE, etc.)
                        if (text.match(/^(INTRODUCTION|FRONTEND SPECIFICATIONS|BACKEND ARCHITECTURE|DATABASE DESIGN|NON-FUNCTIONAL REQUIREMENTS|IMPLEMENTATION TIMELINE)$/i)) {
                          return <h1 className="text-xl font-bold mb-4 mt-6 text-foreground border-b-2 border-primary pb-2 uppercase">{children}</h1>;
                        }
                        
                        // Check if it's a STAGE header
                        if (text.match(/^STAGE \d+:/i)) {
                          return <h2 className="text-lg font-semibold mb-3 mt-5 text-foreground border-b border-border pb-1">{children}</h2>;
                        }
                        
                        // Check if it's a section header (ALL CAPS with 8+ characters)
                        if (text.match(/^[A-Z\s]{8,}:?\s*$/)) {
                          return <h2 className="text-lg font-bold mb-3 mt-5 text-foreground uppercase border-b border-border pb-1">{children}</h2>;
                        }
                        
                        // Check if it's a subsection header (Title Case followed by colon)
                        if (text.match(/^[A-Z][a-zA-Z\s]+:\s*$/)) {
                          return <h3 className="text-base font-semibold mb-2 mt-4 text-foreground">{children}</h3>;
                        }
                        
                        // Check if it's a numbered list item
                        if (text.match(/^\d+\.\s/)) {
                          return <div className="mb-3 text-foreground leading-relaxed font-medium pl-4 border-l-2 border-accent bg-accent/5 py-2">{children}</div>;
                        }
                        
                        // Check if it contains table/API content (pipe symbols)
                        if (text.includes('|') && text.split('|').length > 2) {
                          return <div className="mb-3 text-foreground leading-relaxed font-mono text-sm bg-muted p-2 rounded border">{children}</div>;
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
                      table: ({children}) => <table className="border-collapse border border-border w-full mb-4">{children}</table>,
                      th: ({children}) => <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">{children}</th>,
                      td: ({children}) => <td className="border border-border px-3 py-2">{children}</td>,
                      hr: () => <hr className="border-border my-6" />,
                      blockquote: ({children}) => <blockquote className="border-l-4 border-accent pl-4 my-4 italic text-muted-foreground">{children}</blockquote>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.isStreaming && (
                    <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Generating...</span>
                    </div>
                  )}
                </div>
              )}
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

