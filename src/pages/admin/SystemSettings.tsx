import { useEffect, useState, useRef } from 'react';
import { Save, Globe, Phone, Search, Settings2, Upload, X, Link as LinkIcon, Image, Share2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSystemSettings } from '@/hooks/useSystemSettings';

interface SystemSettingsData {
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

const defaultSettings: Omit<SystemSettingsData, 'id'> = {
  site_name: 'Mebel Store',
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
  social_facebook: '',
  social_instagram: '',
  social_telegram: '',
};

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsData | null>(null);
  const [formData, setFormData] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { refreshSettings } = useSystemSettings();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const settingsData = data as any;
        setSettings(settingsData as SystemSettingsData);
        setFormData({
          site_name: settingsData.site_name || '',
          logo_url: settingsData.logo_url,
          favicon_url: settingsData.favicon_url || null,
          contact_phone: settingsData.contact_phone || '',
          whatsapp_number: settingsData.whatsapp_number || '',
          working_hours_uz: settingsData.working_hours_uz || '',
          working_hours_ru: settingsData.working_hours_ru || '',
          address_uz: settingsData.address_uz || '',
          address_ru: settingsData.address_ru || '',
          seo_title: settingsData.seo_title || '',
          seo_description: settingsData.seo_description || '',
          default_language: settingsData.default_language || 'uz',
          languages_enabled: settingsData.languages_enabled || ['uz', 'ru'],
          primary_domain: settingsData.primary_domain || null,
          short_description_uz: settingsData.short_description_uz || '',
          short_description_ru: settingsData.short_description_ru || '',
          social_facebook: settingsData.social_facebook || '',
          social_instagram: settingsData.social_instagram || '',
          social_telegram: settingsData.social_telegram || '',
        });
        setLogoPreview(settingsData.logo_url);
        setFaviconPreview(settingsData.favicon_url);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Sozlamalarni yuklashda xatolik' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Faqat SVG, PNG, JPG formatlar qo\'llab-quvvatlanadi' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Fayl hajmi 2MB dan katta bo\'lmasligi kerak' });
      return;
    }

    setUploadingLogo(true);
    try {
      if (formData.logo_url) {
        const oldPath = formData.logo_url.split('/').pop();
        if (oldPath && oldPath.startsWith('site-logo')) {
          await supabase.storage.from('product-images').remove([`logos/${oldPath}`]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `site-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      const newLogoUrl = urlData.publicUrl;
      setFormData({ ...formData, logo_url: newLogoUrl });
      setLogoPreview(newLogoUrl);
      toast({ title: 'Muvaffaqiyat', description: 'Logo yuklandi' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message || 'Logoni yuklashda xatolik' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/svg+xml', 'image/png', 'image/x-icon', 'image/vnd.microsoft.icon'];
    if (!validTypes.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Faqat SVG, PNG, ICO formatlar qo\'llab-quvvatlanadi' });
      return;
    }

    if (file.size > 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Fayl hajmi 1MB dan katta bo\'lmasligi kerak' });
      return;
    }

    setUploadingFavicon(true);
    try {
      if (formData.favicon_url) {
        const oldPath = formData.favicon_url.split('/').pop();
        if (oldPath && oldPath.startsWith('site-favicon')) {
          await supabase.storage.from('product-images').remove([`favicons/${oldPath}`]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `site-favicon-${Date.now()}.${fileExt}`;
      const filePath = `favicons/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      const newFaviconUrl = urlData.publicUrl;
      setFormData({ ...formData, favicon_url: newFaviconUrl });
      setFaviconPreview(newFaviconUrl);
      toast({ title: 'Muvaffaqiyat', description: 'Favicon yuklandi' });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message || 'Faviconni yuklashda xatolik' });
    } finally {
      setUploadingFavicon(false);
    }
  };

  const removeLogo = async () => {
    if (formData.logo_url) {
      try {
        const oldPath = formData.logo_url.split('/').pop();
        if (oldPath && oldPath.startsWith('site-logo')) {
          await supabase.storage.from('product-images').remove([`logos/${oldPath}`]);
        }
      } catch (error) {
        console.error('Error removing logo:', error);
      }
    }
    setFormData({ ...formData, logo_url: null });
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const removeFavicon = async () => {
    if (formData.favicon_url) {
      try {
        const oldPath = formData.favicon_url.split('/').pop();
        if (oldPath && oldPath.startsWith('site-favicon')) {
          await supabase.storage.from('product-images').remove([`favicons/${oldPath}`]);
        }
      } catch (error) {
        console.error('Error removing favicon:', error);
      }
    }
    setFormData({ ...formData, favicon_url: null });
    setFaviconPreview(null);
    if (faviconInputRef.current) faviconInputRef.current.value = '';
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      if (settings) {
        const { error } = await supabase
          .from('system_settings')
          .update(formData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('system_settings')
          .insert([formData]);
        if (error) throw error;
      }

      if (formData.seo_title || formData.site_name) {
        document.title = formData.seo_title || formData.site_name;
      }

      await refreshSettings();
      toast({ title: 'Muvaffaqiyat', description: 'Sozlamalar saqlandi' });
      fetchSettings();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Xatolik', description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    const enabled = formData.languages_enabled.includes(lang);
    if (enabled && formData.languages_enabled.length === 1) {
      toast({ variant: 'destructive', title: 'Xatolik', description: 'Kamida bitta til faol bo\'lishi kerak' });
      return;
    }
    setFormData({
      ...formData,
      languages_enabled: enabled
        ? formData.languages_enabled.filter((l) => l !== lang)
        : [...formData.languages_enabled, lang],
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tizim sozlamalari</h1>
          <p className="text-muted-foreground">Saytning asosiy sozlamalari</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Umumiy
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <Phone className="h-4 w-4" />
            Aloqa
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="h-4 w-4" />
            Ijtimoiy
          </TabsTrigger>
          <TabsTrigger value="language" className="gap-2">
            <Globe className="h-4 w-4" />
            Tillar
          </TabsTrigger>
          <TabsTrigger value="domain" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Domen
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Umumiy sozlamalar</CardTitle>
              <CardDescription>Saytning asosiy ma'lumotlari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Site Name */}
              <div className="space-y-2">
                <Label>Sayt nomi</Label>
                <Input
                  value={formData.site_name}
                  onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                  placeholder="Mebel Store"
                />
                <p className="text-xs text-muted-foreground">
                  Bu nom header, footer, SEO va brauzer sarlavhasida ishlatiladi
                </p>
              </div>

              {/* Short Description */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Qisqa tavsif (UZ)</Label>
                  <Textarea
                    value={formData.short_description_uz || ''}
                    onChange={(e) => setFormData({ ...formData, short_description_uz: e.target.value })}
                    placeholder="Kompaniya haqida qisqacha..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qisqa tavsif (RU)</Label>
                  <Textarea
                    value={formData.short_description_ru || ''}
                    onChange={(e) => setFormData({ ...formData, short_description_ru: e.target.value })}
                    placeholder="Краткое описание компании..."
                    rows={2}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Bu tavsif footerda ko'rinadi</p>

              {/* Logo Upload */}
              <div className="space-y-3">
                <Label>Sayt logosi</Label>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <div className="border rounded-lg p-4 bg-muted/50 inline-flex items-center justify-center min-w-[200px] min-h-[80px]">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="max-h-20 max-w-[200px] object-contain"
                        onError={() => setLogoPreview(null)}
                      />
                    </div>
                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={removeLogo}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-muted/20">
                    <Image className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">Logo yuklanmagan</p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input ref={logoInputRef} type="file" accept=".svg,.png,.jpg,.jpeg" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
                  <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingLogo ? 'Yuklanmoqda...' : 'Logo yuklash'}
                  </Button>
                  <span className="text-xs text-muted-foreground">SVG, PNG, JPG (max 2MB)</span>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="space-y-3">
                <Label>Favicon (brauzer ikonkasi)</Label>
                {faviconPreview ? (
                  <div className="relative inline-block">
                    <div className="border rounded-lg p-4 bg-muted/50 inline-flex items-center justify-center min-w-[80px] min-h-[80px]">
                      <img
                        src={faviconPreview}
                        alt="Favicon"
                        className="max-h-12 max-w-12 object-contain"
                        onError={() => setFaviconPreview(null)}
                      />
                    </div>
                    <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6" onClick={removeFavicon}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/20 max-w-[200px]">
                    <div className="w-8 h-8 mx-auto bg-muted rounded flex items-center justify-center mb-2">
                      <span className="text-xs">🌐</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Favicon yuklanmagan</p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input ref={faviconInputRef} type="file" accept=".svg,.png,.ico" onChange={handleFaviconUpload} className="hidden" id="favicon-upload" />
                  <Button variant="outline" onClick={() => faviconInputRef.current?.click()} disabled={uploadingFavicon}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingFavicon ? 'Yuklanmoqda...' : 'Favicon yuklash'}
                  </Button>
                  <span className="text-xs text-muted-foreground">SVG, PNG, ICO (max 1MB)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Favicon brauzer tabida ko'rinadi. 32x32 yoki 64x64 piksel o'lcham tavsiya etiladi.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Aloqa ma'lumotlari</CardTitle>
              <CardDescription>Telefon, manzil va ish vaqti</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefon raqam</Label>
                  <Input
                    value={formData.contact_phone || ''}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp raqam</Label>
                  <Input
                    value={formData.whatsapp_number || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="+998901234567"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ish vaqti (UZ)</Label>
                  <Input
                    value={formData.working_hours_uz || ''}
                    onChange={(e) => setFormData({ ...formData, working_hours_uz: e.target.value })}
                    placeholder="Du-Ju: 9:00 - 18:00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ish vaqti (RU)</Label>
                  <Input
                    value={formData.working_hours_ru || ''}
                    onChange={(e) => setFormData({ ...formData, working_hours_ru: e.target.value })}
                    placeholder="Пн-Пт: 9:00 - 18:00"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manzil (UZ)</Label>
                  <Textarea
                    value={formData.address_uz || ''}
                    onChange={(e) => setFormData({ ...formData, address_uz: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Manzil (RU)</Label>
                  <Textarea
                    value={formData.address_ru || ''}
                    onChange={(e) => setFormData({ ...formData, address_ru: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ijtimoiy tarmoqlar</CardTitle>
              <CardDescription>Footerda ko'rinadigan ijtimoiy tarmoq havolalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={formData.social_facebook || ''}
                  onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={formData.social_instagram || ''}
                  onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value })}
                  placeholder="https://instagram.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <Label>Telegram</Label>
                <Input
                  value={formData.social_telegram || ''}
                  onChange={(e) => setFormData({ ...formData, social_telegram: e.target.value })}
                  placeholder="https://t.me/yourchannel"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Bo'sh qoldirilsa, footer da bu ijtimoiy tarmoq ko'rinmaydi
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="language" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Til sozlamalari</CardTitle>
              <CardDescription>Saytda faol tillarni boshqaring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Asosiy til</Label>
                <Select
                  value={formData.default_language}
                  onValueChange={(value) => setFormData({ ...formData, default_language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uz">O'zbekcha</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Faol tillar</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>O'zbekcha (UZ)</span>
                    <Switch
                      checked={formData.languages_enabled.includes('uz')}
                      onCheckedChange={() => toggleLanguage('uz')}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span>Русский (RU)</span>
                    <Switch
                      checked={formData.languages_enabled.includes('ru')}
                      onCheckedChange={() => toggleLanguage('ru')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Domen sozlamalari</CardTitle>
              <CardDescription>Asosiy domen va sitemap sozlamalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Asosiy domen</Label>
                <Input
                  value={formData.primary_domain || ''}
                  onChange={(e) => setFormData({ ...formData, primary_domain: e.target.value })}
                  placeholder="https://example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Bu domen sitemap.xml va canonical URL lar uchun ishlatiladi
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Sitemap</h4>
                <p className="text-xs text-muted-foreground">
                  Sitemap avtomatik ravishda yaratiladi va quyidagi manzilda mavjud:
                </p>
                <code className="text-xs bg-background px-2 py-1 rounded block">
                  {(formData.primary_domain || window.location.origin).replace(/\/+$/, '')}/sitemap.xml
                </code>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Robots.txt</h4>
                <p className="text-xs text-muted-foreground">
                  robots.txt fayli quyidagi manzilda mavjud:
                </p>
                <code className="text-xs bg-background px-2 py-1 rounded block">
                  {(formData.primary_domain || window.location.origin).replace(/\/+$/, '')}/robots.txt
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO sozlamalari</CardTitle>
              <CardDescription>Qidiruv tizimlari uchun optimallashtirish</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>SEO sarlavha (Title)</Label>
                <Input
                  value={formData.seo_title || ''}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  placeholder="Mebel Store - Eng yaxshi mebellar"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Bu brauzer sarlavhasida ko'rinadi</span>
                  <span className={formData.seo_title && formData.seo_title.length > 60 ? 'text-destructive' : ''}>
                    {formData.seo_title?.length || 0}/60
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>SEO tavsif (Meta Description)</Label>
                <Textarea
                  value={formData.seo_description || ''}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  rows={3}
                  placeholder="Saytingiz haqida qisqacha tavsif..."
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Qidiruv natijalarida ko'rinadi</span>
                  <span className={formData.seo_description && formData.seo_description.length > 160 ? 'text-destructive' : ''}>
                    {formData.seo_description?.length || 0}/160
                  </span>
                </div>
              </div>

              {/* SEO Preview */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium text-sm">Qidiruv natijasi ko'rinishi</h4>
                <div className="bg-background p-3 rounded border">
                  <p className="text-primary text-sm font-medium truncate">
                    {formData.seo_title || formData.site_name || 'Sayt nomi'}
                  </p>
                  <p className="text-xs text-green-600 truncate">
                    {formData.primary_domain || window.location.origin}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {formData.seo_description || 'Sayt tavsifi bu yerda ko\'rinadi...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
