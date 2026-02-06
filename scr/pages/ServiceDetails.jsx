import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Loader2, ArrowRight, CheckCircle, AlertCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { usePriceCalculator } from '@/hooks/usePriceCalculator';

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { calculatePrice } = usePriceCalculator();
  
  // حالة حقول الإدخال
  const [inputs, setInputs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. جلب تفاصيل الخدمة
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      // محاولة جلب الخدمة بالمعرف
      const result = await base44.entities.Service.list(); 
      // ملاحظة: إذا كان الـ API يدعم getById يفضل استخدامه، هنا نفلتر يدوياً للأمان
      const found = (result.items || result).find(s => s.id === id);
      if (!found) throw new Error("Service not found");
      return found;
    }
  });

  // 2. معالجة الطلب (إنشاء طلب جديد)
  const handleOrder = async () => {
    if (!service) return;
    
    // تحقق بسيط (يمكنك تعقيده حسب متطلبات الخدمة)
    const requiredField = service.requires_player_id ? 'player_id' : 'email'; // مثال
    // هنا نفترض أننا نجمع البيانات في حقل واحد للملاحظات أو حسب هيكلة الـ API الخاص بك
    
    setIsSubmitting(true);
    try {
      const finalPrice = calculatePrice(service.price, service.category);
      
      await base44.entities.Order.create({
        service_id: service.id,
        service_name: service.name,
        amount: finalPrice,
        status: 'pending',
        // inputs: inputs // أرسل المدخلات إذا كان الـ API يدعمها
        notes: JSON.stringify(inputs) // أو خزنها في الملاحظات
      });

      toast({
        title: "تم استلام طلبك بنجاح!",
        description: `جاري معالجة طلب ${service.name}`,
        variant: "default",
        className: "bg-green-600 text-white border-none"
      });

      // توجيه للمستخدم لصفحة الطلبات بعد ثانية
      setTimeout(() => navigate('/orders'), 1500);

    } catch (error) {
      toast({
        title: "خطأ في الطلب",
        description: "يرجى المحاولة مرة أخرى أو التأكد من الرصيد.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  // --- واجهة التحميل ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
        <p className="text-gray-400">جاري تحميل تفاصيل الخدمة...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">الخدمة غير متوفرة</h2>
        <Button onClick={() => navigate('/')} variant="outline">عودة للرئيسية</Button>
      </div>
    );
  }

  // تحديد الصورة
  const imgUrl = service.image_url || service.image || "https://source.unsplash.com/random/800x450/?technology,card";
  const displayPrice = calculatePrice(service.price, service.category);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button 
        onClick={() => navigate(-1)} 
        variant="ghost" 
        className="mb-6 text-gray-400 hover:text-white"
      >
        <ArrowRight className="w-4 h-4 ml-2" /> رجوع
      </Button>

      <div className="grid md:grid-cols-2 gap-8 bg-gray-900/50 p-6 rounded-3xl border border-gray-800">
        
        {/* قسم الصورة والمعلومات */}
        <div>
          <div className="rounded-2xl overflow-hidden mb-6 border border-gray-700 aspect-video relative">
             <img 
               src={imgUrl} 
               alt={service.name} 
               className="w-full h-full object-cover"
               onError={(e) => { e.currentTarget.src = "https://placehold.co/600x400?text=No+Image"; }}
             />
             <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <span className="bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {service.category || "عام"}
                </span>
             </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{service.name}</h1>
          <p className="text-gray-400 leading-relaxed mb-4">
            {service.description || "لا يوجد وصف إضافي لهذه الخدمة. يرجى التأكد من البيانات المطلوبة قبل الطلب."}
          </p>
          <div className="flex items-center gap-2 text-green-400 bg-green-900/20 w-fit px-3 py-1 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" /> خدمة فورية
          </div>
        </div>

        {/* قسم الطلب والدفع */}
        <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800 flex flex-col">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-gray-800 pb-4">تنفيذ الطلب</h2>
          
          <div className="space-y-4 flex-1">
            {/* هنا يمكنك إضافة حقول ديناميكية بناء على نوع الخدمة */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">رقم الحساب / المعرف (ID)</label>
              <Input 
                name="target_id" 
                placeholder="أدخل المعرف الخاص بك هنا..." 
                className="bg-gray-900 border-gray-700 focus:border-cyan-500"
                onChange={handleInputChange}
              />
            </div>
            
            {/* ملاحظات إضافية */}
             <div>
              <label className="text-sm text-gray-400 mb-1 block">ملاحظات (اختياري)</label>
              <Input 
                name="note" 
                placeholder="أي تفاصيل إضافية؟" 
                className="bg-gray-900 border-gray-700"
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400">الإجمالي:</span>
              <span className="text-3xl font-bold text-cyan-400">${Number(displayPrice).toFixed(2)}</span>
            </div>
            
            <Button 
              onClick={handleOrder} 
              disabled={isSubmitting}
              className="w-full h-12 text-lg font-bold bg-cyan-600 hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري التنفيذ...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 ml-2" /> تأكيد وشراء
                </>
              )}
            </Button>
            <p className="text-xs text-center text-gray-500 mt-3">
              بالنقر على الشراء أنت توافق على شروط الخدمة وسياسة الاستخدام.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
