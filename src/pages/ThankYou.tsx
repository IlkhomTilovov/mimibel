import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { useSystemSettings } from '@/hooks/useSystemSettings';

export default function ThankYou() {
  const location = useLocation();
  const { language } = useLanguage();
  const { settings } = useSystemSettings();
  const orderNumber = location.state?.orderNumber;

  const contactPhone = settings?.contact_phone || '+998 90 123 45 67';

  return (
    <div id="hero" className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="font-serif text-3xl font-bold mb-4">
          {language === 'uz' ? 'Rahmat!' : 'Спасибо!'}
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-muted-foreground mb-2">
          {language === 'uz' 
            ? 'Buyurtmangiz qabul qilindi' 
            : 'Ваш заказ принят'}
        </p>

        {/* Order Number */}
        {orderNumber && (
          <p className="text-sm text-muted-foreground mb-6">
            {language === 'uz' ? 'Buyurtma raqami' : 'Номер заказа'}: 
            <span className="font-semibold text-foreground ml-1">{orderNumber}</span>
          </p>
        )}

        {/* Info Card */}
        <div className="bg-muted/50 rounded-2xl p-6 mb-8">
          <p className="text-muted-foreground leading-relaxed">
            {language === 'uz' 
              ? 'Bizning mutaxassislarimiz tez orada siz bilan bog\'lanishadi va buyurtmangiz bo\'yicha barcha tafsilotlarni aniqlashtiradi.' 
              : 'Наши специалисты свяжутся с вами в ближайшее время и уточнят все детали вашего заказа.'}
          </p>
        </div>

        {/* Contact Info */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
          <Phone className="w-4 h-4" />
          <span>{language === 'uz' ? 'Savollar uchun' : 'По вопросам'}:</span>
          <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="font-medium text-primary hover:underline">
            {contactPhone}
          </a>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="flex-1 rounded-full gap-2">
            <Link to="/">
              <Home className="w-4 h-4" />
              {language === 'uz' ? 'Bosh sahifaga' : 'На главную'}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1 rounded-full gap-2">
            <Link to="/catalog">
              <ShoppingBag className="w-4 h-4" />
              {language === 'uz' ? 'Katalogga' : 'В каталог'}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
