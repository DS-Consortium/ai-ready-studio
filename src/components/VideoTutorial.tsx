import React, { useState } from 'react';
import { Play, X, Info, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const VideoTutorial = () => {
  const [isOpen, setIsOpen] = useState(false);

  const steps = [
    {
      title: "Choose Your Identity",
      description: "Select one of the 8 DSC Filters that best represents your role in the AI future.",
      icon: <CheckCircle2 className="text-filter-savvy" size={20} />
    },
    {
      title: "Follow the Prompt",
      description: "Each filter comes with a unique prompt. Use it to share your vision and declaration.",
      icon: <CheckCircle2 className="text-filter-accountable" size={20} />
    },
    {
      title: "Record & Share",
      description: "Record a short 30-60 second video. Once done, share it instantly to your network.",
      icon: <CheckCircle2 className="text-filter-driven" size={20} />
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
                {/* Video Placeholder */}
                <div className="relative w-full md:w-3/5 bg-black aspect-video md:aspect-auto flex items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                  <div className="z-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 mx-auto border border-primary/40 group-hover:scale-110 transition-transform cursor-pointer">
                      <Play className="text-primary fill-primary ml-1" size={32} />
                    </div>
                    <p className="text-white font-medium">Click to Play Tutorial Video</p>
                  </div>
                  {/* Close button for mobile */}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/40 text-white md:hidden"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Instructions */}
                <div className="w-full md:w-2/5 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold font-display">How it Works</h2>
                      <button 
                        onClick={() => setIsOpen(false)}
                        className="hidden md:block p-1 hover:bg-secondary rounded-md transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-8">
                      {steps.map((step, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="mt-1">{step.icon}</div>
                          <div>
                            <h3 className="font-semibold text-foreground">{step.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-10">
                    <Button className="w-full rounded-xl py-6 text-lg" onClick={() => setIsOpen(false)}>
                      Got it, let's go!
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
