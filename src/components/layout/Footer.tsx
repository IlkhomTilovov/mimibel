import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Send } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { EditableText } from '@/components/EditableText';
import { EditableLink } from '@/components/EditableLink';

export function Footer() {
  const { language, t } = useLanguage();
  const { settings, getSiteName, getLogo, getShortDescription, getAddress, getWorkingHours } = useSystemSettings();

  const siteName = getSiteName();
  const logoUrl = getLogo();
  const shortDescription = getShortDescription(language);
  const address = getAddress(language);
  const workingHours = getWorkingHours(language);
  const contactPhone = settings?.contact_phone || '+998 90 123 45 67';

  const quickLinks = [
    { to: '/', label: t.nav.home },
    { to: '/catalog', label: t.nav.catalog },
    { to: '/about', label: t.nav.about },
    { to: '/contact', label: t.nav.contact },
    { to: '/faq', label: t.nav.faq },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          
          {/* Brand Column */}
          <div className="space-y-5">
            {/* Logo */}
            <div className="mb-6">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={siteName} 
                  className="h-12 max-w-[180px] object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`items-center gap-3 ${logoUrl ? 'hidden' : 'flex'}`}
                style={{ display: logoUrl ? 'none' : 'flex' }}
              >
                <div className="w-12 h-12 bg-primary-foreground rounded-lg flex items-center justify-center">
                  <span className="text-primary font-serif font-bold text-2xl">
                    {siteName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description - Editable */}
            <EditableText
              contentKey="footer_description"
              fallback={shortDescription || t.footer.description}
              as="p"
              className="text-primary-foreground/80 text-sm leading-relaxed max-w-xs"
              multiline
              section="footer"
            />

            {/* Social Icons - Editable Links */}
            <div className="flex gap-3 pt-2">
              <EditableLink
                contentKey="footer_social_facebook"
                fallback={settings?.social_facebook || '#'}
                className="w-10 h-10 border border-primary-foreground/30 rounded-full flex items-center justify-center 
                           hover:bg-primary-foreground/10 hover:border-primary-foreground/50 transition-all duration-300 group"
                section="footer"
              >
                <Facebook className="w-4 h-4 text-primary-foreground/80 group-hover:text-primary-foreground transition-colors" />
              </EditableLink>
              
              <EditableLink
                contentKey="footer_social_instagram"
                fallback={settings?.social_instagram || '#'}
                className="w-10 h-10 border border-primary-foreground/30 rounded-full flex items-center justify-center 
                           hover:bg-primary-foreground/10 hover:border-primary-foreground/50 transition-all duration-300 group"
                section="footer"
              >
                <Instagram className="w-4 h-4 text-primary-foreground/80 group-hover:text-primary-foreground transition-colors" />
              </EditableLink>
              
              <EditableLink
                contentKey="footer_social_telegram"
                fallback={settings?.social_telegram || '#'}
                className="w-10 h-10 border border-primary-foreground/30 rounded-full flex items-center justify-center 
                           hover:bg-primary-foreground/10 hover:border-primary-foreground/50 transition-all duration-300 group"
                section="footer"
              >
                <Send className="w-4 h-4 text-primary-foreground/80 group-hover:text-primary-foreground transition-colors" />
              </EditableLink>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <EditableText
              contentKey="footer_quick_links_title"
              fallback={t.footer.quickLinks}
              as="h4"
              className="font-serif font-semibold text-lg mb-5 text-primary-foreground"
              section="footer"
            />
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors duration-200 
                               inline-block hover:translate-x-1 transform"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <EditableText
              contentKey="footer_contact_title"
              fallback={t.footer.contact}
              as="h4"
              className="font-serif font-semibold text-lg mb-5 text-primary-foreground"
              section="footer"
            />
            <ul className="space-y-4">
              <li className="flex items-start gap-3 group">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary-foreground/60" />
                <EditableText
                  contentKey="footer_address"
                  fallback={address || "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi, 15-uy"}
                  as="span"
                  className="text-primary-foreground/70 text-sm leading-relaxed"
                  multiline
                  section="footer"
                />
              </li>
              <li className="flex items-center gap-3 group">
                <Phone className="w-5 h-5 flex-shrink-0 text-primary-foreground/60" />
                <EditableText
                  contentKey="footer_phone"
                  fallback={contactPhone}
                  as="span"
                  className="text-primary-foreground/70 text-sm"
                  section="footer"
                />
              </li>
              <li className="flex items-center gap-3 group">
                <Mail className="w-5 h-5 flex-shrink-0 text-primary-foreground/60" />
                <EditableText
                  contentKey="footer_email"
                  fallback={`info@${window.location.hostname === 'localhost' ? 'example.com' : window.location.hostname}`}
                  as="span"
                  className="text-primary-foreground/70 text-sm break-all"
                  section="footer"
                />
              </li>
            </ul>
          </div>

          {/* Working Hours Column */}
          <div>
            <EditableText
              contentKey="footer_working_hours_title"
              fallback={t.footer.workingHours}
              as="h4"
              className="font-serif font-semibold text-lg mb-5 text-primary-foreground"
              section="footer"
            />
            <div className="text-sm text-primary-foreground/70 leading-relaxed">
              <EditableText
                contentKey="footer_working_hours"
                fallback={workingHours || `${t.footer.weekdays}\n${t.footer.saturday}\n${t.footer.sunday}`}
                as="p"
                className="text-primary-foreground/70"
                multiline
                section="footer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <p className="text-sm text-primary-foreground/50">
              © {new Date().getFullYear()}{' '}
              <EditableText
                contentKey="footer_copyright"
                fallback={`${siteName}. ${t.footer.rights}`}
                as="span"
                className="text-primary-foreground/50"
                section="footer"
              />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
