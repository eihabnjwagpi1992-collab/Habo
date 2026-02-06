import React from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Gamepad2, 
  Globe,
  Download,
  ChevronRight,
  ShieldCheck,
  Zap,
  Box
} from "lucide-react";
import { motion } from "framer-motion";
import GlowCard from "@/components/ui/GlowCard";

export default function ServiceCategories() {
  const categories = [
    {
      id: "all",
      icon: null,
      title: "الكل",
      description: "جميع الخدمات المتاحة",
      features: [],
      color: "cyan",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      id: "game_topup",
      icon: Gamepad2,
      title: "شحن الألعاب",
      description: "شحن فوري للألعاب الشهيرة بأفضل الأسعار",
      features: ["PUBG", "Free Fire", "Call of Duty", "Fortnite"],
      color: "purple",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      id: "live_apps",
      icon: Globe,
      title: "تطبيقات اللايف والبث المباشر",
      description: "شحن تطبيقات البث المباشر والتواصل الاجتماعي",
      features: ["Yalla Ludo", "Jawaker", "Bigo Live", "TikTok"],
      color: "pink",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      id: "tool_activation",
      icon: Zap,
      title: "تفعيل الأدوات والكرديت",
      description: "تفعيل الأدوات والكريديتات الرقمية",
      features: ["تفعيل الأدوات", "كريديت Google", "iTunes", "TikTok"],
      color: "green",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      id: "device_unlock",
      icon: ShieldCheck,
      title: "فتح الأجهزة",
      description: "خدمات فتح الإيمي والأنلوك الاحترافية",
      features: ["فتح IMEI", "فتح التفعيل", "إلغاء التحديد", "فحص الشبكة"],
      color: "cyan",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      id: "support_files",
      icon: Download,
      title: "ملفات السبورت والروت",
      description: "ملفات روت وPIT وأدوات إصلاح الهواتف",
      features: ["Root Files", "PIT Files", "MDM Tools", "IMEI Tools"],
      color: "purple",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Our <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">Services</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Comprehensive digital and GSM solutions for technicians, resellers, and end users
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
           {categories.map((category, index) => {
             const IconComponent = category.icon || Box;
             return (
             <motion.div
               key={category.id}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.1 }}
             >
               <Link to={category.id === 'support_files' ? createPageUrl("SupportFiles") : createPageUrl("Services") + (category.id !== 'all' ? `?category=${category.id}` : '')}>
                 <GlowCard 
                   glowColor={category.color}
                   className="p-8 h-full cursor-pointer group"
                 >
                   <div className="flex items-start gap-6">
                     <div className={`p-4 rounded-2xl bg-gradient-to-br ${category.gradient} bg-opacity-20`}>
                       <IconComponent className="w-8 h-8 text-white" />
                     </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                        {category.title}
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </h3>
                      <p className="text-gray-400 mb-4 leading-relaxed">
                        {category.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {category.features.map((feature, i) => (
                          <span 
                            key={i}
                            className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-300 border border-white/10"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </GlowCard>
              </Link>
            </motion.div>
            );
            })}
            </div>
      </div>
    </section>
  );
}