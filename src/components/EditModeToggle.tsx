import { useState } from 'react';
import { Pencil, Eye, Globe, X, Check, PanelRightOpen } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useLanguage } from '@/hooks/useLanguage';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function EditModeToggle() {
  const { isEditMode, toggleEditMode, disableEditMode, canEdit, hasUnsavedChanges, isPanelOpen, setIsPanelOpen } = useEditMode();
  const { refreshContent } = useSiteContent();
  const { language, setLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);

  // Don't render for non-admin users
  if (!canEdit) return null;

  const handleSaveAll = async () => {
    setSaving(true);
    await refreshContent();
    setSaving(false);
  };

  const handleExitEditMode = () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm('Saqlanmagan o\'zgarishlar bor. Chiqishni xohlaysizmi?');
      if (!confirm) return;
    }
    disableEditMode();
  };

  // Floating button when not in edit mode
  if (!isEditMode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleEditMode}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-sm font-medium">Tahrirlash</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Sayt kontentini tahrirlash</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Compact floating toolbar in edit mode
  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-2xl border p-1.5 flex items-center gap-1">
          {/* Edit Mode Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 text-amber-600 rounded-lg">
            <Pencil className="h-3.5 w-3.5" />
            <span className="text-xs font-medium hidden sm:inline">Tahrirlash</span>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Language Switcher */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setLanguage('uz')}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1',
                language === 'uz'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Globe className="h-3 w-3" />
              UZ
            </button>
            <button
              onClick={() => setLanguage('ru')}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1',
                language === 'ru'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Globe className="h-3 w-3" />
              RU
            </button>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Save Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Yangilash</p>
            </TooltipContent>
          </Tooltip>

          {/* Preview Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleEditMode}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ko'rish rejimi</p>
            </TooltipContent>
          </Tooltip>

          {/* Panel Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isPanelOpen 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <PanelRightOpen className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Tahrirlash paneli</p>
            </TooltipContent>
          </Tooltip>

          {/* Exit Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleExitEditMode}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Chiqish</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Global editable styles */}
      <style>{`
        [data-editable="true"]:hover {
          outline: 1px dashed hsl(var(--primary) / 0.4) !important;
          outline-offset: 2px;
        }
        [data-editable="true"][data-selected="true"] {
          outline: 2px solid hsl(var(--primary)) !important;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}