import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { providerId } = payload;

    if (!providerId) {
      return Response.json({ error: 'providerId required' }, { status: 400 });
    }

    const provider = await base44.asServiceRole.entities.APIProvider.filter({ id: providerId });
    if (!provider?.[0]) {
      return Response.json({ error: 'Provider not found' }, { status: 404 });
    }

    const providerData = provider[0];
    const logs = [];

    const addLog = (type, message, details = null) => {
      logs.push({
        type,
        message,
        details,
        timestamp: new Date().toLocaleTimeString('ar')
      });
    };

    try {
      addLog('info', 'خطوة 1: التحقق من بيانات المزود...', null);

      if (!providerData.is_active) {
        throw new Error('المزود غير مفعل');
      }

      addLog('success', 'تم العثور على المزود', {
        name: providerData.name,
        url: providerData.base_url,
        is_active: providerData.is_active,
      });

      addLog('info', 'خطوة 2: جلب الخدمات من API...', null);

      let url = providerData.base_url;
      if (!url.endsWith('/')) url += '/';
      // Try multiple possible API endpoints
      const possibleEndpoints = [
        'client/api/products',
        'api/products',
        'products',
        'api/services',
        'services'
      ];
      
      let lastError;
      for (const endpoint of possibleEndpoints) {
        const testUrl = url + endpoint;
        try {
          const testResponse = await fetch(testUrl, { method: 'GET', headers });
          if (testResponse.ok) {
            url = testUrl;
            console.log('✅ Found working endpoint:', url);
            break;
          }
        } catch (e) {
          lastError = e;
        }
      }

      const headers = { 'Content-Type': 'application/json' };
      if (providerData.api_key) headers['api-token'] = providerData.api_key;

      const apiResponse = await fetch(url, { method: 'GET', headers });
      const responseText = await apiResponse.text();

      if (!apiResponse.ok) {
        throw new Error(`خطأ API: ${apiResponse.status} - ${responseText.substring(0, 200)}`);
      }

      let services;
      try {
        services = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`صيغة رد غير صحيحة: ${e.message}`);
      }

      // Handle different API response formats
      if (Array.isArray(services)) {
        // Direct array response
      } else if (services.data && Array.isArray(services.data)) {
        services = services.data;
      } else if (services.products && Array.isArray(services.products)) {
        services = services.products;
      } else if (services.services && Array.isArray(services.services)) {
        services = services.services;
      } else {
        throw new Error(`صيغة استجابة غير متوقعة: ${JSON.stringify(services).substring(0, 100)}`);
      }

      addLog('success', `تم جلب ${services.length} خدمة من API`, null);

      addLog('info', 'خطوة 3: حفظ الخدمات في قاعدة البيانات...', null);

      let created = 0, updated = 0, failed = 0;

      for (const service of services) {
        try {
          const price = parseFloat(service.price || 0);
          if (isNaN(price)) {
            failed++;
            continue;
          }

          let finalPrice = price;
          if (providerData.margin_type === 'percentage') {
            finalPrice = price * (1 + (providerData.margin_value || 0) / 100);
          } else if (providerData.margin_type === 'fixed') {
            finalPrice = price + (providerData.margin_value || 0);
          }

          const serviceData = {
            name: service.name || 'خدمة',
            description: service.category_name || '',
            category: 'game_topup',
            subcategory: service.category_name || '',
            price: Math.round(finalPrice * 100) / 100,
            base_cost: price,
            provider_id: providerId,
            external_service_id: String(service.id),
            processing_time: service.processing_time || '1-24 ساعة',
            is_active: true,
            sync_source: 'provider',
            last_synced_at: new Date().toISOString()
          };

          const existing = await base44.asServiceRole.entities.Service.filter({
            provider_id: providerId,
            external_service_id: String(service.id)
          });

          if (existing?.length > 0) {
            await base44.asServiceRole.entities.Service.update(existing[0].id, serviceData);
            updated++;
          } else {
            await base44.asServiceRole.entities.Service.create(serviceData);
            created++;
          }
        } catch (e) {
          console.error('Error processing service:', e);
          failed++;
        }
      }

      await base44.asServiceRole.entities.APIProvider.update(providerId, {
        last_sync: new Date().toISOString()
      });

      addLog('success', 'اكتملت المزامنة بنجاح!', {
        total: created + updated,
        created,
        updated,
        failed,
      });

      return Response.json({
        success: true,
        logs,
        stats: { created, updated, failed, total: created + updated }
      });

    } catch (error) {
      addLog('error', 'خطأ في المزامنة', error.message);
      return Response.json({
        success: false,
        logs,
        error: error.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});