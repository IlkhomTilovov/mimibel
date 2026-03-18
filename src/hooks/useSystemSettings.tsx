import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemSettings {
  id: string;
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  working_hours_uz: string | null;
  working_hours_ru: string | null;
  address_uz: string | null;
  address_ru: string | null;
  seo_title: string | null;
  seo_description: string | null;
  default_language: string;
  languages_enabled: string[];
  primary_domain: string | null;
  short_description_uz: string | null;
  short_description_ru: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_telegram: string | null;
}

interface SystemSettingsContextType {
  settings: SystemSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  getSiteName: () => string;
  getLogo: () => string | null;
  getFavicon: () => string | null;
  getPrimaryDomain: () => string;
  getSEOTitle: (pageName?: string) => string;
  getSEODescription: () => string;
  getShortDescription: (language: 'uz' | 'ru') => string;
  getAddress: (language: 'uz' | 'ru') => string;
  getWorkingHours: (language: 'uz' | 'ru') => string;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

const defaultSettings: SystemSettings = {
  id: '',
  site_name: '',
  logo_url: null,
  favicon_url: null,
  contact_phone: '',
  whatsapp_number: '',
  working_hours_uz: '',
  working_hours_ru: '',
  address_uz: '',
  address_ru: '',
  seo_title: '',
  seo_description: '',
  default_language: 'uz',
  languages_enabled: ['uz', 'ru'],
  primary_domain: null,
  short_description_uz: '',
  short_description_ru: '',
  social_facebook: null,
  social_instagram: null,
  social_telegram: null,
};

type CachedSiteAssets = {
  logo_url: string | null;
  favicon_url: string | null;
};

const SITE_ASSETS_CACHE_KEY = 'site-assets-cache-v1';

function getAssetVersion(url: string | null | undefined) {
  if (!url) return '0';
  // Use filename as version (it changes on each upload: site-logo-<ts>.*)
  const clean = url.split('#')[0];
  const pathPart = clean.split('?')[0];
  return pathPart.split('/').pop() || '0';
}

function withCacheBuster(url: string, version: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(version)}`;
}

function readCachedSiteAssets(): CachedSiteAssets | null {
  try {
    const raw = localStorage.getItem(SITE_ASSETS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSiteAssets;
    return {
      logo_url: typeof parsed.logo_url === 'string' ? parsed.logo_url : null,
      favicon_url: typeof parsed.favicon_url === 'string' ? parsed.favicon_url : null,
    };
  } catch {
    return null;
  }
}

function writeCachedSiteAssets(value: CachedSiteAssets) {
  try {
    localStorage.setItem(SITE_ASSETS_CACHE_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const cachedAssets = readCachedSiteAssets();

  const [settings, setSettings] = useState<SystemSettings | null>(() => {
    // show cached logo/favicon immediately to avoid "old logo" flash on refresh
    if (!cachedAssets) return null;
    return {
      ...defaultSettings,
      logo_url: cachedAssets.logo_url,
      favicon_url: cachedAssets.favicon_url,
    };
  });

  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        setSettings((prev) => prev ?? defaultSettings);
      } else if (data) {
        const merged = {
          ...defaultSettings,
          ...data,
        } as SystemSettings;
        setSettings(merged);
      } else {
        setSettings((prev) => prev ?? defaultSettings);
      }
    } catch (error) {
      console.error('Error:', error);
      setSettings((prev) => prev ?? defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Persist logo/favicon to localStorage so index.html can set favicon early
  useEffect(() => {
    if (!settings) return;
    writeCachedSiteAssets({
      logo_url: settings.logo_url || null,
      favicon_url: settings.favicon_url || settings.logo_url || null,
    });
  }, [settings?.logo_url, settings?.favicon_url]);

  // Update favicon when settings change — fallback to logo if no favicon set
  useEffect(() => {
    const faviconSrc = settings?.favicon_url || settings?.logo_url;
    if (faviconSrc) {
      updateFavicon(faviconSrc);
    }
  }, [settings?.favicon_url, settings?.logo_url]);

  const updateFavicon = (url: string) => {
    const version = getAssetVersion(url);
    const cacheBustedUrl = withCacheBuster(url, version);

    // Remove existing favicon links
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach((link) => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = cacheBustedUrl;
    document.head.appendChild(link);

    // Also add shortcut icon for older browsers
    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.href = cacheBustedUrl;
    document.head.appendChild(shortcutLink);
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  const getSiteName = () => {
    return settings?.site_name || '';
  };

  const getLogo = () => {
    if (!settings?.logo_url) return null;
    const version = getAssetVersion(settings.logo_url);
    return withCacheBuster(settings.logo_url, version);
  };

  const getFavicon = () => {
    if (!settings?.favicon_url) return null;
    const version = getAssetVersion(settings.favicon_url);
    return withCacheBuster(settings.favicon_url, version);
  };

  const getPrimaryDomain = () => {
    return settings?.primary_domain || window.location.origin;
  };

  const getSEOTitle = (pageName?: string) => {
    const siteTitle = settings?.seo_title || settings?.site_name || '';
    if (pageName && siteTitle) {
      return `${pageName} | ${siteTitle}`;
    }
    return pageName || siteTitle;
  };

  const getSEODescription = () => {
    return settings?.seo_description || '';
  };

  const getShortDescription = (language: 'uz' | 'ru') => {
    if (language === 'ru') {
      return settings?.short_description_ru || settings?.short_description_uz || '';
    }
    return settings?.short_description_uz || '';
  };

  const getAddress = (language: 'uz' | 'ru') => {
    if (language === 'ru') {
      return settings?.address_ru || settings?.address_uz || '';
    }
    return settings?.address_uz || '';
  };

  const getWorkingHours = (language: 'uz' | 'ru') => {
    if (language === 'ru') {
      return settings?.working_hours_ru || settings?.working_hours_uz || '';
    }
    return settings?.working_hours_uz || '';
  };

  // Update document title when settings load — only if real data exists
  useEffect(() => {
    if (settings && !loading) {
      const seoTitle = settings.seo_title || settings.site_name;
      if (seoTitle) {
        document.title = seoTitle;
      }
    }
  }, [settings, loading]);

  return (
    <SystemSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings,
        getSiteName,
        getLogo,
        getFavicon,
        getPrimaryDomain,
        getSEOTitle,
        getSEODescription,
        getShortDescription,
        getAddress,
        getWorkingHours,
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
}
