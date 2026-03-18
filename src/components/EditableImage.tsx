import { useState } from 'react';
import { Pencil, Image as ImageIcon } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import { useSiteContent } from '@/hooks/useSiteContent';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface EditableImageProps {
  contentKey: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  section?: string;
  aspectRatio?: 'auto' | 'square' | 'video' | 'wide';
}

export function EditableImage({
  contentKey,
  fallbackSrc,
  alt,
  className = '',
  wrapperClassName = '',
  section,
  aspectRatio = 'auto',
}: EditableImageProps) {
  const { isEditMode, canEdit, selectElement, selectedElement } = useEditMode();
  const { getContent, loading: contentLoading } = useSiteContent();
  
  const [isHovered, setIsHovered] = useState(false);

  // Get image URL from content or use fallback
  const currentSrc = getContent(contentKey, 'uz', '') || fallbackSrc;
  const isSelected = selectedElement?.contentKey === contentKey;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectElement({
      type: 'image',
      contentKey,
      section,
      currentValue: currentSrc,
      fallback: fallbackSrc,
    });
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square': return 'aspect-square';
      case 'video': return 'aspect-video';
      case 'wide': return 'aspect-[21/9]';
      default: return '';
    }
  };

  // Show skeleton while content is loading
  if (contentLoading) {
    return (
      <div className={cn(wrapperClassName, getAspectRatioClass())}>
        <Skeleton className={cn(className, 'w-full h-full')} />
      </div>
    );
  }

  // Not in edit mode - render normally
  if (!isEditMode || !canEdit) {
    return (
      <div className={cn(wrapperClassName, getAspectRatioClass())}>
        <img 
          src={currentSrc} 
          alt={alt} 
          className={className}
        />
      </div>
    );
  }

  // In edit mode
  return (
    <div 
      className={cn(
        'relative group cursor-pointer',
        wrapperClassName,
        getAspectRatioClass()
      )}
      data-editable="true"
      data-selected={isSelected ? "true" : undefined}
      data-section={section}
      data-field={contentKey}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <img 
        src={currentSrc} 
        alt={alt} 
        className={cn(
          className,
          'transition-all duration-200',
          isSelected 
            ? 'ring-2 ring-primary ring-offset-2 rounded-lg' 
            : isHovered 
              ? 'ring-2 ring-primary/50 ring-offset-2 rounded-lg brightness-90' 
              : ''
        )}
      />
      
      {/* Overlay with edit icon */}
      <div 
        className={cn(
          'absolute inset-0 flex items-center justify-center transition-all duration-200 pointer-events-none',
          (isHovered || isSelected) ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="bg-primary/90 text-primary-foreground rounded-full p-3 shadow-xl">
          <Pencil className="h-5 w-5" />
        </div>
      </div>

      {/* Badge */}
      <div 
        className={cn(
          'absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full shadow-lg transition-all duration-200 flex items-center gap-1 pointer-events-none',
          (isHovered || isSelected) ? 'opacity-100' : 'opacity-0'
        )}
      >
        <ImageIcon className="h-3 w-3" />
        <span className="hidden sm:inline">Rasm</span>
      </div>
    </div>
  );
}