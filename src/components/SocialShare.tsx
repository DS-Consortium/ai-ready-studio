import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Check, MessageCircle, Linkedin, Instagram, Send } from "lucide-react";

interface SocialShareProps {
  videoUrl: string;
  videoTitle: string;
  filterName?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const SocialShare = ({
  videoUrl,
  videoTitle,
  filterName,
  className,
  variant = "ghost",
  size = "sm",
}: SocialShareProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const shareText = filterName
    ? `I just declared "${filterName}" on I Am AI Ready! Join the movement and share your AI journey. 🚀 #IAmAIReady #AITransformation`
    : `Check out my AI Ready declaration! Join the movement. 🚀 #IAmAIReady`;

  const encodedUrl = encodeURIComponent(videoUrl);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-500 hover:bg-green-600",
      url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      color: "bg-blue-600 hover:bg-blue-700",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600",
      // Instagram doesn't have direct share URL - we'll copy to clipboard
      action: "copy",
    },
    {
      name: "Snapchat",
      icon: Send,
      color: "bg-yellow-400 hover:bg-yellow-500 text-black",
      url: `https://www.snapchat.com/share?url=${encodedUrl}`,
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${videoUrl}`);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard. Paste it on Instagram!",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (link: (typeof shareLinks)[0]) => {
    if (link.action === "copy") {
      copyToClipboard();
    } else if (link.url) {
      window.open(link.url, "_blank", "noopener,noreferrer");
    }
  };

  // Native share API for mobile
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: videoTitle,
          text: shareText,
          url: videoUrl,
        });
        toast({
          title: "Shared!",
          description: "Your declaration has been shared.",
        });
        setOpen(false);
      } catch (error) {
        // User cancelled or error
        console.log("Share cancelled");
      }
    } else {
      setOpen(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNativeShare();
          }}
        >
          <Share2 className="h-4 w-4" />
          {size !== "icon" && <span className="ml-2">Share</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your declaration</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share text preview */}
          <div className="bg-muted rounded-xl p-4">
            <p className="text-sm">{shareText}</p>
            <p className="text-xs text-primary mt-2 truncate">{videoUrl}</p>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            {shareLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleShare(link)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-all ${link.color}`}
              >
                <link.icon className="h-5 w-5" />
                {link.name}
              </button>
            ))}
          </div>

          {/* Copy link */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-muted rounded-xl p-3">
              <input
                type="text"
                value={videoUrl}
                readOnly
                className="flex-1 bg-transparent text-sm outline-none truncate"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="flex-shrink-0"
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
      </DialogContent>
    </Dialog>
  );
};
