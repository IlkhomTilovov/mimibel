import { Award, Users, Package, MapPin } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useSEO } from '@/hooks/useSEO';
import { EditableText } from '@/components/EditableText';
import { EditableImage } from '@/components/EditableImage';

export default function About() {
  const { language, t } = useLanguage();

  useSEO({
    title: t.about.title,
  });

  const stats = [
    { icon: Award, value: '10+', label: t.about.stats.years, valueKey: 'about_stat_years_value', labelKey: 'about_stat_years_label' },
    { icon: Package, value: '5000+', label: t.about.stats.products, valueKey: 'about_stat_products_value', labelKey: 'about_stat_products_label' },
    { icon: Users, value: '3000+', label: t.about.stats.customers, valueKey: 'about_stat_customers_value', labelKey: 'about_stat_customers_label' },
    { icon: MapPin, value: '12+', label: t.about.stats.cities, valueKey: 'about_stat_cities_value', labelKey: 'about_stat_cities_label' },
  ];

  const team = [
    { name: 'Akbar Rahimov', role: language === 'uz' ? 'Asoschisi va direktor' : 'Основатель и директор', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300', nameKey: 'about_team_1_name', roleKey: 'about_team_1_role', imageKey: 'about_team_1_image' },
    { name: 'Sardor Karimov', role: language === 'uz' ? 'Bosh dizayner' : 'Главный дизайнер', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', nameKey: 'about_team_2_name', roleKey: 'about_team_2_role', imageKey: 'about_team_2_image' },
    { name: 'Nilufar Azimova', role: language === 'uz' ? "Sotish bo'limi boshlig'i" : 'Руководитель отдела продаж', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300', nameKey: 'about_team_3_name', roleKey: 'about_team_3_role', imageKey: 'about_team_3_image' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section id="hero" className="relative h-[50vh] min-h-[400px] flex items-center">
        <div className="absolute inset-0 z-0">
          <EditableImage
            contentKey="about_hero_image"
            fallbackSrc="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920"
            alt="Workshop"
            className="w-full h-full object-cover"
            wrapperClassName="w-full h-full relative z-10"
            section="about"
          />
          <div className="absolute inset-0 bg-black/60 pointer-events-none z-20" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            <EditableText 
              contentKey="about_title" 
              fallback={t.about.title}
              as="span"
              className="font-serif text-4xl md:text-5xl font-bold"
              section="about"
              field="title"
            />
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            <EditableText 
              contentKey="about_subtitle" 
              fallback={language === 'uz' 
                ? "10 yildan ortiq tajriba bilan Toshkentning eng yaxshi mebel ishlab chiqaruvchilaridan biri"
                : "Один из лучших производителей мебели в Ташкенте с более чем 10-летним опытом"
              }
              as="span"
              className="text-lg"
              section="about"
              field="subtitle"
            />
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-6 bg-card rounded-2xl shadow-warm">
                <stat.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                <div className="font-serif text-3xl font-bold text-foreground">
                  <EditableText 
                    contentKey={stat.valueKey} 
                    fallback={stat.value}
                    as="span"
                    className="font-serif text-3xl font-bold"
                    section="about"
                    field={stat.valueKey}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <EditableText 
                    contentKey={stat.labelKey} 
                    fallback={stat.label}
                    as="span"
                    className="text-sm"
                    section="about"
                    field={stat.labelKey}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-6">
                <EditableText 
                  contentKey="about_story_title" 
                  fallback={t.about.story}
                  as="span"
                  className="font-serif text-3xl font-bold"
                  section="about"
                  field="story_title"
                />
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <EditableText 
                  contentKey="about_story_text_1" 
                  fallback={t.about.storyText}
                  as="span"
                  multiline
                  section="about"
                  field="story_text_1"
                />
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <EditableText 
                  contentKey="about_story_text_2" 
                  fallback={language === 'uz'
                    ? "Biz kichik ustaxonadan boshlab, bugungi kunda zamonaviy ishlab chiqarish liniyalariga ega katta korxonaga aylandik. Har bir mahsulotimizda sifat va ehtiyotkorlik aks etadi."
                    : "Мы начинали с небольшой мастерской и сегодня превратились в крупное предприятие с современными производственными линиями. В каждом нашем изделии отражается качество и забота."
                  }
                  as="span"
                  multiline
                  section="about"
                  field="story_text_2"
                />
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden">
              <EditableImage
                contentKey="about_story_image"
                fallbackSrc="https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800"
                alt="Workshop"
                className="w-full h-full object-cover"
                wrapperClassName="w-full h-full"
                section="about"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-2xl shadow-warm">
              <h3 className="font-serif text-2xl font-bold mb-4">
                <EditableText 
                  contentKey="about_mission_title" 
                  fallback={t.about.mission}
                  as="span"
                  className="font-serif text-2xl font-bold"
                  section="about"
                  field="mission_title"
                />
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <EditableText 
                  contentKey="about_mission_text" 
                  fallback={t.about.missionText}
                  as="span"
                  multiline
                  section="about"
                  field="mission_text"
                />
              </p>
            </div>
            <div className="bg-card p-8 rounded-2xl shadow-warm">
              <h3 className="font-serif text-2xl font-bold mb-4">
                <EditableText 
                  contentKey="about_values_title" 
                  fallback={t.about.values}
                  as="span"
                  className="font-serif text-2xl font-bold"
                  section="about"
                  field="values_title"
                />
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                <EditableText 
                  contentKey="about_values_text" 
                  fallback={t.about.valuesText}
                  as="span"
                  multiline
                  section="about"
                  field="values_text"
                />
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Process */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold text-center mb-10">
            <EditableText 
              contentKey="about_process_title" 
              fallback={language === 'uz' ? 'Ishlab chiqarish jarayoni' : 'Процесс производства'}
              as="span"
              className="font-serif text-3xl font-bold"
              section="about"
              field="process_title"
            />
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', titleKey: 'about_process_1_title', descKey: 'about_process_1_desc', title: language === 'uz' ? 'Konsultatsiya' : 'Консультация', desc: language === 'uz' ? "Sizning talablaringizni o'rganamiz" : 'Изучаем ваши требования' },
              { step: '02', titleKey: 'about_process_2_title', descKey: 'about_process_2_desc', title: language === 'uz' ? 'Dizayn' : 'Дизайн', desc: language === 'uz' ? '3D loyiha tayyorlaymiz' : 'Готовим 3D проект' },
              { step: '03', titleKey: 'about_process_3_title', descKey: 'about_process_3_desc', title: language === 'uz' ? 'Ishlab chiqarish' : 'Производство', desc: language === 'uz' ? 'Sifatli materiallardan yasaymiz' : 'Изготавливаем из качественных материалов' },
              { step: '04', titleKey: 'about_process_4_title', descKey: 'about_process_4_desc', title: language === 'uz' ? 'Yetkazib berish' : 'Доставка', desc: language === 'uz' ? "O'rnatib beramiz" : 'Доставляем и устанавливаем' },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-serif text-2xl font-bold">
                  {item.step}
                </div>
                <h4 className="font-medium mb-2">
                  <EditableText 
                    contentKey={item.titleKey} 
                    fallback={item.title}
                    as="span"
                    className="font-medium"
                    section="about"
                    field={item.titleKey}
                  />
                </h4>
                <p className="text-sm text-muted-foreground">
                  <EditableText 
                    contentKey={item.descKey} 
                    fallback={item.desc}
                    as="span"
                    className="text-sm"
                    section="about"
                    field={item.descKey}
                  />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}