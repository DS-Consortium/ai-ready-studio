import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, QrCode, Share2 } from "lucide-react";
import { Share } from '@capacitor/share';
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
  size?: number;
}

const QRCodeGenerator = ({ url, title = "Scan to view", size = 200 }: QRCodeGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const downloadQRCode = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = size * 2;
    canvas.height = size * 2;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-code-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const shareQRCode = async () => {
    try {
      await Share.share({
        title: title,
        text: `Check out this link for ${title}:`,
        url: url,
        dialogTitle: 'Share Link',
      });
    } catch (error) {
      // Fallback to clipboard if share fails or is cancelled
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="h-4 w-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-6">
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-2xl shadow-lg"
          >
            <QRCodeSVG
              value={url}
              size={size}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#0a1628"
            />
          </div>
          
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Scan this QR code to open the link or download to share
          </p>
          
          <div className="flex gap-3">
            <Button onClick={downloadQRCode} className="gap-2">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={shareQRCode} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share Link
            </Button>
          </div>
          
          <div className="w-full">
            <p className="text-xs text-muted-foreground mb-2">Link:</p>
            <code className="block w-full p-3 bg-muted rounded-lg text-xs break-all">
              {url}
            </code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeGenerator;
