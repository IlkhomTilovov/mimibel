import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, Phone } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useCart } from '@/hooks/useCart';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { CartDrawer } from '@/components/CartDrawer';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { totalItems } = useCart();
  const location = useLocation();
  const { settings, getSiteName, getLogo } = useSystemSettings();

  const navLinks = [
    { href: '/', label: t.nav.home },
    { href: '/catalog', label: t.nav.catalog },
    { href: '/about', label: t.nav.about },
    { href: '/contact', label: t.nav.contact },
    { href: '/faq', label: t.nav.faq },
  ];

  const isActive = (path: string) => location.pathname === path;

  const siteName = getSiteName();
  const logoUrl = getLogo();
  const contactPhone = settings?.contact_phone || '+998 90 123 45 67';

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={siteName} 
                className="h-10 max-w-[160px] object-contain"
                onError={(e) => {
                  // Fallback to text logo if image fails
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`flex items-center gap-2 ${logoUrl ? 'hidden' : ''}`}>
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-serif font-bold text-xl">
                  {siteName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-serif text-xl font-bold text-foreground hidden sm:block">
                {siteName}
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.href) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-muted rounded-full p-1">
              <button
                onClick={() => setLanguage('uz')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  language === 'uz' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                UZ
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  language === 'ru' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                RU
              </button>
            </div>

            {/* Phone */}
            <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="hidden md:flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
              <Phone className="w-4 h-4" />
              <span>{contactPhone}</span>
            </a>

            {/* Cart - Toggle behavior */}
            <button 
              onClick={() => setCartOpen(prev => !prev)} 
              className="relative"
              aria-label={cartOpen ? 'Close cart' : 'Open cart'}
            >
              <Button variant="ghost" size="icon" className="relative" asChild>
                <span>
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-medium">
                      {totalItems}
                    </span>
                  )}
                </span>
              </Button>
            </button>

            {/* Mobile Menu Toggle */}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <nav className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="px-4 py-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <Phone className="w-4 h-4" /> {contactPhone}
              </a>
            </div>
          </nav>
        )}
      </div>

      {/* Cart Drawer - rendered via portal to avoid layout shifts */}
      {createPortal(
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />,
        document.body
      )}
    </header>
  );
}
