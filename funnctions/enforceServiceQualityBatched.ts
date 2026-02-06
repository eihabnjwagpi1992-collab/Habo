import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { batchSize = 50, offset = 0 } = await req.json().catch(() => ({}));

    // قاموس البراندات المعروفة مع شعاراتها
    const BRAND_LOGOS = {
      'pubg': 'https://api.stark-card.com/images/category/1600-1744283287.webp',
      'free fire': 'https://api.stark-card.com/images/category/1640-1751591733.webp',
      'yalla ludo': 'https://api.stark-card.com/images/category/1600-1744397349.webp',
      'yalla': 'https://api.stark-card.com/images/category/1600-1744397349.webp',
      'jawaker': 'https://api.stark-card.com/images/category/1600-1744399680.webp',
      'tiktok': 'https://api.stark-card.com/images/category/1600-1744361599.webp',
      'meyo': 'https://api.stark-card.com/images/product/1668-1747124531.webp',
      'unlocktool': 'https://api.stark-card.com/images/category/1600-1746627504.webp',
      'chimera': 'https://api.stark-card.com/images/category/1600-1746627683.webp',
      'dft': 'https://api.stark-card.com/images/category/1600-1746627328.webp',
      'itunes': 'https://api.stark-card.com/images/category/1600-1744303391.webp',
      'google': 'https://api.stark-card.com/images/category/1600-1746523051.webp'
    };

    // الحصول على صورة مناسبة
    const getServiceImage = (service) => {
      const lowerName = (service.name || '').toLowerCase();
      
      for (const [keyword, logo] of Object.entries(BRAND_LOGOS)) {
        if (lowerName.includes(keyword)) {
          return logo;
        }
      }
      
      const encodedName = encodeURIComponent(service.name || 'Service');
      return `https://placehold.co/400x300/1a1a2e/00d4ff/png?text=${encodedName}&font=cairo`;
    };

    // جلب دفعة من الخدمات
    const allServices = await base44.asServiceRole.entities.Service.list('-created_date', 2000);
    const batch = allServices.slice(offset, offset + batchSize);
    
    let updatedCount = 0;
    const updates = [];

    // معالجة الدفعة مع تأخير صغير بين العمليات
    for (const service of batch) {
      try {
        const improvedImage = getServiceImage(service);
        
        const needsUpdate = !service.image_url || 
                           service.image_url.includes('placehold.co/600x400');
        
        if (needsUpdate) {
          await base44.asServiceRole.entities.Service.update(service.id, {
            ...service,
            image_url: improvedImage
          });
          
          updatedCount++;
          updates.push({
            id: service.id,
            name: service.name,
            image: improvedImage
          });
          
          // تأخير 100ms بين العمليات لتجنب Rate Limit
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error updating service ${service.id}:`, error.message);
      }
    }

    const hasMore = (offset + batchSize) < allServices.length;

    return Response.json({
      success: true,
      message: `✅ تم معالجة دفعة ${offset} - ${offset + batch.length}`,
      stats: {
        processed: batch.length,
        updated: updatedCount,
        total: allServices.length,
        progress: Math.round(((offset + batch.length) / allServices.length) * 100)
      },
      hasMore,
      nextOffset: offset + batchSize,
      updates: updates.slice(0, 5)
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message
    }, { status: 500 });
  }
});