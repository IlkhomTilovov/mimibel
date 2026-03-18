import { X, GripVertical, Play, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MediaItem } from './AddMediaModal';

interface MediaGridProps {
  items: MediaItem[];
  onRemove: (index: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export function MediaGrid({ items, onRemove, onMove }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <div className="flex justify-center gap-4 mb-3">
          <ImageIcon className="w-8 h-8 text-muted-foreground" />
          <Video className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">
          Hech qanday media qo'shilmagan
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          "+ Media qo'shish" tugmasini bosib rasm yoki video qo'shing
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div 
          key={`${item.url}-${index}`} 
          className={cn(
            "relative group rounded-lg overflow-hidden border",
            item.type === 'video' && "ring-2 ring-primary/30"
          )}
        >
          {/* Media preview */}
          <div className="aspect-square bg-muted">
            {item.type === 'image' ? (
              <img
                src={item.url}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxyZWN0IHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgeD0iMyIgeT0iMyIgcng9IjIiIHJ5PSIyIi8+PGNpcmNsZSBjeD0iOC41IiBjeT0iOC41IiByPSIxLjUiLz48cG9seWxpbmUgcG9pbnRzPSIyMSAxNSAxNiAxMCA1IDIxIi8+PC9zdmc+';
                }}
              />
            ) : (
              <div className="relative w-full h-full">
                <img
                  src={item.thumbnail || ''}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Video overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-black ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {index === 0 && (
              <Badge variant="secondary" className="text-xs">
                Asosiy
              </Badge>
            )}
            {item.type === 'video' && (
              <Badge 
                className={cn(
                  "text-xs",
                  item.platform === 'youtube' 
                    ? "bg-red-500 hover:bg-red-600" 
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                )}
              >
                {item.platform === 'youtube' ? 'YouTube' : 'Instagram'}
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {index > 0 && (
              <Button 
                variant="secondary" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => onMove(index, index - 1)}
                title="Yuqoriga ko'chirish"
              >
                <GripVertical className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="destructive" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => onRemove(index)}
              title="O'chirish"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Type indicator */}
          <div className="absolute bottom-2 right-2">
            {item.type === 'image' ? (
              <div className="p-1.5 rounded-full bg-black/50">
                <ImageIcon className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className="p-1.5 rounded-full bg-black/50">
                <Video className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
