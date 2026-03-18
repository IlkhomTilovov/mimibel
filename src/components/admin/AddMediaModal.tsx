import { useState } from 'react';
import { Image as ImageIcon, Video, Link2, Upload, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  platform?: 'youtube' | 'instagram';
}

interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedia: (media: MediaItem) => void;
  onUploadImages: () => void;
  uploading?: boolean;
}

// Extract YouTube video ID and generate thumbnail
const parseYouTubeUrl = (url: string): { id: string; thumbnail: string; embedUrl: string } | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\s?]+)/,
    /youtube\.com\/shorts\/([^&\s?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const id = match[1];
      return {
        id,
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${id}`
      };
    }
  }
  return null;
};

// Extract Instagram post ID and generate embed URL
const parseInstagramUrl = (url: string): { id: string; embedUrl: string; thumbnail: string } | null => {
  const patterns = [
    /instagram\.com\/(?:p|reel|tv)\/([^/?]+)/,
    /instagram\.com\/reels\/([^/?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      const id = match[1];
      return {
        id,
        embedUrl: `https://www.instagram.com/p/${id}/embed`,
        thumbnail: `https://www.instagram.com/p/${id}/media/?size=m`
      };
    }
  }
  return null;
};

export function AddMediaModal({ isOpen, onClose, onAddMedia, onUploadImages, uploading }: AddMediaModalProps) {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');

  const handleAddImageUrl = () => {
    if (!imageUrl.trim()) {
      setError('URL kiriting');
      return;
    }
    
    // Basic URL validation
    try {
      new URL(imageUrl);
    } catch {
      setError('Noto\'g\'ri URL format');
      return;
    }

    onAddMedia({
      type: 'image',
      url: imageUrl.trim()
    });
    
    setImageUrl('');
    setError('');
    onClose();
  };

  const handleAddVideoUrl = () => {
    if (!videoUrl.trim()) {
      setError('Video URL kiriting');
      return;
    }

    // Try YouTube first
    const youtubeData = parseYouTubeUrl(videoUrl);
    if (youtubeData) {
      onAddMedia({
        type: 'video',
        url: youtubeData.embedUrl,
        thumbnail: youtubeData.thumbnail,
        platform: 'youtube'
      });
      setVideoUrl('');
      setError('');
      onClose();
      return;
    }

    // Try Instagram
    const instagramData = parseInstagramUrl(videoUrl);
    if (instagramData) {
      onAddMedia({
        type: 'video',
        url: instagramData.embedUrl,
        thumbnail: instagramData.thumbnail,
        platform: 'instagram'
      });
      setVideoUrl('');
      setError('');
      onClose();
      return;
    }

    setError('Faqat YouTube yoki Instagram URL qabul qilinadi');
  };

  const handleClose = () => {
    setImageUrl('');
    setVideoUrl('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Media qo'shish
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'image' | 'video'); setError(''); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Rasm
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-4 mt-4">
            {/* Upload option */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Rasmlarni kompyuterdan yuklang</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  onUploadImages();
                  handleClose();
                }}
                disabled={uploading}
              >
                {uploading ? 'Yuklanmoqda...' : 'Rasm tanlash'}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">yoki</span>
              </div>
            </div>

            {/* URL input */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Rasm URL
              </Label>
              <div className="flex gap-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => { setImageUrl(e.target.value); setError(''); }}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                <Button onClick={handleAddImageUrl} disabled={!imageUrl.trim()}>
                  Qo'shish
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Qo'llab-quvvatlanadigan platformalar:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-600 rounded-md text-xs font-medium">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-pink-600 rounded-md text-xs font-medium">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  Instagram
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video URL
              </Label>
              <div className="flex gap-2">
                <Input
                  value={videoUrl}
                  onChange={(e) => { setVideoUrl(e.target.value); setError(''); }}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1"
                />
                <Button onClick={handleAddVideoUrl} disabled={!videoUrl.trim()}>
                  Qo'shish
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                YouTube yoki Instagram video/reel havolasini kiriting
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <X className="w-4 h-4" />
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
