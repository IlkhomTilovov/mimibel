import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface ContentItem {
  id: string;
  key: string;
  value_uz: string | null;
  value_ru: string | null;
  content_type: string | null;
  page: string | null;
  section: string | null;
}

interface ContentUpdateEvent {
  type: 'content-update';
  key: string;
  language: 'uz' | 'ru';
  value: string;
  timestamp: number;
}

interface SiteContentContextType {
  content: Record<string, ContentItem>;
  loading: boolean;
  getContent: (key: string, language: 'uz' | 'ru', fallback?: string) => string;
  updateContent: (key: string, language: 'uz' | 'ru', value: string) => Promise<boolean>;
  refreshContent: () => Promise<void>;
  lastUpdate: ContentUpdateEvent | null;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

// Notify parent window about content updates (for iframe communication)
const notifyParentWindow = (event: ContentUpdateEvent) => {
  try {
    // Check if we're in an iframe
    if (window.parent !== window) {
      window.parent.postMessage(event, '*');
    }
  } catch (error) {
    console.log('Could not notify parent window:', error);
  }
};

// Notify iframe about content sync request
export const notifyIframeRefresh = () => {
  try {
    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'content-refresh' }, '*');
    }
  } catch (error) {
    console.log('Could not notify iframe:', error);
  }
};

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Record<string, ContentItem>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<ContentUpdateEvent | null>(null);
  const { toast } = useToast();

  const fetchContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*');

      if (error) throw error;

      const contentMap: Record<string, ContentItem> = {};
      data?.forEach((item) => {
        contentMap[item.key] = item;
      });
      setContent(contentMap);
    } catch (error) {
      console.error('Error fetching site content:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Listen for messages from parent (when in iframe) or from iframe (when parent)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle refresh request from parent
      if (event.data?.type === 'content-refresh') {
        console.log('Received refresh request from parent');
        fetchContent();
      }
      
      // Handle content update from iframe (when we're the parent/admin panel)
      if (event.data?.type === 'content-update') {
        console.log('Received content update from iframe:', event.data);
        setLastUpdate(event.data as ContentUpdateEvent);
        
        // Update local content state
        const { key, language, value } = event.data;
        const updateField = language === 'uz' ? 'value_uz' : 'value_ru';
        
        setContent((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            id: prev[key]?.id || key,
            key,
            [updateField]: value,
            value_uz: language === 'uz' ? value : prev[key]?.value_uz || null,
            value_ru: language === 'ru' ? value : prev[key]?.value_ru || null,
            content_type: prev[key]?.content_type || 'text',
            page: prev[key]?.page || null,
            section: prev[key]?.section || null,
          },
        }));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchContent]);

  const getContent = useCallback((key: string, language: 'uz' | 'ru', fallback: string = '') => {
    const item = content[key];
    if (!item) return fallback;
    const value = language === 'uz' ? item.value_uz : item.value_ru;
    return value || fallback;
  }, [content]);

  const updateContent = useCallback(async (key: string, language: 'uz' | 'ru', value: string): Promise<boolean> => {
    try {
      const updateField = language === 'uz' ? 'value_uz' : 'value_ru';
      
      const { error } = await supabase
        .from('site_content')
        .upsert(
          {
            key,
            [updateField]: value,
            content_type: 'text',
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      // Update local state
      setContent((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          id: prev[key]?.id || key,
          key,
          [updateField]: value,
          value_uz: language === 'uz' ? value : prev[key]?.value_uz || null,
          value_ru: language === 'ru' ? value : prev[key]?.value_ru || null,
          content_type: prev[key]?.content_type || 'text',
          page: prev[key]?.page || null,
          section: prev[key]?.section || null,
        },
      }));

      // Notify parent window about the update (for iframe communication)
      const updateEvent: ContentUpdateEvent = {
        type: 'content-update',
        key,
        language,
        value,
        timestamp: Date.now(),
      };
      setLastUpdate(updateEvent);
      notifyParentWindow(updateEvent);

      toast({ title: 'Saqlandi', description: 'Kontent muvaffaqiyatli yangilandi' });
      return true;
    } catch (error: any) {
      console.error('Error updating content:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
      return false;
    }
  }, [content, toast]);

  const refreshContent = useCallback(async () => {
    setLoading(true);
    await fetchContent();
  }, [fetchContent]);

  return (
    <SiteContentContext.Provider value={{ content, loading, getContent, updateContent, refreshContent, lastUpdate }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);
  if (context === undefined) {
    throw new Error('useSiteContent must be used within a SiteContentProvider');
  }
  return context;
}