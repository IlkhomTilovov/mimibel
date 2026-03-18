import { useState } from 'react';
import { Pencil, ExternalLink } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface EditableLinkProps {
  contentKey: string;
  fallback?: string;
  className?: string;
  children: React.ReactNode;
  section?: string;
  target?: string;
  rel?: string;
}

export function EditableLink({
  contentKey,
  fallback = '#',
  className = '',
  children,
  section,
  target = '_blank',
  rel = 'noopener noreferrer',
}: EditableLinkProps) {
  const { isEditMode, canEdit, selectElement, selectedElement } = useEditMode();
  const { getContent } = useSiteContent();
  const { language } = useLanguage();
  
  const [isHovered, setIsHovered] = useState(false);

  const currentValue = getContent(contentKey, language, fallback);
  const isSelected = selectedElement?.contentKey === contentKey;

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode && canEdit) {
      e.preventDefault();
      e.stopPropagation();
      selectElement({
        type: 'link',
        contentKey,
        section,
        currentValue,
        fallback,
        multiline: false,
      });
    }
  };

  // Not in edit mode or can't edit - render normally
  if (!isEditMode || !canEdit) {
    const href = currentValue || fallback;
    if (!href || href === '#') {
      return <span className={className}>{children}</span>;
    }
    return (
      <a 
        href={href} 
        target={target} 
        rel={rel} 
        className={className}
      >
        {children}
      </a>
    );
  }

  // In edit mode - show editable element
  return (
    <span 
      className="relative inline-block"
      data-editable="true"
      data-editable-type="link"
      data-selected={isSelected ? "true" : undefined}
      data-section={section}
      data-field={contentKey}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a 
        href="#"
        onClick={handleClick}
        className={cn(
          className, 
          'cursor-pointer transition-all duration-200',
          isSelected 
            ? 'ring-2 ring-primary ring-offset-2 rounded-full bg-primary/20' 
            : isHovered 
              ? 'ring-2 ring-primary/50 ring-offset-2 rounded-full bg-primary/10' 
              : ''
        )}
      >
        {children}
      </a>
      
      {/* Edit icon on hover */}
      <button
        onClick={handleClick}
        className={cn(
          'absolute -top-1 -right-1 p-1 bg-primary text-primary-foreground rounded-full shadow-lg transition-all duration-200 z-10',
          (isHovered || isSelected) ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
        )}
        title="Havolani tahrirlash"
      >
        <ExternalLink className="h-2.5 w-2.5" />
      </button>
      
      {/* Show current URL hint */}
      {(isHovered || isSelected) && currentValue && currentValue !== '#' && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-background text-foreground text-xs px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-20 border">
          {currentValue.length > 30 ? currentValue.substring(0, 30) + '...' : currentValue}
        </div>
      )}
    </span>
  );
}
