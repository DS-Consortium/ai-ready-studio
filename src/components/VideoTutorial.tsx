import React, { useState } from 'react';
import { Play, X, CheckCircle2, Sparkles, Video, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const VideoTutorial = () => {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      title: "Choose Your Identity",
      description: "Select one of the 8 DSC Filters that best represents your role in the AI future.",
      icon: <Sparkles className="text-primary" size={20} />
    },
    {
      title: "Record 30s Video",
      description: "Declare your readiness and vision for AI using our native camera view.",
      icon: <Video className="text-primary" size={20} />
    },
    {
      title: "Share & Inspire",
      description: "Post to LinkedIn or WhatsApp and join the global AI readiness movement.",
      icon: <Share2 className="text-primary" size={20} />
    }
  ];

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setIsOpen(true)}
        className="min-w-[200px] rounded-xl border-white/30 bg-white/5 text-base text-white hover:bg-white/10 hover:text-white"
      >
        <Play className="h-4 w-4 mr-2" />
        Watch Tutorial
      </Button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-background border border-border rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col md:flex-row h-full">
                {/* Animated Tutorial Area */}
                <div className="relative w-full md:w-3/5 bg-neutral-900 aspect-video md:aspect-auto flex items-center justify-center overflow-hidden">
                  <motion.div 
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-filter-savvy/40"
                  />
                  
                  <div className="relative z-20 text-center p-8">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center mb-6 mx-auto border border-white/20"
                    >
                      <Play className="text-white fill-white ml-1" size={32} />
                    </motion.div>
                    <p className="text-white/60 text-xs font-mono tracking-widest uppercase mb-2">Campaign Tutorial</p>
                    <h3 className="text-white text-2xl font-display font-bold">Master the AI Declaration</h3>
                  </div>

                  {/* UI Overlay Simulation */}
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white/60 text-[10px] font-mono">00:15 REC</span>
                  </div>
                  
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 text-white md:hidden"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Instructions */}
                <div className="w-full md:w-2/5 p-8 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-2xl font-bold font-display text-black">How it Works</h2>
                      <button 
                        onClick={() => setIsOpen(false)}
                        className="hidden md:block p-1 hover:bg-secondary rounded-md transition-colors"
                      >
                        <X size={24} className="text-black" />
                      </button>
                    </div>

                    <div className="space-y-8">
                      {steps.map((step, idx) => (
                        <motion.div 
                          key={idx} 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex gap-4"
                        >
                          <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            {step.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-black">{step.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10">
                    <Button className="w-full rounded-xl py-6 text-lg" onClick={() => setIsOpen(false)}>
                      Start Creating
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
