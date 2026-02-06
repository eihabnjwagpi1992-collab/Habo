import React, { createContext, useState, useContext, useEffect } from 'react';

const translations = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    services: 'الخدمات',
    dashboard: 'لوحة التحكم',
    orders: 'الطلبات',
    supportFiles: 'ملفات الدعم',
    support: 'الدعم',
    addFunds: 'إضافة رصيد',
    adminPanel: 'لوحة الأدمن',
    signIn: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    myOrders: 'طلباتي',
    contactUs: 'اتصل بنا',
    
    // Hero Section
    professionalGSMServices: 'خدمات GSM والحلول الرقمية الاحترافية',
    yourUltimate: 'منصتك الشاملة',
    gsmSolutions: 'لحلول GSM',
    heroDescription: 'خدمات فتح احترافية، شحن الألعاب، والحلول الرقمية. منصة سريعة وموثوقة وآمنة يثق بها آلاف الفنيين والموزعين حول العالم.',
    exploreServices: 'استكشف الخدمات',
    myDashboard: 'لوحة التحكم',
    
    // Common
    balance: 'الرصيد',
    price: 'السعر',
    status: 'الحالة',
    search: 'بحث',
    filter: 'تصفية',
    submit: 'إرسال',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    back: 'رجوع',
    loading: 'جاري التحميل',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    date: 'التاريخ',
    actions: 'الإجراءات',
    description: 'الوصف',
    category: 'التصنيف',
    amount: 'المبلغ',
    view: 'عرض',
    download: 'تحميل',
    upload: 'رفع',
    total: 'الإجمالي',
    close: 'إغلاق',
    confirm: 'تأكيد',
    yes: 'نعم',
    no: 'لا',
    active: 'نشط',
    inactive: 'غير نشط',
    all: 'الكل',
    
    // Categories
    device_unlock: 'فتح الأجهزة',
    game_topup: 'شحن الألعاب',
    live_apps: 'تطبيقات اللايف والبث',
    tool_activation: 'تفعيل الأدوات والكرديت',
    software_service: 'خدمات البرامج',
    digital_service: 'خدمات رقمية',
    support_files: 'ملفات الدعم',
    allCategories: 'جميع الأقسام',
    
    // Order Status
    pending: 'قيد الانتظار',
    processing: 'قيد المعالجة',
    completed: 'مكتمل',
    failed: 'فشل',
    refunded: 'مسترد',
    
    // Messages
    orderSuccess: 'تم إنشاء الطلب بنجاح',
    orderFailed: 'فشل في إنشاء الطلب',
    insufficientBalance: 'رصيدك غير كافي',
    processingTime: 'وقت المعالجة',
    noData: 'لا توجد بيانات',
    error: 'خطأ',
    success: 'نجاح',
    warning: 'تحذير',
    info: 'معلومات',
    
    // Admin Panel
    manageServices: 'إدارة الخدمات',
    manageUsers: 'إدارة المستخدمين',
    manageOrders: 'إدارة الطلبات',
    manageDeposits: 'إدارة الإيداعات',
    settings: 'الإعدادات',
    statistics: 'الإحصائيات',
    reports: 'التقارير',
    
    // Footer
    allRightsReserved: 'جميع الحقوق محفوظة',
    allSystemsOperational: 'جميع الأنظمة تعمل',
    account: 'الحساب',
    gsmServer: 'خادم GSM',
    gameTopUp: 'شحن الألعاب',
    digitalServices: 'خدمات رقمية',
    software: 'البرمجيات',
    faq: 'الأسئلة الشائعة',
    termsOfService: 'شروط الخدمة',
    privacyPolicy: 'سياسة الخصوصية',
  },
  en: {
    // Navigation
    home: 'Home',
    services: 'Services',
    dashboard: 'Dashboard',
    orders: 'Orders',
    supportFiles: 'Support Files',
    support: 'Support',
    addFunds: 'Add Funds',
    adminPanel: 'Admin Panel',
    signIn: 'Sign In',
    logout: 'Logout',
    myOrders: 'My Orders',
    contactUs: 'Contact Us',
    
    // Hero Section
    professionalGSMServices: 'Professional GSM & Digital Services',
    yourUltimate: 'Your Ultimate',
    gsmSolutions: 'GSM Solutions',
    heroDescription: 'Premium unlocking services, game top-ups, and digital solutions. Fast, reliable, and secure platform trusted by thousands of technicians and resellers worldwide.',
    exploreServices: 'Explore Services',
    myDashboard: 'My Dashboard',
    
    // Common
    balance: 'Balance',
    price: 'Price',
    status: 'Status',
    search: 'Search',
    filter: 'Filter',
    submit: 'Submit',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    back: 'Back',
    loading: 'Loading',
    name: 'Name',
    email: 'Email',
    date: 'Date',
    actions: 'Actions',
    description: 'Description',
    category: 'Category',
    amount: 'Amount',
    view: 'View',
    download: 'Download',
    upload: 'Upload',
    total: 'Total',
    close: 'Close',
    confirm: 'Confirm',
    yes: 'Yes',
    no: 'No',
    active: 'Active',
    inactive: 'Inactive',
    all: 'All',
    
    // Categories
    device_unlock: 'Device Unlock',
    game_topup: 'Game Top-Up',
    live_apps: 'Live Apps & Streaming',
    tool_activation: 'Tool Activation & Credits',
    software_service: 'Software Service',
    digital_service: 'Digital Service',
    support_files: 'Support Files',
    allCategories: 'All Categories',
    
    // Order Status
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
    
    // Messages
    orderSuccess: 'Order created successfully',
    orderFailed: 'Failed to create order',
    insufficientBalance: 'Insufficient balance',
    processingTime: 'Processing Time',
    noData: 'No data available',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    
    // Admin Panel
    manageServices: 'Manage Services',
    manageUsers: 'Manage Users',
    manageOrders: 'Manage Orders',
    manageDeposits: 'Manage Deposits',
    settings: 'Settings',
    statistics: 'Statistics',
    reports: 'Reports',
    
    // Footer
    allRightsReserved: 'All rights reserved',
    allSystemsOperational: 'All systems operational',
    account: 'Account',
    gsmServer: 'GSM Server',
    gameTopUp: 'Game Top-Up',
    digitalServices: 'Digital Services',
    software: 'Software',
    faq: 'FAQ',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('ar');
  const [direction, setDirection] = useState('rtl');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'ar';
    setLanguage(savedLang);
    setDirection(savedLang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    setDirection(newLang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const t = (key) => translations[language][key] || key;

  return (
    <LanguageContext.Provider value={{ language, direction, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}