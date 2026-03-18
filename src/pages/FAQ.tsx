import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { faqs } from '@/lib/data';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { EditableText } from '@/components/EditableText';

export default function FAQ() {
  const { language, t } = useLanguage();

  useSEO({
    title: t.nav.faq,
  });

  const groupedFaqs = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof faqs>);

  const categoryNames = {
    ordering: t.faq.categories.ordering,
    delivery: t.faq.categories.delivery,
    warranty: t.faq.categories.warranty,
    custom: t.faq.categories.custom,
    payment: t.faq.categories.payment,
  };

  return (
    <div id="hero" className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl font-bold mb-4">
            <EditableText 
              contentKey="faq_title" 
              fallback={t.faq.title}
              as="span"
              className="font-serif text-4xl font-bold"
              section="faq"
              field="title"
            />
          </h1>
          <p className="text-muted-foreground text-lg">
            <EditableText 
              contentKey="faq_subtitle" 
              fallback={t.faq.subtitle}
              as="span"
              className="text-lg"
              section="faq"
              field="subtitle"
            />
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {Object.entries(groupedFaqs).map(([category, items]) => (
            <div key={category} className="bg-card rounded-2xl shadow-warm p-6">
              <h2 className="font-serif text-xl font-bold mb-4">
                <EditableText 
                  contentKey={`faq_category_${category}`} 
                  fallback={categoryNames[category as keyof typeof categoryNames]}
                  as="span"
                  className="font-serif text-xl font-bold"
                  section="faq"
                  field={`category_${category}`}
                />
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {items.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline">
                      {language === 'uz' ? faq.question_uz : faq.question_ru}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {language === 'uz' ? faq.answer_uz : faq.answer_ru}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            <EditableText 
              contentKey="faq_cta_text" 
              fallback={language === 'uz' 
                ? "Savolingizga javob topa olmadingizmi?"
                : "Не нашли ответ на свой вопрос?"
              }
              as="span"
              section="faq"
              field="cta_text"
            />
          </p>
          <a
            href="https://wa.me/998901234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            <EditableText 
              contentKey="faq_cta_button" 
              fallback="WhatsApp orqali yozing"
              as="span"
              section="faq"
              field="cta_button"
            />
          </a>
        </div>
      </div>
    </div>
  );
}