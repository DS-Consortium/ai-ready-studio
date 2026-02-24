import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Mic, Volume2, MessageCircle, X, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const eliAvatarUrl = "/images/eli_chatbot.png"; 

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm Eli, your virtual AI Readiness guide. I can help you declare your AI readiness, navigate the video contest, find upcoming events, and answer questions about the DS Consortium ecosystem. How can I help you today?",
  timestamp: new Date(),
  suggestions: [
    'How do I record a video?',
    'What are the AI filters?',
    'Show me upcoming events',
    'How does voting work?'
  ]
};

// Reusable Avatar component
const Avatar = ({ 
  src, 
  alt = "Eli", 
  size = "default",
  isSpeaking = false 
}: { 
  src: string; 
  alt?: string; 
  size?: 'sm' | 'default' | 'header'; 
  isSpeaking?: boolean; 
}) => {
  const sizeClasses = {
    sm:     "w-7 h-7",
    default: "w-8 h-8",
    header:  "w-10 h-10"
  }[size];

  return (
    <div className={cn(
      "relative rounded-full overflow-hidden shrink-0 border-2 border-background shadow-sm",
      sizeClasses,
      isSpeaking && "animate-pulse border-primary/60 ring-2 ring-primary/30"
    )}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://via.placeholder.com/80?text=Eli";
        }}
      />
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="w-5 h-5 rounded-full bg-primary/40 animate-ping" />
        </div>
      )}
    </div>
  );
};

export const EliChatbot = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const speechRecognition = useRef<any>(null);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  // Initialize speech APIs
  useEffect(() => {
    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
      speechRecognition.current = new SpeechRecognitionConstructor();
      speechRecognition.current.continuous = false;
      speechRecognition.current.interimResults = false;
      speechRecognition.current.onresult = (event: any) => {
        setInputValue(event.results[0][0].transcript);
        setIsListening(false);
      };
      speechRecognition.current.onend = () => setIsListening(false);
      speechRecognition.current.onerror = () => setIsListening(false);
    }
    speechSynthesis.current = window.speechSynthesis;
  }, []);

  const toggleListening = () => {
    if (!speechRecognition.current) {
      toast({ title: "Voice input not supported", description: "Try Chrome or Edge.", variant: "destructive" });
      return;
    }
    if (isListening) {
      speechRecognition.current.stop();
    } else {
      speechRecognition.current.start();
    }
    setIsListening(!isListening);
  };

  const speakMessage = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);

    if (speechSynthesis.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.current.getVoices();
      const naturalVoice = voices.find(v =>
        v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha')
      );
      if (naturalVoice) utterance.voice = naturalVoice;
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.current.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (user && messages.length === 1) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';
      const welcomeMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Welcome back, ${name}! Ready to continue your AI readiness journey? You can record a new video, check the leaderboard, or browse upcoming events.`,
        timestamp: new Date(),
        suggestions: ['Record a video', 'View leaderboard', 'Upcoming events']
      };
      setMessages([INITIAL_MESSAGE, welcomeMsg]);
    }
  }, [user, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const generateResponse = (message: string): Message => {
    const lower = message.toLowerCase();
    
    if (lower.includes('record') || lower.includes('video') || lower.includes('contest')) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "To record a video: 1) Go to the Record page. 2) Select an AR filter that represents your AI journey. 3) Press the big Record button. 4) Record for up to 60 seconds. 5) Review and submit! Your video will be baked with the filter and shared with the community.",
        timestamp: new Date(),
        suggestions: ['Go to Record page', 'What are the filters?']
      };
    }

    if (lower.includes('filter') || lower.includes('lens')) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "We have 8 unique AI filters including 'AI Ready', 'AI Savvy', 'AI Accountable', and 'AI Driven'. Each one adds a professional AR text lens to your recording to highlight your specific AI identity.",
        timestamp: new Date(),
        suggestions: ['Try filters now', 'How does voting work?']
      };
    }

    if (lower.includes('vote') || lower.includes('voting') || lower.includes('paid')) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Our paid voting system allows the community to support their favorite creators. You can purchase voting credits to cast multiple votes for a video. High-vote videos climb the leaderboard and gain more visibility!",
        timestamp: new Date(),
        suggestions: ['View leaderboard', 'How to get credits?']
      };
    }

    if (lower.includes('event') || lower.includes('upcoming')) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "We have several upcoming seminars and workshops! You can view the full 2026 roadmap on our Events page, register for sessions, and download them to your calendar.",
        timestamp: new Date(),
        suggestions: ['View Events page', 'Download calendar']
      };
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: "I'm here to help you with the I Am AI Ready platform! You can ask about recording videos, AR filters, voting, or events. What's on your mind?",
      timestamp: new Date(),
      suggestions: ['Record a video', 'Upcoming events', 'How to vote']
    };
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 1000));
    const response = generateResponse(userMessage.content);
    setIsTyping(false);
    setMessages(prev => [...prev, response]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden p-0 bg-gradient-to-br from-primary to-primary/80"
        size="icon"
      >
        <Avatar src={eliAvatarUrl} alt="Eli" size="sm" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed z-50 shadow-2xl transition-all duration-300 flex flex-col bg-card border-border overflow-hidden",
      isMinimized ? "bottom-6 right-6 w-80 h-14" : "bottom-6 right-6 w-96 h-[550px] max-h-[85vh]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <Avatar src={eliAvatarUrl} alt="Eli" size="header" isSpeaking={isSpeaking} />
          <div>
            <h4 className="font-semibold text-sm">Eli</h4>
            <p className="text-[10px] opacity-80">AI Readiness Guide</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 text-primary-foreground hover:bg-white/10" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? 'Expand' : 'Min'}
          </Button>
          <Button variant="ghost" size="sm" className="h-8 text-primary-foreground hover:bg-white/10" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <ScrollArea className="flex-1 p-4 bg-secondary/5" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex gap-3", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.role === 'assistant' && <Avatar src={eliAvatarUrl} alt="Eli" />}
                  <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm", 
                    message.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-background border border-border rounded-tl-none')}>
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((s, idx) => (
                          <Button key={idx} variant="outline" size="sm" className="text-[10px] h-7 px-2" onClick={() => handleSuggestionClick(s)}>{s}</Button>
                        ))}
                      </div>
                    )}
                    {message.role === 'assistant' && (
                      <Button onClick={() => speakMessage(message.content)} size="icon" variant="ghost" className="mt-1 h-6 w-6" disabled={isSpeaking}>
                        <Volume2 className={cn("h-3.5 w-3.5", isSpeaking && "text-primary animate-pulse")} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar src={eliAvatarUrl} alt="Eli" />
                  <div className="bg-background border border-border rounded-2xl rounded-tl-none px-4 py-2.5">
                    <div className="flex gap-1.5"><span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-75" /><span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce delay-150" /></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-3 border-t border-border flex gap-2 items-center bg-background">
            <Button onClick={toggleListening} size="icon" variant={isListening ? 'destructive' : 'secondary'} className="h-9 w-9 shrink-0"><Mic className="h-4 w-4" /></Button>
            <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Eli anything..." className="flex-1 h-9 text-sm" />
            <Button onClick={handleSend} disabled={!inputValue.trim() || isTyping} className="h-9 px-4 text-sm">Send</Button>
          </div>
        </>
      )}
    </Card>
  );
};

export default EliChatbot;
