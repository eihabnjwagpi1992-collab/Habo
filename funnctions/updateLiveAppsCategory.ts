import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // قائمة الكلمات المفتاحية لتطبيقات اللايف والبث
    const liveAppsKeywords = [
      'tiktok',
      'yalla',
      'ludo',
      'jawaker',
      'bigo',
      'meyo',
      'live',
      'imo',
      'clubhouse',
      'houseparty'
    ];

    // جلب كل الخدمات
    const allServices = await base44.asServiceRole.entities.Service.list('-created_date', 1000);

    let updatedCount = 0;
    const updates = [];

    for (const service of allServices) {
      const serviceName = (service.name || '').toLowerCase();
      
      // فحص إذا كانت الخدمة تحتوي على كلمة مفتاحية من تطبيقات اللايف
      const isLiveApp = liveAppsKeywords.some(keyword => serviceName.includes(keyword));
      
      if (isLiveApp && service.category === 'game_topup') {
        // تحديث التصنيف إلى live_apps
        await base44.asServiceRole.entities.Service.update(service.id, {
          ...service,
          category: 'live_apps'
        });
        updatedCount++;
        updates.push(service.name);
      }
    }

    return Response.json({
      success: true,
      message: `تم تحديث ${updatedCount} خدمة إلى تصنيف تطبيقات اللايف`,
      updatedServices: updates
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});