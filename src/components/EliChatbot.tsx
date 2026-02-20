import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const EliChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: "Hi! I'm Eli, your AI Readiness guide. Ready to declare your AI readiness and join thousands of leaders?",
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simple bot response logic
    setTimeout(() => {
      let botText = "That's interesting! To get started with your declaration, just click the 'Create Your Video' button on the homepage.";
      
      const lowerInput = inputValue.toLowerCase();
      if (lowerInput.includes('how') || lowerInput.includes('start')) {
        botText = "To start, choose one of our 8 'DSC Filters' that represents your AI identity, then record a short video sharing your vision.";
      } else if (lowerInput.includes('filter') || lowerInput.includes('dsc')) {
        botText = "We have 8 DSC Filters like 'AI Savvy', 'AI Accountable', and 'AI Driven'. Each one comes with a specific prompt to help you shape your message.";
      } else if (lowerInput.includes('share') || lowerInput.includes('linkedin')) {
        botText = "After recording, you can instantly share your video to LinkedIn, WhatsApp, or Instagram to inspire your network!";
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-background border border-border rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-primary p-4 flex items-center justify-between text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm">Eli</p>
                <p className="text-[10px] opacity-80">AI Readiness Guide</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-md transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 p-4 h-80 overflow-y-auto space-y-4 bg-secondary/10">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
                  msg.sender === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-background border border-border rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex gap-2 bg-background">
            <input
              type="text"
              placeholder="Ask Eli about AI Readiness..."
              className="flex-1 bg-secondary/20 border-none rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button size="icon" className="rounded-full h-9 w-9" onClick={handleSendMessage}>
              <Send size={16} />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-xl animate-bounce-subtle"
          size="icon"
        >
          <MessageCircle size={28} />
        </Button>
      )}
    </div>
  );
};
