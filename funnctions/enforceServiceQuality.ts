import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // قاموس البراندات المعروفة مع شعاراتها
    const BRAND_LOGOS = {
      'pubg': 'https://api.stark-card.com/images/category/1600-1744283287.webp',
      'free fire': 'https://api.stark-card.com/images/category/1640-1751591733.webp',
      'yalla ludo': 'https://api.stark-card.com/images/category/1600-1744397349.webp',
      'jawaker': 'https://api.stark-card.com/images/category/1600-1744399680.webp',
      'tiktok': 'https://api.stark-card.com/images/category/1600-1744361599.webp',
      'meyo': 'https://api.stark-card.com/images/product/1668-1747124531.webp',
      'unlocktool': 'https://api.stark-card.com/images/category/1600-1746627504.webp',
      'chimera': 'https://api.stark-card.com/images/category/1600-1746627683.webp',
      'dft': 'https://api.stark-card.com/images/category/1600-1746627328.webp',
      'itunes': 'https://api.stark-card.com/images/category/1600-1744303391.webp',
      'google': 'https://api.stark-card.com/images/category/1600-1746523051.webp',
      'samsung': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
      'apple': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
      'xiaomi': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg',
      'huawei': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Huawei_Standard_logo.svg'
    };

    // كلمات مفتاحية لاستخراج البراند من الاسم
    const BRAND_KEYWORDS = {
      'game_topup': ['pubg', 'free fire', 'mobile legends', 'call of duty', 'roblox', 'minecraft', 'fortnite', 'genshin', 'valorant', 'xbox'],
      'live_apps': ['tiktok', 'yalla', 'ludo', 'jawaker', 'bigo', 'meyo', 'imo', 'clubhouse'],
      'tool_activation': ['chimera', 'unlocktool', 'dft', 'samkey', 'sigma', 'octopus', 'umt', 'uat', 'nck', 'easy-firmware', 'gsm', 'z3x', 'infinity', 'mrt'],
      'device_unlock': ['samsung', 'apple', 'icloud', 'mdm', 'iphone', 'huawei', 'xiaomi', 'oppo', 'vivo', 'realme']
    };

    // استخراج البراند من اسم الخدمة
    const extractBrand = (serviceName, category) => {
      const lowerName = serviceName.toLowerCase();
      const keywords = BRAND_KEYWORDS[category] || [];
      
      for (const keyword of keywords) {
        if (lowerName.includes(keyword)) {
          return keyword.charAt(0).toUpperCase() + keyword.slice(1);
        }
      }
      
      // إذا لم نجد، نحاول استخراج أول كلمة معنوية
      const words = serviceName.split(/[\s\-_]+/);
      for (const word of words) {
        if (word.length > 3 && !/^\d+$/.test(word)) {
          return word;
        }
      }
      
      return null;
    };

    // تحسين اسم الخدمة
    const improveServiceName = (service) => {
      const name = service.name || '';
      const wordCount = name.trim().split(/\s+/).length;
      
      // إذا كان الاسم قصير جداً أو يبدأ برقم
      if (wordCount < 2 || /^\d/.test(name)) {
        const brand = extractBrand(name, service.category);
        if (brand) {
          return `${brand} - ${name}`;
        }
      }
      
      return name;
    };

    // الحصول على صورة مناسبة
    const getServiceImage = (service) => {
      const lowerName = (service.name || '').toLowerCase();
      
      // البحث عن شعار معروف
      for (const [keyword, logo] of Object.entries(BRAND_LOGOS)) {
        if (lowerName.includes(keyword)) {
          return logo;
        }
      }
      
      // إذا لم نجد، ننشئ placeholder بالاسم الكامل
      const encodedName = encodeURIComponent(service.name || 'Service');
      return `https://placehold.co/400x300/1a1a2e/00d4ff/png?text=${encodedName}&font=cairo`;
    };

    // جلب كل الخدمات
    const allServices = await base44.asServiceRole.entities.Service.list('-created_date', 2000);
    
    let updatedCount = 0;
    const updates = [];
    const errors = [];

    // معالجة كل خدمة
    for (const service of allServices) {
      try {
        const improvedName = improveServiceName(service);
        const improvedImage = getServiceImage(service);
        
        // فحص إذا كانت هناك حاجة للتحديث
        const needsUpdate = 
          (improvedName !== service.name) || 
          (!service.image_url || service.image_url.includes('placehold.co/600x400'));
        
        if (needsUpdate) {
          await base44.asServiceRole.entities.Service.update(service.id, {
            ...service,
            name: improvedName,
            image_url: improvedImage
          });
          
          updatedCount++;
          updates.push({
            id: service.id,
            oldName: service.name,
            newName: improvedName,
            image: improvedImage
          });
        }
      } catch (error) {
        errors.push({
          id: service.id,
          name: service.name,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      message: `✅ تم تدقيق ${allServices.length} خدمة - تم تحديث ${updatedCount} خدمة`,
      stats: {
        total: allServices.length,
        updated: updatedCount,
        errors: errors.length
      },
      sampleUpdates: updates.slice(0, 10),
      errors: errors.slice(0, 5)
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});