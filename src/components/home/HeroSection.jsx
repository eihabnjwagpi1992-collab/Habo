import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/components/LanguageContext";
import { usePriceCalculator } from '@/hooks/usePriceCalculator';

export default function HeroSection() {
  const { t } = useLanguage();
  
  // 1. تفعيل حاسبة الأسعار
  const { calculatePrice, isLoading: isLoadingPrices } = usePriceCalculator();

  // 2. جلب الخدمات المميزة
  const { data: featuredServices = [], isLoading: isLoadingServices } = useQuery({
    queryKey: ['featured-services-hero'],
    queryFn: () => base44.entities.Service.filter({ is_featured: true, is_active: true }, '-created_date', 4),
    initialData: [],
  });

  // دمج حالات التحميل
  const isPageLoading = isLoadingServices || isLoadingPrices;

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-8">
              <Zap className="w-4 h-4" />
              {t('professionalGSMServices') || 'المنصة الاحترافية الأولى لخدمات المحمول'}
            </div>
          </motion.div>

          {/* 🔥🔥🔥 الاسم الاحترافي موجود هنا 🔥🔥🔥 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col items-center justify-center mb-8"
          >
            <span className="text-xl md:text-2xl font-medium text-gray-300 mb-2">
              {t('welcomeTo') || 'أهلاً بك في'}
            </span>
            <div className="flex items-center justify-center flex-wrap gap-2 md:gap-4 leading-none">
              <span className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-lg">
                Tsmart
              </span>
              <span className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-tighter drop-shadow-lg">
                GSM
              </span>
              <div className="relative -mt-4 md:-mt-6 ml-2">
                 <div className="absolute inset-0 bg-cyan-500/40 blur-2xl rounded-full"></div>
                 <span className="relative block bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xl md:text-3xl font-black px-4 py-1 rounded-full border-2 border-cyan-400/50 tracking-[0.15em] shadow-[0_0_30px_rgba(6,182,212,0.6)] rotate-3 transform hover:rotate-0 transition-transform duration-300">
                   PRO
                 </span>
              </div>
            </div>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {t('heroDescription') || 'بوابتك الشاملة لخدمات السوفت وير، فك الشفرات، وتفعيل الأدوات الاحترافية بأفضل الأسعار.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link to={createPageUrl("Services")}>
              <Button 
                className="text-white px-8 py-6 text-lg rounded-xl font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all"
                style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
              >
                {t('exploreServices') || 'تصفح الخدمات'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to={createPageUrl("Dashboard")}>
              <Button 
                variant="outline" 
                className="px-8 py-6 text-lg rounded-xl font-bold hover:bg-white/5 transition-all"
                style={{
                  borderColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  backgroundColor: 'transparent'
                }}
              >
                {t('myDashboard') || 'لوحة التحكم'}
              </Button>
            </Link>
          </motion.div>

          {/* 🔥 قسم الكروت مع إصلاح التحميل والسعر 🔥 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left"
          >
            {isPageLoading ? (
              // ✅ Skeleton Loading: يظهر أثناء التحميل بدلاً من ترك المكان فارغاً
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-48 flex flex-col items-center justify-center animate-pulse">
                   <div className="w-14 h-14 bg-white/10 rounded-xl mb-4"></div>
                   <div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
                   <div className="h-6 w-16 bg-white/10 rounded"></div>
                </div>
              ))
            ) : (
              featuredServices.map((service) => {
                // ✅ حساب السعر النهائي
                const finalPrice = calculatePrice(service.price, service.category_id || service.category);
                return (
                  <Link key={service.id} to={createPageUrl('OrderService') + `?id=${service.id}`}>
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 hover:border-cyan-500/30 transition-all group cursor-pointer h-full flex flex-col">
                      {service.image_url ? (
                        <img 
                          src={service.image_url} 
                          alt={service.name}
                          className="w-14 h-14 object-contain mx-auto mb-4 group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Zap className="w-7 h-7 text-cyan-400" />
                        </div>
                      )}
                      <div className="text-sm font-semibold text-white mb-2 line-clamp-2 flex-grow">{service.name}</div>
                      <div className="text-xl font-black text-cyan-400 mt-auto">
                          ${Number(finalPrice).toFixed(2)}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
