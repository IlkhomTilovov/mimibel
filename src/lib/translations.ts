export type Language = 'uz' | 'ru';

export const translations = {
  uz: {
    // Navigation
    nav: {
      home: "Bosh sahifa",
      catalog: "Katalog",
      about: "Biz haqimizda",
      contact: "Aloqa",
      faq: "FAQ",
      cart: "Savat",
      admin: "Admin",
    },
    // Hero
    hero: {
      title: "Uyingiz uchun mustahkam kiyim sushilkasi",
      subtitle: "Bukiladigan, keng sig'imli va uzoq xizmat qiladigan kiyim quritish stendlari.",
      cta: "Katalogni ko'rish",
      consultation: "Bepul konsultatsiya",
    },
    // Benefits
    benefits: {
      title: "Nega bizni tanlashadi",
      custom: "Turli modellar",
      customDesc: "Har xil o'lcham va dizayndagi sushilkalar",
      delivery: "Tez yetkazib berish",
      deliveryDesc: "Toshkent bo'ylab 1-2 kun ichida",
      warranty: "1 yil kafolat",
      warrantyDesc: "Barcha mahsulotlarimizga kafolat",
      quality: "Mustahkam materiallar",
      qualityDesc: "Po'lat va yuqori sifatli plastik materiallar",
      consultation: "Bepul konsultatsiya",
      consultationDesc: "Mutaxassislarimiz sizga yordam beradi",
    },
    // Products
    products: {
      featured: "Mashhur mahsulotlar",
      viewAll: "Barchasini ko'rish",
      addToCart: "Savatga qo'shish",
      orderWhatsApp: "WhatsApp orqali buyurtma",
      requestConsultation: "Konsultatsiya olish",
      from: "dan",
      currency: "so'm",
      inStock: "Mavjud",
      outOfStock: "Mavjud emas",
      materials: "Materiallar",
      sizes: "O'lchamlar",
      colors: "Ranglar",
      description: "Tavsif",
      details: "Batafsil",
      relatedProducts: "O'xshash mahsulotlar",
    },
    // Categories
    categories: {
      title: "Toifalar",
      kitchen: "Oshxona uchun",
      bedroom: "Yotoqxona uchun",
      living: "Yashash xonasi uchun",
      office: "Balkon uchun",
      dining: "Hammom uchun",
      kids: "Polga qo'yiladigan",
      bathroom: "Devorga osiladigan",
      outdoor: "Bukiladigan",
    },
    // Promo
    promo: {
      title: "Maxsus taklif!",
      subtitle: "Barcha sushilkalarga 20% chegirma",
      description: "Faqat shu oy davomida. Shoshiling!",
      cta: "Batafsil",
    },
    // Reviews
    reviews: {
      title: "Mijozlar fikrlari",
    },
    // Footer
    footer: {
      description: "Sifatli va mustahkam kiyim quritish sushilkalari. Uy va balkon uchun qulay, bukiladigan va uzoq xizmat qiladigan mahsulotlar.",
      quickLinks: "Tez havolalar",
      contact: "Aloqa",
      workingHours: "Ish vaqti",
      weekdays: "Du-Ju: 9:00 - 18:00",
      saturday: "Sha: 10:00 - 16:00",
      sunday: "Ya: Dam olish",
      rights: "Barcha huquqlar himoyalangan.",
    },
    // Catalog
    catalog: {
      title: "Mahsulotlar katalogi",
      search: "Qidirish...",
      filters: "Filtrlar",
      category: "Toifa",
      priceRange: "Narx oralig'i",
      material: "Material",
      allCategories: "Barcha toifalar",
      allMaterials: "Barcha materiallar",
      clearFilters: "Filtrlarni tozalash",
      noProducts: "Mahsulotlar topilmadi",
      showing: "Ko'rsatilmoqda",
      of: "dan",
      products: "mahsulot",
    },
    // About
    about: {
      title: "Biz haqimizda",
      story: "Bizning tarix",
      storyText: "Sifatli va mustahkam kiyim quritish sushilkalari savdosi bilan shug'ullanamiz. Mijozlarimizga qulay va ishonchli mahsulotlarni taklif qilamiz.",
      mission: "Missiyamiz",
      missionText: "Mijozlarimizga eng yaxshi sifat va xizmatni taqdim etish. Biz har bir buyurtmani alohida e'tibor bilan bajaramiz.",
      values: "Qadriyatlarimiz",
      valuesText: "Sifat, halollik va mijoz mamnuniyati - bu bizning asosiy qadriyatlarimiz.",
      stats: {
        years: "Yillik tajriba",
        products: "Sotilgan sushilka",
        customers: "Mamnun mijozlar",
        cities: "Xizmat ko'rsatadigan shaharlar",
      },
    },
    // Contact
    contact: {
      title: "Biz bilan bog'laning",
      subtitle: "Savollaringiz bormi? Biz yordam berishga tayyormiz!",
      form: {
        name: "Ismingiz",
        phone: "Telefon raqamingiz",
        email: "Email",
        message: "Xabaringiz",
        submit: "Yuborish",
        success: "Xabaringiz yuborildi!",
      },
      info: {
        address: "Manzil",
        addressValue: "Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi, 15-uy",
        phone: "Telefon",
        email: "Email",
        workingHours: "Ish vaqti",
      },
    },
    // FAQ
    faq: {
      title: "Ko'p so'raladigan savollar",
      subtitle: "Eng ko'p beriladigan savollarga javoblar",
      categories: {
        ordering: "Buyurtma berish",
        delivery: "Yetkazib berish",
        warranty: "Kafolat",
        custom: "Buyurtma asosida",
        payment: "To'lov",
      },
    },
    // Cart
    cart: {
      title: "Savatingiz",
      empty: "Savat bo'sh",
      emptyDesc: "Mahsulotlarni qo'shing va bu yerda ko'ring",
      continueShopping: "Xarid qilishni davom ettirish",
      total: "Jami",
      sendWhatsApp: "WhatsApp orqali yuborish",
      quantity: "Miqdor",
      remove: "O'chirish",
    },
    // Common
    common: {
      loading: "Yuklanmoqda...",
      error: "Xatolik yuz berdi",
      retry: "Qayta urinish",
      back: "Orqaga",
      close: "Yopish",
      save: "Saqlash",
      cancel: "Bekor qilish",
      delete: "O'chirish",
      edit: "Tahrirlash",
      add: "Qo'shish",
      search: "Qidirish",
    },
  },
  ru: {
    // Navigation
    nav: {
      home: "Главная",
      catalog: "Каталог",
      about: "О нас",
      contact: "Контакты",
      faq: "FAQ",
      cart: "Корзина",
      admin: "Админ",
    },
    // Hero
    hero: {
      title: "Надёжная сушилка для белья для вашего дома",
      subtitle: "Складные, вместительные и долговечные стенды для сушки белья.",
      cta: "Смотреть каталог",
      consultation: "Бесплатная консультация",
    },
    // Benefits
    benefits: {
      title: "Почему выбирают нас",
      custom: "Разные модели",
      customDesc: "Сушилки разных размеров и дизайнов",
      delivery: "Быстрая доставка",
      deliveryDesc: "По Ташкенту за 1-2 дня",
      warranty: "Гарантия 1 год",
      warrantyDesc: "Гарантия на всю продукцию",
      quality: "Прочные материалы",
      qualityDesc: "Сталь и высококачественный пластик",
      consultation: "Бесплатная консультация",
      consultationDesc: "Наши специалисты помогут вам",
    },
    // Products
    products: {
      featured: "Популярные товары",
      viewAll: "Смотреть все",
      addToCart: "В корзину",
      orderWhatsApp: "Заказать через WhatsApp",
      requestConsultation: "Получить консультацию",
      from: "от",
      currency: "сум",
      inStock: "В наличии",
      outOfStock: "Нет в наличии",
      materials: "Материалы",
      sizes: "Размеры",
      colors: "Цвета",
      description: "Описание",
      details: "Подробнее",
      relatedProducts: "Похожие товары",
    },
    // Categories
    categories: {
      title: "Категории",
      kitchen: "Для кухни",
      bedroom: "Для спальни",
      living: "Для гостиной",
      office: "Для балкона",
      dining: "Для ванной",
      kids: "Напольные",
      bathroom: "Настенные",
      outdoor: "Складные",
    },
    // Promo
    promo: {
      title: "Специальное предложение!",
      subtitle: "Скидка 20% на все сушилки",
      description: "Только в этом месяце. Спешите!",
      cta: "Подробнее",
    },
    // Reviews
    reviews: {
      title: "Отзывы клиентов",
    },
    // Footer
    footer: {
      description: "Качественные и прочные сушилки для белья. Удобные складные модели для дома и балкона.",
      quickLinks: "Быстрые ссылки",
      contact: "Контакты",
      workingHours: "Время работы",
      weekdays: "Пн-Пт: 9:00 - 18:00",
      saturday: "Сб: 10:00 - 16:00",
      sunday: "Вс: Выходной",
      rights: "Все права защищены.",
    },
    // Catalog
    catalog: {
      title: "Каталог товаров",
      search: "Поиск...",
      filters: "Фильтры",
      category: "Категория",
      priceRange: "Диапазон цен",
      material: "Материал",
      allCategories: "Все категории",
      allMaterials: "Все материалы",
      clearFilters: "Сбросить фильтры",
      noProducts: "Товары не найдены",
      showing: "Показано",
      of: "из",
      products: "товаров",
    },
    // About
    about: {
      title: "О нас",
      story: "Наша история",
      storyText: "Мы занимаемся продажей качественных и прочных сушилок для белья. Предлагаем нашим клиентам удобные и надежные товары.",
      mission: "Наша миссия",
      missionText: "Предоставить нашим клиентам лучшее качество и сервис. Мы выполняем каждый заказ с особым вниманием.",
      values: "Наши ценности",
      valuesText: "Качество, честность и удовлетворённость клиентов — наши основные ценности.",
      stats: {
        years: "Лет опыта",
        products: "Продано сушилок",
        customers: "Довольных клиентов",
        cities: "Городов обслуживания",
      },
    },
    // Contact
    contact: {
      title: "Свяжитесь с нами",
      subtitle: "Есть вопросы? Мы готовы помочь!",
      form: {
        name: "Ваше имя",
        phone: "Номер телефона",
        email: "Email",
        message: "Сообщение",
        submit: "Отправить",
        success: "Сообщение отправлено!",
      },
      info: {
        address: "Адрес",
        addressValue: "г. Ташкент, Чиланзарский район, ул. Бунёдкор, дом 15",
        phone: "Телефон",
        email: "Email",
        workingHours: "Время работы",
      },
    },
    // FAQ
    faq: {
      title: "Часто задаваемые вопросы",
      subtitle: "Ответы на самые популярные вопросы",
      categories: {
        ordering: "Оформление заказа",
        delivery: "Доставка",
        warranty: "Гарантия",
        custom: "На заказ",
        payment: "Оплата",
      },
    },
    // Cart
    cart: {
      title: "Ваша корзина",
      empty: "Корзина пуста",
      emptyDesc: "Добавьте товары и увидите их здесь",
      continueShopping: "Продолжить покупки",
      total: "Итого",
      sendWhatsApp: "Отправить через WhatsApp",
      quantity: "Количество",
      remove: "Удалить",
    },
    // Common
    common: {
      loading: "Загрузка...",
      error: "Произошла ошибка",
      retry: "Повторить",
      back: "Назад",
      close: "Закрыть",
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Редактировать",
      add: "Добавить",
      search: "Поиск",
    },
  },
};
