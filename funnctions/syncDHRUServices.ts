import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ... (دالة parseServicesFromHTML تبقى كما هي)

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const payload = await req.json();
    const { providerId, email, password } = payload;
    const providers = await base44.asServiceRole.entities.APIProvider.filter({ id: providerId });
    const provider = providers?.[0];
    if (!provider) return Response.json({ error: 'Provider not found' }, { status: 404 });

    // ... (منطق تسجيل الدخول وجلب البيانات يبقى كما هو)

    const serviceList = successData.LIST;
    let created = 0, updated = 0, failed = 0;

    for (const groupName in serviceList) {
      const group = serviceList[groupName];
      if (!group?.SERVICES) continue;

      // إنشاء الفئة تلقائياً إذا لم تكن موجودة
      const categoryKey = groupName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const existingCats = await base44.asServiceRole.entities.ServiceCategory.filter({ category_key: categoryKey });
      if (existingCats.length === 0) {
        await base44.asServiceRole.entities.ServiceCategory.create({
          title: groupName,
          category_key: categoryKey,
          is_active: true,
          sort_order: 100
        });
      }

      for (const serviceId in group.SERVICES) {
        try {
          const dhruService = group.SERVICES[serviceId];
          const price = parseFloat(dhruService.CREDIT || 0);
          let finalPrice = price;
          if (provider.margin_type === 'percentage') finalPrice = price * (1 + (provider.margin_value || 0) / 100);
          else if (provider.margin_type === 'fixed') finalPrice = price + (provider.margin_value || 0);

          const serviceData = {
            name: dhruService.SERVICENAME,
            description: dhruService.INFO || '',
            category: categoryKey, // الربط بالفئة الأصلية
            subcategory: groupName,
            input_type: 'IMEI_SERVICE',
            price: Math.round(finalPrice * 100) / 100,
            base_cost: price,
            provider_id: providerId,
            external_service_id: String(dhruService.SERVICEID),
            processing_time: dhruService.TIME || '24 hours',
            is_active: true,
            sync_source: 'provider',
            last_synced_at: new Date().toISOString()
          };

          const existing = await base44.asServiceRole.entities.Service.filter({ provider_id: providerId, external_service_id: String(dhruService.SERVICEID) });
          if (existing?.length > 0) { await base44.asServiceRole.entities.Service.update(existing[0].id, serviceData); updated++; }
          else { await base44.asServiceRole.entities.Service.create(serviceData); created++; }
        } catch (e) { failed++; }
      }
    }
    return Response.json({ success: true, created, updated, total: created + updated });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
});
