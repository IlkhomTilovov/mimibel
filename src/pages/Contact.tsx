import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { EditableText } from '@/components/EditableText';
import { EditableLink } from '@/components/EditableLink';
import { useSiteContent } from '@/hooks/useSiteContent';

export default function Contact() {
  const { language, t } = useLanguage();

  useSEO({
    title: t.nav.contact,
  });
  const { toast } = useToast();
  const { getContent } = useSiteContent();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  // Yandex map link - admin tomonidan tahrirlanishi mumkin
  const yandexMapLink = getContent('contact_yandex_map_link', language, 'https://yandex.uz/maps/-/CHQpYCZt');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: t.contact.form.success,
      description: "Tez orada siz bilan bog'lanamiz!",
    });
    
    setForm({ name: '', phone: '', email: '', message: '' });
    setLoading(false);
  };

  const contactInfo = [
    { icon: MapPin, labelKey: 'contact_address_label', valueKey: 'contact_address_value', label: t.contact.info.address, value: t.contact.info.addressValue },
    { icon: Phone, labelKey: 'contact_phone_label', valueKey: 'contact_phone_value', label: t.contact.info.phone, value: '+998 90 123 45 67', href: 'tel:+998901234567' },
    { icon: Mail, labelKey: 'contact_email_label', valueKey: 'contact_email_value', label: t.contact.info.email, value: 'info@mebelusta.uz', href: 'mailto:info@mebelusta.uz' },
    { icon: Clock, labelKey: 'contact_hours_label', valueKey: 'contact_hours_value', label: t.contact.info.workingHours, value: 'Du-Ju: 9:00-18:00, Sha: 10:00-16:00' },
  ];

  return (
    <div id="hero" className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold mb-4">
            <EditableText 
              contentKey="contact_title" 
              fallback={t.contact.title}
              as="span"
              className="font-serif text-4xl font-bold"
              section="contact"
              field="title"
            />
          </h1>
          <p className="text-muted-foreground text-lg">
            <EditableText 
              contentKey="contact_subtitle" 
              fallback={t.contact.subtitle}
              as="span"
              className="text-lg"
              section="contact"
              field="subtitle"
            />
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-card p-8 rounded-2xl shadow-warm h-fit">
            <h2 className="font-serif text-2xl font-bold mb-6">
              <EditableText 
                contentKey="contact_form_title" 
                fallback={language === 'uz' ? "Bizga yozing" : "Напишите нам"}
                as="span"
                className="font-serif text-2xl font-bold"
                section="contact"
                field="form_title"
              />
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">{t.contact.form.name}</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ismingizni kiriting"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t.contact.form.phone}</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t.contact.form.email}</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{t.contact.form.message}</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={4}
                  placeholder="Xabaringizni yozing..."
                />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading}>
                {loading ? 'Yuborilmoqda...' : t.contact.form.submit}
              </Button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="font-serif text-2xl font-bold">
              <EditableText 
                contentKey="contact_info_title" 
                fallback={language === 'uz' ? "Bog'lanish ma'lumotlari" : "Контактная информация"}
                as="span"
                className="font-serif text-2xl font-bold"
                section="contact"
                field="info_title"
              />
            </h2>
            
            {contactInfo.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-card rounded-xl shadow-warm">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">
                    <EditableText 
                      contentKey={item.labelKey} 
                      fallback={item.label}
                      as="span"
                      className="font-medium"
                      section="contact"
                      field={item.labelKey}
                    />
                  </h4>
                  {item.href ? (
                    <a href={item.href} className="text-muted-foreground hover:text-primary transition-colors">
                      <EditableText 
                        contentKey={item.valueKey} 
                        fallback={item.value}
                        as="span"
                        section="contact"
                        field={item.valueKey}
                      />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">
                      <EditableText 
                        contentKey={item.valueKey} 
                        fallback={item.value}
                        as="span"
                        section="contact"
                        field={item.valueKey}
                      />
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <EditableLink
                contentKey="contact_telegram_link"
                fallback="https://t.me/mebelusta"
                className="flex-1"
              >
                <Button size="lg" variant="outline" className="w-full gap-2 rounded-full">
                  <Send className="w-5 h-5" /> Telegram
                </Button>
              </EditableLink>
            </div>

            {/* Yandex Map Embed */}
            <div className="rounded-2xl overflow-hidden h-64 bg-muted relative group">
              <iframe
                src="https://yandex.uz/map-widget/v1/?um=constructor%3A1234567890&amp;source=constructor&amp;ll=69.2401%2C41.3111&amp;z=15"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                title="Bizning joylashuvimiz"
              />
              {/* Open in Yandex Maps button */}
              <a
                href={yandexMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 bg-white/90 hover:bg-white text-foreground px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                {language === 'uz' ? "Kattaroq ochish" : "Открыть больше"}
              </a>
            </div>

            {/* Yandex Map Link Editor for Admin */}
            <div className="text-sm text-muted-foreground">
              <span>{language === 'uz' ? "Xarita havolasi: " : "Ссылка на карту: "}</span>
              <EditableText
                contentKey="contact_yandex_map_link"
                fallback="https://yandex.uz/maps/-/CHQpYCZt"
                as="span"
                className="text-primary hover:underline break-all"
                section="contact"
                field="yandex_map_link"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}