import { useQuery } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';

export function usePriceCalculator() {
  const { data: settings = [] } = useQuery({
    queryKey: ['pricing-settings'],
    queryFn: () => base44.entities.PricingSettings.list(),
    staleTime: 1000 * 60 * 5, 
  });

  const calculatePrice = (originalPrice, categoryId) => {
    // 1. تحويل السعر لرقم نظيف
    const cost = parseFloat(originalPrice) || 0;
    if (cost === 0) return 0;

    // 2. البحث عن القواعد
    // البحث عن قاعدة الفئة المحددة
    const categoryRule = settings.find(s => s.setting_key === `category_${categoryId}`);
    // البحث عن القاعدة العامة
    const globalRule = settings.find(s => s.setting_key === 'global');

    // 3. منطق الأولوية الصارم (هذا هو الحل للمشكلة)
    // نحدد متغيراً واحداً فقط للقاعدة المستخدمة
    let activeRule = null;

    if (categoryRule) {
        // أ. إذا وجدنا إعداداً خاصاً للفئة، نستخدمه ونلغي العام تماماً
        // حتى لو كانت القيمة 0، طالما القاعدة موجودة في الداتابيز فهي الأقوى
        activeRule = categoryRule;
    } else {
        // ب. إذا لم نجد إعداداً للفئة، نلجأ للإعداد العام
        activeRule = globalRule;
    }

    // إذا لم توجد أي قواعد في النظام، نرجع السعر الأصلي
    if (!activeRule) return cost;

    // 4. حساب السعر بناءً على القاعدة المختارة فقط
    const profitType = activeRule.profit_type || 'fixed';
    const profitValue = parseFloat(activeRule.profit_value) || 0;

    let finalPrice = cost;

    if (profitType === 'percent') {
      // معادلة النسبة: السعر + (السعر * النسبة / 100)
      finalPrice = cost + (cost * profitValue / 100);
    } else {
      // معادلة الثابت: السعر + القيمة الثابتة
      finalPrice = cost + profitValue;
    }

    // تقريب السعر لمنزلتين عشريتين
    return parseFloat(finalPrice.toFixed(2));
  };

  return { calculatePrice, isLoading: !settings.length };
}
