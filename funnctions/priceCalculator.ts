import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * حساب السعر الفعلي حسب رتبة المستخدم
 * يتم استدعاؤها من كل مكان يحتاج للسعر
 */
export async function getEffectivePrice(base44, service, userEmail) {
  try {
    // جلب بيانات المستخدم لمعرفة الرتبة
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    const user = users[0];

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    let basePrice = service.price || 0;

    // تطبيق السعر حسب الرتبة
    switch (user.tier) {
      case 'gold':
        if (service.big_seller_price) {
          basePrice = service.big_seller_price;
        }
        break;
      case 'silver':
        if (service.reseller_price) {
          basePrice = service.reseller_price;
        }
        break;
      case 'regular':
      default:
        basePrice = service.price || 0;
        break;
    }

    // جلب إعدادات التسعير العام والخصوم
    const pricingSettings = await base44.asServiceRole.entities.PricingSettings.filter({
      setting_key: 'global'
    });

    let finalPrice = basePrice;

    // تطبيق الخصم إذا كان موجوداً حسب الرتبة
    if (pricingSettings.length > 0) {
      const settings = pricingSettings[0];
      let discountPercent = 0;

      switch (user.tier) {
        case 'gold':
          discountPercent = settings.big_seller_discount_percent || 0;
          break;
        case 'silver':
          discountPercent = settings.reseller_discount_percent || 0;
          break;
      }

      if (discountPercent > 0) {
        finalPrice = basePrice * (1 - discountPercent / 100);
      }
    }

    return {
      base_price: service.price,
      effective_price: finalPrice,
      user_tier: user.tier,
      discount_applied: basePrice !== finalPrice
    };
  } catch (error) {
    console.error('خطأ في حساب السعر:', error);
    throw error;
  }
}

// API endpoint للحصول على السعر الفعلي من الفرونت
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service_id } = await req.json();

    const services = await base44.asServiceRole.entities.Service.filter({ id: service_id });
    if (!services[0]) {
      return Response.json({ error: 'Service not found' }, { status: 404 });
    }

    const priceInfo = await getEffectivePrice(base44, services[0], user.email);
    return Response.json(priceInfo);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});