const translations = {
  en: { dashboard: "Dashboard", pages: "Pages", calendar: "Calendar", settings: "Settings", history: "History", overview: "Overview", save: "Save", cancel: "Cancel", createPage: "Create Page", newPage: "New Page" },
  ur: { dashboard: "ڈیش بورڈ", pages: "صفحات", calendar: "کیلنڈر", settings: "ترتیبات", history: "تاریخچہ", overview: "جائزہ", save: "محفوظ کریں", cancel: "منسوخ کریں", createPage: "صفحہ بنائیں", newPage: "نیا صفحہ" },
  hi: { dashboard: "डैशबोर्ड", pages: "पेज", calendar: "कैलेंडर", settings: "सेटिंग्स", history: "इतिहास", overview: "अवलोकन", save: "सहेजें", cancel: "रद्द करें", createPage: "पेज बनाएं", newPage: "नया पेज" },
  ar: { dashboard: "لوحة التحكم", pages: "الصفحات", calendar: "التقويم", settings: "الإعدادات", history: "السجل", overview: "نظرة عامة", save: "حفظ", cancel: "إلغاء", createPage: "إنشاء صفحة", newPage: "صفحة جديدة" },
  te: { dashboard: "డాష్‌బోర్డ్", pages: "పేజీలు", calendar: "క్యాలెండర్", settings: "సెట్టింగ్‌లు", history: "చరిత్ర", overview: "అవలోకనం", save: "సేవ్", cancel: "రద్దు", createPage: "పేజీని సృష్టించండి", newPage: "కొత్త పేజీ" },
  bn: { dashboard: "ড্যাশবোর্ড", pages: "পেজ", calendar: "ক্যালেন্ডার", settings: "সেটিংস", history: "ইতিহাস", overview: "ওভারভিউ", save: "সংরক্ষণ", cancel: "বাতিল", createPage: "পেজ তৈরি করুন", newPage: "নতুন পেজ" },
};
export function t(language, key) { return translations[language]?.[key] || translations.en[key] || key; }
export { translations };
