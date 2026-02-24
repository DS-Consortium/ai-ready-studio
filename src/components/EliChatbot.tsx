import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Mic, Volume2, X, Minus, Maximize2, Send, Sparkles, Zap, Calendar, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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
  content: "Hi! I'm Eli, your AI Readiness guide. I'm here to help you navigate the 'Are You AI Ready?' campaign, understand our DSC Filters, and explore the Knowledge Lab. How can I assist you today?",
  timestamp: new Date(),
  suggestions: [
    'How do I record a video?',
    'What are DSC Filters?',
    'Tell me about the prizes',
    'How do I earn voting credits?'
  ]
};

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
    header:  "w-12 h-12"
  }[size];

  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden shrink-0 border-2 border-background shadow-md",
      sizeClasses,
      isSpeaking && "animate-pulse border-primary/60 ring-4 ring-primary/20"
    )}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/bottts/svg?seed=Eli";
        }}
      />
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="w-6 h-6 rounded-full bg-primary/40 animate-ping" />
        </div>
      )}
    </div>
  );
};

export const EliChatbot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      toast.error("Voice input is not supported in your browser.");
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
        content: `Welcome back, ${name}! Ready to make your AI declaration today? I can help you pick a DSC filter or show you how to earn more voting credits.`,
        timestamp: new Date(),
        suggestions: [
          'Pick a DSC Filter',
          'How to earn credits',
          'View my dashboard',
          'See top leaders'
        ]
      };
      setMessages([INITIAL_MESSAGE, welcomeMsg]);
    }
  }, [user, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const generateResponse = (input: string): Message => {
    const lower = input.toLowerCase();
    
    if (lower.includes('record') || lower.includes('video') || lower.includes('create')) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "To record your declaration, click the 'Create Your Video' button on the home page or go directly to the Record page. You'll be able to choose from our 8 DSC Filters!",
        timestamp: new Date(),
        suggestions: ['Go to Record page', 'What are DSC Filters?']
      };
    }

    if (lower.includes('filter')) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "We have 8 unique DSC Filters (like AI Savvy, AI Driven, etc.) that add AR-style text overlays to your video. You can scroll through them at the bottom of the camera screen.",
        timestamp: new Date(),
        suggestions: ['Show me all filters', 'How do they work?']
      };
    }

    if (lower.includes('credit') || lower.includes('vote') || lower.includes('paid')) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Our gaming-style voting system allows you to use credits to support your favorite leaders. You can earn credits by completing your own declaration or purchase 'Power Votes' to boost someone's rank!",
        timestamp: new Date(),
        suggestions: ['Buy credits', 'How to vote?']
      };
    }

    if (lower.includes('prize') || lower.includes('reward')) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "The top leaders on our leaderboard win exclusive prizes, including full scholarships to our Masterclasses and featured spots in the DS Knowledge Lab!",
        timestamp: new Date(),
        suggestions: ['View Leaderboard', 'See Prizes']
      };
    }

    if (lower.includes('seminar') || lower.includes('event')) {
      return {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "We have 14 upcoming seminars across Dubai, Nairobi, Riyadh, and more! You can see the full list on our Events page: https://legroupeds.com/events",
        timestamp: new Date(),
        suggestions: ['Upcoming Seminars', 'Knowledge Lab']
      };
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: "I'm Eli, and I'm here to help you become AI Ready! You can ask me about recording videos, our DSC filters, the voting system, or upcoming events at DS Consortium.",
      timestamp: new Date(),
      suggestions: ['Record a video', 'How to vote?', 'Upcoming events']
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
    
    if (response.content.length < 150) {
      speakMessage(response.content);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSend(), 100);
  };

  if (!isOpen) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-[2rem] bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:shadow-primary/30 transition-all border-4 border-background"
      >
        <Avatar src={eliAvatarUrl} alt="Eli" size="default" />
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={cn(
          "fixed z-50 shadow-2xl transition-all duration-300 flex flex-col overflow-hidden border border-primary/20 rounded-[2.5rem] bg-background/95 backdrop-blur-2xl",
          isMinimized 
            ? "bottom-6 right-6 w-72 h-16" 
            : "bottom-6 right-6 w-[400px] h-[620px] max-h-[90vh]"
        )}
      >
        <div className="flex items-center justify-between p-6 bg-primary text-primary-foreground">
          <div className="flex items-center gap-4">
            <Avatar src={eliAvatarUrl} alt="Eli" size="header" isSpeaking={isSpeaking} />
            <div>
              <h4 className="font-display font-black text-lg leading-none">Eli</h4>
              <p className="text-[10px] opacity-80 mt-1 uppercase tracking-[0.2em] font-black">AI Readiness Guide</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-primary-foreground hover:bg-white/10 rounded-xl" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <Maximize2 className="h-5 h-5" /> : <Minus className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-primary-foreground hover:bg-white/10 rounded-xl" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            <ScrollArea className="flex-1 p-6 bg-muted/20" ref={scrollRef}>
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={cn("flex gap-4", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {message.role === 'assistant' && <Avatar src={eliAvatarUrl} alt="Eli" size="sm" />}
                    <div className={cn(
                      "max-w-[85%] rounded-[1.5rem] px-5 py-3 text-sm shadow-sm font-medium leading-relaxed", 
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-card text-foreground rounded-tl-none border border-border'
                    )}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {message.suggestions.map((s, i) => (
                            <button 
                              key={i} 
                              onClick={() => handleSuggestionClick(s)} 
                              className="text-[10px] bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 transition-colors font-bold uppercase tracking-wider"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/10">
                           <button onClick={() => speakMessage(message.content)} className="text-primary/60 hover:text-primary transition-colors" disabled={isSpeaking}>
                             <Volume2 className={cn("h-4 w-4", isSpeaking && "animate-pulse")} />
                           </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-4">
                    <Avatar src={eliAvatarUrl} alt="Eli" size="sm" />
                    <div className="bg-card border border-border rounded-[1.5rem] rounded-tl-none px-5 py-4 shadow-sm">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Quick Actions Bar */}
            <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-card/50">
               <button onClick={() => handleSuggestionClick("Upcoming Seminars")} className="whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted/80">
                 <Calendar className="h-3 w-3 text-primary" /> Events
               </button>
               <button onClick={() => handleSuggestionClick("DSC Filters")} className="whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted/80">
                 <Sparkles className="h-3 w-3 text-primary" /> Filters
               </button>
               <button onClick={() => handleSuggestionClick("Knowledge Lab")} className="whitespace-nowrap flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted/80">
                 <BookOpen className="h-3 w-3 text-primary" /> Lab
               </button>
            </div>

            <div className="p-6 bg-card border-t border-border flex gap-3 items-center">
              <Button onClick={toggleListening} size="icon" variant={isListening ? 'destructive' : 'outline'} className="h-12 w-12 shrink-0 rounded-2xl border-border">
                <Mic className={cn("h-6 w-6", isListening && "animate-pulse")} />
              </Button>
              <div className="relative flex-1">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask Eli anything..."
                  className="w-full h-12 rounded-2xl border-border focus-visible:ring-primary pr-12 font-medium"
                />
                <Button 
                  onClick={handleSend} 
                  disabled={!inputValue.trim() || isTyping} 
                  size="icon" 
                  className="absolute right-1 top-1 h-10 w-10 rounded-xl"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
