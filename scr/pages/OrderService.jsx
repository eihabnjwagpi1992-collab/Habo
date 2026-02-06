import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle, ArrowLeft, Wallet, CheckCircle } from 'lucide-react';
import DynamicOrderForm from '@/components/DynamicOrderForm';
import { toast } from "sonner";
import GlowCard from '@/components/ui/GlowCard';
import { Button } from '@/components/ui/button';
import { createPageUrl } from "@/utils";
// 1. استيراد هوك التسعير
import { usePriceCalculator } from '@/hooks/usePriceCalculator';

export default function OrderService() {
  const navigate = useNavigate();
  const { id: paramId } = useParams(); 
  const [searchParams] = useSearchParams();
  const serviceId = paramId || searchParams.get('id') || searchParams.get('serviceId');
  
  const queryClient = useQueryClient();

  // 2. تفعيل هوك التسعير
  const { calculatePrice } = usePriceCalculator();

  // جلب الخدمة
  const { data: rawService, isLoading: isLoadingService, isError } = useQuery({
    queryKey: ['service-details', serviceId],
    queryFn: async () => {
      if (!serviceId) throw new Error("No Service ID");
      return await base44.entities.Service.get(serviceId);
    },
    enabled: !!serviceId,
  });

  // جلب المستخدم
  const { data: userData } = useQuery({ 
    queryKey: ['me'], 
    queryFn: () => base44.auth.me() 
  });

  const userBalance = useMemo(() => {
    if (!userData) return 0;
    return Number(userData.balance ?? userData.data?.balance ?? 0);
  }, [userData]);

  // 3. تجهيز الخانات + حساب السعر النهائي
  const service = useMemo(() => {
    if (!rawService) return null;
    
    // 🔥 حساب السعر الجديد بناءً على الفئة والقواعد
    const finalPrice = calculatePrice(rawService.price, rawService.category_id || rawService.category);

    // المنطق الذكي للحقول (كما هو)
    const hasFields = (rawService.fields?.length > 0) || (rawService.custom_inputs?.length > 0);
    let smartFields = rawService.fields || rawService.custom_inputs || [];

    if (!hasFields) {
        const name = rawService.name ? rawService.name.toLowerCase() : "";
        
        if (name.includes("remote") || name.includes("teamviewer")) {
        smartFields.push({ name: "remote_address", label: "TeamViewer / AnyDesk", type: "text", required: true });
        } else if (name.includes("imei") || name.includes("iphone") || name.includes("samsung")) {
        smartFields.push({ name: "imei", label: "IMEI (15 Digits)", type: "text", required: true, pattern: "^[0-9]{15}$" });
        } else if (name.includes("pubg") || name.includes("id")) {
        smartFields.push({ name: "player_id", label: "Player ID", type: "text", required: true });
        } else if (name.includes("link")) {
        smartFields.push({ name: "link", label: "Link", type: "url", required: true });
        } else {
        smartFields.push({ name: "notes", label: "ملاحظات / البيانات المطلوبة", type: "text", required: true });
        }
    }

    // إرجاع كائن الخدمة مع السعر الجديد والحقول
    return { 
        ...rawService, 
        price: finalPrice, // 👈 تحديث السعر هنا ليستخدم في العرض والطلب
        fields: smartFields, 
        custom_inputs: smartFields 
    };
  }, [rawService, calculatePrice]);

  // 4. عملية الطلب
  const createOrderMutation = useMutation({
    mutationFn: async (formData) => {
      const currentUser = await base44.auth.me();
      const currentBalance = Number(currentUser.balance || 0);
      
      // نستخدم service.price لأنه يحتوي الآن على السعر المحسوب
      const price = Number(service.price);

      if (currentBalance < price) {
          throw new Error(`رصيدك غير كافٍ (${currentBalance}$)!`);
      }

      // خصم الرصيد
      await base44.entities.User.update(currentUser.id, {
          balance: currentBalance - price
      });

      // إنشاء الطلب
      const newOrder = await base44.entities.Order.create({
          user_id: currentUser.id,
          created_by_id: currentUser.id,
          service_id: serviceId,
          service_name: service.name,
          price: price, // تخزين السعر النهائي المحسوب
          amount: price,
          status: "pending", 
          custom_inputs: formData.fields || formData,
          created_at: new Date().toISOString()
      });
      return newOrder;
    },
    onSuccess: () => {
      toast.success('تم استلام طلبك بنجاح!', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['my-orders-list'] }); 
      queryClient.invalidateQueries({ queryKey: ['me'] }); 
      setTimeout(() => navigate(createPageUrl('Orders')), 1000);
    },
    onError: (error) => {
      toast.error(error.message || "حدث خطأ أثناء الطلب");
    },
  });

  if (isLoadingService) return <div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin text-cyan-500"/></div>;
  
  if (isError || !service) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <GlowCard className="p-8 text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-white font-bold">الخدمة غير متوفرة حالياً</h3>
        <Button onClick={() => navigate(-1)} className="mt-4 w-full">عودة</Button>
      </GlowCard>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-gray-400 mb-6 flex gap-2"><ArrowLeft className="w-5 h-5"/> عودة</button>

        <GlowCard className="p-4 mb-6 flex justify-between items-center border-l-4 border-cyan-500 bg-gray-900/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-full">
              <Wallet className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">رصيد حسابك</p>
              <h3 className="text-lg font-bold text-white font-mono">{userBalance.toFixed(2)} $</h3>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-8 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">{service.name}</h1>
            <div className="flex items-center gap-3">
                {/* عرض السعر المحسوب */}
               <span className="text-cyan-400 font-mono text-lg bg-cyan-950/30 border border-cyan-500/20 px-3 py-1 rounded">
                 {Number(service.price).toFixed(2)} $
               </span>
               <span className="text-xs text-green-400 flex items-center gap-1">
                 <CheckCircle className="w-3 h-3" /> خدمة فورية
               </span>
            </div>
        </GlowCard>

        <GlowCard className="p-8">
          <DynamicOrderForm
            service={service}
            user={userData}
            userBalance={userBalance}
            effectivePrice={service.price} // تمرير السعر الجديد للفورم
            onSubmit={(formData) => createOrderMutation.mutate(formData)}
            isLoading={createOrderMutation.isPending}
          />
        </GlowCard>
      </div>
    </div>
  );
}
