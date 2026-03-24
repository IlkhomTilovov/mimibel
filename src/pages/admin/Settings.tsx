import { useEffect, useState } from 'react';
import { Save, Send, CheckCircle, XCircle, Code, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TelegramSettings {
  bot_token: string;
  chat_id: string;
  enabled: boolean;
}

interface MetaPixelSettings {
  code: string;
  enabled: boolean;
}

interface MetaTagSettings {
  tags: string;
  enabled: boolean;
}

export default function Settings() {
  const [telegram, setTelegram] = useState<TelegramSettings>({
    bot_token: '',
    chat_id: '',
    enabled: false,
  });
  const [metaPixel, setMetaPixel] = useState<MetaPixelSettings>({
    code: '',
    enabled: false,
  });
  const [metaTags, setMetaTags] = useState<MetaTagSettings>({
    tags: '',
    enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPixel, setSavingPixel] = useState(false);
  const [savingTags, setSavingTags] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [tagValidationError, setTagValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      const settings: Record<string, string> = {};
      data?.forEach(item => {
        settings[item.key] = item.value || '';
      });

      setTelegram({
        bot_token: settings['telegram_bot_token'] || '',
        chat_id: settings['telegram_chat_id'] || '',
        enabled: settings['telegram_enabled'] === 'true',
      });
      setMetaPixel({
        code: settings['meta_pixel_code'] || '',
        enabled: settings['meta_pixel_enabled'] === 'true',
      });
      setMetaTags({
        tags: settings['meta_verification_tags'] || '',
        enabled: settings['meta_verification_enabled'] === 'true',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTelegramSettings = async () => {
    // Validate bot token format
    if (telegram.bot_token && !/^\d+:[A-Za-z0-9_-]+$/.test(telegram.bot_token)) {
      toast({
        title: 'Xatolik',
        description: 'Bot token formati noto\'g\'ri. Format: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz',
        variant: 'destructive',
      });
      return;
    }

    // Validate chat ID format
    if (telegram.chat_id && !/^-?\d+$/.test(telegram.chat_id)) {
      toast({
        title: 'Xatolik',
        description: 'Chat ID faqat raqamlardan iborat bo\'lishi kerak',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const updates = [
        { key: 'telegram_bot_token', value: telegram.bot_token },
        { key: 'telegram_chat_id', value: telegram.chat_id },
        { key: 'telegram_enabled', value: telegram.enabled.toString() },
      ];

      for (const update of updates) {
        // Try to update first
        const { data: existing } = await supabase
          .from('settings')
          .select('id')
          .eq('key', update.key)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('settings')
            .update({ value: update.value, updated_at: new Date().toISOString() })
            .eq('key', update.key);
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('settings')
            .insert({ key: update.key, value: update.value });
          if (error) throw error;
        }
      }

      toast({
        title: 'Muvaffaqiyat',
        description: 'Telegram sozlamalari saqlandi',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Xatolik',
        description: 'Sozlamalarni saqlashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveMetaPixelSettings = async () => {
    setSavingPixel(true);
    try {
      const updates = [
        { key: 'meta_pixel_code', value: metaPixel.code },
        { key: 'meta_pixel_enabled', value: metaPixel.enabled.toString() },
      ];

      for (const update of updates) {
        const { data: existing } = await supabase
          .from('settings')
          .select('id')
          .eq('key', update.key)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('settings')
            .update({ value: update.value, updated_at: new Date().toISOString() })
            .eq('key', update.key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('settings')
            .insert({ key: update.key, value: update.value });
          if (error) throw error;
        }
      }

      toast({
        title: 'Muvaffaqiyat',
        description: 'Meta Pixel sozlamalari saqlandi. Sayt yangilanganida ishga tushadi.',
      });
    } catch (error) {
      console.error('Error saving meta pixel:', error);
      toast({
        title: 'Xatolik',
        description: 'Meta Pixel saqlashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setSavingPixel(false);
    }
  };

  const validateMetaTags = (input: string): boolean => {
    if (!input.trim()) return true;
    const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (!/^<meta\s[^>]*\/?>$/i.test(line)) {
        setTagValidationError(`Noto'g'ri format: "${line.substring(0, 50)}...". Faqat <meta> teglar ruxsat etiladi.`);
        return false;
      }
    }
    setTagValidationError(null);
    return true;
  };

  const saveMetaTagSettings = async () => {
    if (!validateMetaTags(metaTags.tags)) return;

    setSavingTags(true);
    try {
      const updates = [
        { key: 'meta_verification_tags', value: metaTags.tags },
        { key: 'meta_verification_enabled', value: metaTags.enabled.toString() },
      ];

      for (const update of updates) {
        const { data: existing } = await supabase
          .from('settings')
          .select('id')
          .eq('key', update.key)
          .single();

        if (existing) {
          const { error } = await supabase
            .from('settings')
            .update({ value: update.value, updated_at: new Date().toISOString() })
            .eq('key', update.key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('settings')
            .insert({ key: update.key, value: update.value });
          if (error) throw error;
        }
      }

      toast({
        title: 'Muvaffaqiyat',
        description: 'Meta teglar saqlandi. Sayt yangilanganida ishga tushadi.',
      });
    } catch (error) {
      console.error('Error saving meta tags:', error);
      toast({
        title: 'Xatolik',
        description: 'Meta teglarni saqlashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setSavingTags(false);
    }

  const testTelegramConnection = async () => {
    if (!telegram.bot_token || !telegram.chat_id) {
      toast({
        title: 'Xatolik',
        description: 'Bot token va Chat ID kiriting',
        variant: 'destructive',
      });
      return;
    }

    if (!telegram.enabled) {
      toast({
        title: 'Xatolik',
        description: 'Avval "Telegram xabarlarini yoqish" tugmasini yoqing',
        variant: 'destructive',
      });
      return;
    }

    // First save settings to make sure they're in the database
    await saveTelegramSettings();

    setTesting(true);
    setTestResult(null);

    try {
      // Call server-side edge function (keeps bot token secure)
      const { data, error } = await supabase.functions.invoke('send-telegram', {
        body: { type: 'test' },
      });

      if (error) throw error;

      if (data?.success) {
        setTestResult('success');
        toast({
          title: 'Muvaffaqiyat',
          description: 'Telegram ulanishi muvaffaqiyatli!',
        });
      } else {
        throw new Error(data?.error || 'Telegram xabar yuborishda xatolik');
      }
    } catch (error: any) {
      setTestResult('error');
      toast({
        title: 'Xatolik',
        description: error.message || 'Telegram ulanishida xatolik',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
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
      <div>
        <h1 className="text-2xl font-bold">Sozlamalar</h1>
        <p className="text-muted-foreground">Tizim sozlamalarini boshqaring</p>
      </div>

      <Tabs defaultValue="telegram" className="space-y-4">
        <TabsList>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="meta-pixel">Meta Pixel</TabsTrigger>
          <TabsTrigger value="meta-tags">Domain Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="telegram" className="space-y-6">
          {/* Telegram Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram Bot
              </CardTitle>
              <CardDescription>
                Yangi buyurtmalar haqida Telegram orqali xabar olish uchun botni sozlang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="telegram-enabled">Telegram xabarlarini yoqish</Label>
                <Switch
                  id="telegram-enabled"
                  checked={telegram.enabled}
                  onCheckedChange={(checked) => setTelegram(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bot-token">Bot Token</Label>
                <Input
                  id="bot-token"
                  type="password"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  value={telegram.bot_token}
                  onChange={(e) => setTelegram(prev => ({ ...prev, bot_token: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  @BotFather dan olingan bot token
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chat-id">Chat ID</Label>
                <Input
                  id="chat-id"
                  placeholder="-1001234567890"
                  value={telegram.chat_id}
                  onChange={(e) => setTelegram(prev => ({ ...prev, chat_id: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Guruh yoki kanal ID (minus bilan boshlanadi)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={saveTelegramSettings} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={testTelegramConnection}
                  disabled={testing}
                >
                  {testing ? (
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                  ) : testResult === 'success' ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                  ) : testResult === 'error' ? (
                    <XCircle className="mr-2 h-4 w-4 text-destructive" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Test xabar yuborish
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* How to Setup Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Telegram Bot sozlash yo'riqnomasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">1. Bot yaratish</h4>
                <p className="text-sm text-muted-foreground">
                  Telegram da @BotFather ga yozing va /newbot buyrug'ini yuboring. Bot nomini va username kiriting.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">2. Token olish</h4>
                <p className="text-sm text-muted-foreground">
                  BotFather sizga HTTP API token beradi. Uni yuqoridagi "Bot Token" maydoniga kiriting.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">3. Chat ID olish</h4>
                <p className="text-sm text-muted-foreground">
                  Botni guruhga qo'shing va @getidsbot yoki @userinfobot dan guruh ID sini oling.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta-pixel" className="space-y-6">
          {/* Meta Pixel Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Meta Pixel (Facebook Pixel)
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Meta Pixel kodini joylashtiring — saytga avtomatik qo'shiladi
                  </CardDescription>
                </div>
                <Badge variant={metaPixel.enabled && metaPixel.code.trim() ? 'default' : 'secondary'}>
                  {metaPixel.enabled && metaPixel.code.trim() ? (
                    <><Eye className="mr-1 h-3 w-3" /> Faol</>
                  ) : (
                    <><EyeOff className="mr-1 h-3 w-3" /> Nofaol</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="pixel-enabled">Meta Pixel ni yoqish</Label>
                <Switch
                  id="pixel-enabled"
                  checked={metaPixel.enabled}
                  onCheckedChange={(checked) => setMetaPixel(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pixel-code">Meta Pixel Code</Label>
                <Textarea
                  id="pixel-code"
                  placeholder={"<!-- Meta Pixel Code -->\n<script>\n  !function(f,b,e,v,n,t,s)...\n</script>\n<noscript>...</noscript>\n<!-- End Meta Pixel Code -->"}
                  value={metaPixel.code}
                  onChange={(e) => setMetaPixel(prev => ({ ...prev, code: e.target.value }))}
                  className="min-h-[200px] font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Meta Business Suite dan to'liq Pixel kodini (script + noscript) ko'chirib joylashtiring
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={saveMetaPixelSettings} disabled={savingPixel}>
                  <Save className="mr-2 h-4 w-4" />
                  {savingPixel ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Meta Pixel Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Meta Pixel sozlash yo'riqnomasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">1. Meta Business Suite ga kiring</h4>
                <p className="text-sm text-muted-foreground">
                  business.facebook.com saytiga kiring va Events Manager bo'limini oching.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">2. Pixel kodini oling</h4>
                <p className="text-sm text-muted-foreground">
                  "Add Events" → "From a New Website" → "Install code manually" ni tanlang va to'liq kodni ko'chiring.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">3. Kodni joylashtiring</h4>
                <p className="text-sm text-muted-foreground">
                  Ko'chirilgan kodni yuqoridagi textarea ga joylashtiring va "Saqlash" tugmasini bosing. Kod sayt {"<head>"} ga avtomatik qo'shiladi.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meta-tags" className="space-y-6">
          {/* Meta Verification Tags */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Domain Verification Meta Tags
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Facebook, Google va boshqa xizmatlar uchun domain tasdiqlash meta teglarini joylashtiring
                  </CardDescription>
                </div>
                <Badge variant={metaTags.enabled && metaTags.tags.trim() ? 'default' : 'secondary'}>
                  {metaTags.enabled && metaTags.tags.trim() ? (
                    <><Eye className="mr-1 h-3 w-3" /> Faol</>
                  ) : (
                    <><EyeOff className="mr-1 h-3 w-3" /> Nofaol</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="tags-enabled">Meta teglarni yoqish</Label>
                <Switch
                  id="tags-enabled"
                  checked={metaTags.enabled}
                  onCheckedChange={(checked) => setMetaTags(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-tags">Verification Meta Tags</Label>
                <Textarea
                  id="verification-tags"
                  placeholder={'<meta name="facebook-domain-verification" content="xxxxxxx" />\n<meta name="google-site-verification" content="xxxxxxx" />'}
                  value={metaTags.tags}
                  onChange={(e) => {
                    setMetaTags(prev => ({ ...prev, tags: e.target.value }));
                    setTagValidationError(null);
                  }}
                  className="min-h-[150px] font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Har bir meta tegni alohida qatorga yozing. Faqat {"<meta>"} teglar qabul qilinadi.
                </p>
                {tagValidationError && (
                  <div className="flex items-center gap-2 text-destructive text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    {tagValidationError}
                  </div>
                )}
              </div>

              {/* Preview */}
              {metaTags.tags.trim() && (
                <div className="space-y-2">
                  <Label>Joriy teglar:</Label>
                  <div className="space-y-1">
                    {metaTags.tags.split('\n').filter(l => l.trim()).map((line, i) => {
                      const isValid = /^<meta\s[^>]*\/?>$/i.test(line.trim());
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs font-mono">
                          {isValid ? (
                            <CheckCircle className="h-3 w-3 shrink-0 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3 w-3 shrink-0 text-destructive" />
                          )}
                          <span className="truncate text-muted-foreground">{line.trim()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={saveMetaTagSettings} disabled={savingTags}>
                  <Save className="mr-2 h-4 w-4" />
                  {savingTags ? 'Saqlanmoqda...' : 'Saqlash'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Domain verification yo'riqnomasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Facebook Domain Verification</h4>
                <p className="text-sm text-muted-foreground">
                  Meta Business Suite → Settings → Brand safety → Domains → "Add" → meta tegni ko'chirib joylashtiring.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Google Search Console</h4>
                <p className="text-sm text-muted-foreground">
                  search.google.com/search-console → Domain qo'shish → "HTML tag" usulini tanlang va meta tegni ko'chiring.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Ko'p teglarni qo'shish</h4>
                <p className="text-sm text-muted-foreground">
                  Har bir meta tegni alohida qatorga yozing. Misol: birinchi qatorda Facebook, ikkinchi qatorda Google tegi.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
