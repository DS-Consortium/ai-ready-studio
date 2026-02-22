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

const ELI_KNOWLEDGE_BASE: Record<string, string> = {
  'record': 'To record a video: 1) Go to Record page 2) Select a filter (AI Ready, AI Savvy, etc.) 3) Press the big Record button 4) Record your message (up to 60 seconds) 5) Review and submit. Your video will be moderated and published!',
  'filter': 'We have 8 DSC Filters: AI Ready, AI Savvy, AI Accountable, AI Driven, AI Enabler, Building AI-Ready Institutions, Leading with AI, and Shaping AI Future. Each represents a different aspect of AI readiness.',
  'share': 'After recording, you can share your video to LinkedIn, WhatsApp, Instagram, Facebook, Snapchat, and Twitter/X to inspire your network!',
  'vote': 'You can vote for videos in the gallery using our voting system. Each vote supports creators and highlights the best AI-ready content!',
  'event': 'We host seminars, workshops, bootcamps, and masterclasses on AI readiness. Visit the Events page to register, view schedules, and download calendars.',
  'gallery': 'The gallery showcases approved videos from the community. Browse, vote, and get inspired by others\' AI readiness journeys!',
  'dashboard': 'Your dashboard shows your submitted videos, voting history, registered events, and profile information.',
  'help': 'I can help with: recording videos, understanding filters, sharing content, voting, events, gallery, dashboard, and general questions about AI readiness.',
  'default': 'That\'s a great question! I\'m here to help. Try asking about recording, filters, sharing, voting, events, or the gallery!',
};

export const EliChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          text: "Hi! I'm Eli, your AI Readiness guide. Ready to declare your AI readiness and join thousands of leaders? Ask me anything!",
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

  const getEliResponse = (userMessage: string): string => {
    const lowerInput = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(ELI_KNOWLEDGE_BASE)) {
      if (key !== 'default' && lowerInput.includes(key)) {
        return response;
      }
    }
    
    return ELI_KNOWLEDGE_BASE.default;
  };

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
    setIsLoading(true);

    // Simulate response delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getEliResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 800);
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
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-background border border-border p-3 rounded-2xl rounded-tl-none">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
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
              disabled={isLoading}
            />
            <Button size="icon" className="rounded-full h-9 w-9" onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()}>
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
