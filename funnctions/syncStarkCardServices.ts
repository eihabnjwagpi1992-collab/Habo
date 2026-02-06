export default async function syncStarkCardServices(inputs, context) {
  const { providerId } = inputs;

  try {
    const providers = await context.entities.APIProvider.filter({ id: providerId });
    const provider = providers?.[0];

    if (!provider) return { success: false, error: 'المزود غير موجود' };
    if (!provider.is_active) return { success: false, error: 'المزود معطل' };
    if (!provider.api_key) return { success: false, error: 'API Key مفقود' };

    let url = provider.base_url;
    if (!url.endsWith('/')) url += '/';
    url += 'client/api/products';

    const headers = {
      'Content-Type': 'application/json',
      'api-token': provider.api_key
    };

    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const services = Array.isArray(data) ? data : [];

    if (!services.length) return { success: false, error: 'لم يتم العثور على خدمات' };

    let created = 0, updated = 0, failed = 0;

    for (const service of services) {
      try {
        const price = parseFloat(service.price || service.base_price || 0);
        if (isNaN(price) || price <= 0) { failed++; continue; }

        let finalPrice = price;
        if (provider.margin_type === 'percentage') {
          finalPrice = price * (1 + (provider.margin_value || 0) / 100);
        } else if (provider.margin_type === 'fixed') {
          finalPrice = price + (provider.margin_value || 0);
        }

        const groupName = service.category_name || 'General';
        const categoryKey = groupName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        // التأكد من وجود الفئة الأصلية
        const existingCats = await context.entities.ServiceCategory.filter({ category_key: categoryKey });
        if (existingCats.length === 0) {
          await context.entities.ServiceCategory.create({
            title: groupName,
            category_key: categoryKey,
            is_active: true,
            sort_order: 100
          });
        }

        const serviceData = {
          name: service.name || 'خدمة',
          description: service.category_name || '',
          category: categoryKey, // الربط التلقائي بالفئة
          subcategory: groupName,
          price: Math.round(finalPrice * 100) / 100,
          base_cost: price,
          provider_id: providerId,
          external_service_id: String(service.id),
          processing_time: '1-24 ساعة',
          is_active: service.available !== false,
          sync_source: 'provider',
          last_synced_at: new Date().toISOString()
        };

        const existing = await context.entities.Service.filter({
          provider_id: providerId,
          external_service_id: String(service.id)
        });

        if (existing?.length > 0) {
          await context.entities.Service.update(existing[0].id, serviceData);
          updated++;
        } else {
          await context.entities.Service.create(serviceData);
          created++;
        }
      } catch (e) {
        failed++;
      }
    }

    await context.entities.APIProvider.update(providerId, { last_sync: new Date().toISOString() });

    return {
      success: true,
      created,
      updated,
      total: created + updated,
      failed,
      message: `تم معالجة ${created + updated} خدمة`
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
