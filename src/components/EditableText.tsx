import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Check, Loader2 } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useLanguage } from '@/hooks/useLanguage';
import { useAutosave } from '@/hooks/useAutosave';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface EditableTextProps {
  contentKey: string;
  fallback?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  multiline?: boolean;
  section?: string;
  field?: string;
}

export function EditableText({
  contentKey,
  fallback = '',
  as: Component = 'span',
  className = '',
  multiline = false,
  section,
  field,
}: EditableTextProps) {
  const { isEditMode, canEdit, setHasUnsavedChanges } = useEditMode();
  const { getContent, updateContent, loading: contentLoading } = useSiteContent();
  const { language } = useLanguage();

  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const editRef = useRef<HTMLDivElement>(null);

  const currentValue = getContent(contentKey, language, fallback);

  const saveFn = useCallback(async (value: string) => {
    setSaveStatus('saving');
    setHasUnsavedChanges(true);
    const success = await updateContent(contentKey, language, value);
    setSaveStatus(success ? 'saved' : 'idle');
    if (success) {
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus('idle'), 1500);
    }
    return success;
  }, [contentKey, language, updateContent, setHasUnsavedChanges]);

  const { trigger: triggerAutosave } = useAutosave(saveFn, 500);

  const handleInput = useCallback(() => {
    if (editRef.current) {
      const newValue = editRef.current.innerText;
      triggerAutosave(newValue);
    }
  }, [triggerAutosave]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleClick = useCallback(() => {
    if (isEditMode && canEdit) {
      setIsEditing(true);
      // Focus the element after render
      setTimeout(() => {
        if (editRef.current) {
          editRef.current.focus();
          // Place cursor at end
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(editRef.current);
          range.collapse(false);
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
    }
  }, [isEditMode, canEdit]);

  // Update content when it changes externally
  useEffect(() => {
    if (editRef.current && !isEditing) {
      editRef.current.innerText = currentValue;
    }
  }, [currentValue, isEditing]);

  // Handle Enter key for single-line
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      editRef.current?.blur();
    }
  }, [multiline]);

  // Show skeleton while content is loading to prevent flash of default text
  if (contentLoading) {
    return <Skeleton className={cn('inline-block', className, 'min-h-[1em] min-w-[120px]')} />;
  }

  // Not in edit mode or can't edit - render normally
  if (!isEditMode || !canEdit) {
    return <Component className={className}>{currentValue}</Component>;
  }

  // In edit mode - show inline editable element
  return (
    <span
      className="relative inline-block"
      data-editable="true"
      data-section={section}
      data-field={field || contentKey}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={editRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className={cn(
          className,
          'cursor-pointer transition-all duration-200 outline-none min-w-[20px]',
          isEditing
            ? 'ring-2 ring-primary ring-offset-2 rounded bg-primary/10 cursor-text'
            : isHovered
              ? 'ring-2 ring-primary/50 ring-offset-2 rounded bg-primary/5'
              : ''
        )}
        role="textbox"
        tabIndex={0}
      >
        {currentValue || <span className="text-muted-foreground italic">Matn kiriting...</span>}
      </div>

      {/* Status indicator */}
      <span
        className={cn(
          'absolute -top-2 -right-2 p-1 rounded-full shadow-lg transition-all duration-200 z-10',
          saveStatus === 'saving'
            ? 'bg-accent text-accent-foreground opacity-100 scale-100'
            : saveStatus === 'saved'
              ? 'bg-primary text-primary-foreground opacity-100 scale-100'
              : isHovered || isEditing
                ? 'bg-primary text-primary-foreground opacity-100 scale-100'
                : 'opacity-0 scale-90 pointer-events-none bg-primary text-primary-foreground'
        )}
      >
        {saveStatus === 'saving' ? (
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
        ) : saveStatus === 'saved' ? (
          <Check className="h-2.5 w-2.5" />
        ) : (
          <Pencil className="h-2.5 w-2.5" />
        )}
      </span>
    </span>
  );
}
