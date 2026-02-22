import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  shareToLinkedIn,
  shareToWhatsApp,
  shareToInstagram,
  shareToFacebook,
  shareToSnapchat,
  shareToTwitter,
} from "@/lib/share";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
  hashtags?: string[];
}

const platforms = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "🔗",
    color: "from-blue-600 to-blue-700",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: "💬",
    color: "from-green-500 to-green-600",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📷",
    color: "from-pink-500 to-purple-600",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "f",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: "👻",
    color: "from-yellow-300 to-yellow-400",
  },
  {
    id: "twitter",
    name: "Twitter/X",
    icon: "𝕏",
    color: "from-black to-gray-800",
  },
];

export const ShareModal = ({
  open,
  onOpenChange,
  title,
  url,
  hashtags = [],
}: ShareModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleShare = (platformId: string) => {
    const shareOptions = { title, url, hashtags };

    switch (platformId) {
      case "linkedin":
        shareToLinkedIn(shareOptions);
        break;
      case "whatsapp":
        shareToWhatsApp(shareOptions);
        break;
      case "instagram":
        shareToInstagram(shareOptions);
        break;
      case "facebook":
        shareToFacebook(shareOptions);
        break;
      case "snapchat":
        shareToSnapchat(shareOptions);
        break;
      case "twitter":
        shareToTwitter(shareOptions);
        break;
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="relative w-full max-w-md bg-background border border-border rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-display font-bold text-lg">Share Your Declaration</h2>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-full hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Platform grid */}
              <div className="grid grid-cols-3 gap-3">
                {platforms.map((platform) => (
                  <motion.button
                    key={platform.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShare(platform.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${platform.color} text-white font-semibold transition-all hover:shadow-lg`}
                  >
                    <span className="text-3xl">{platform.icon}</span>
                    <span className="text-xs text-center leading-tight">{platform.name}</span>
                  </motion.button>
                ))}
              </div>

              {/* Copy link section */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Or copy link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    readOnly
                    className="flex-1 px-4 py-2 rounded-xl border border-border bg-muted text-sm text-muted-foreground"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    className="rounded-xl"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
