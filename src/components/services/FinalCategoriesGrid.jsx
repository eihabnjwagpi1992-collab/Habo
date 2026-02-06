import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Smartphone, ShieldCheck, Cpu, Lock, Gamepad2, 
  Globe, Wrench, CreditCard, Monitor, Share2 
} from 'lucide-react';
import GlowCard from "@/components/ui/GlowCard";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: 'apple_icloud', titleAr: 'خدمات آبل وآيكلود', icon: Smartphone, color: 'blue', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'samsung', titleAr: 'خدمات سامسونج', icon: Cpu, color: 'blue', gradient: 'from-blue-700 to-blue-500' },
  { id: 'xiaomi', titleAr: 'خدمات شاومي', icon: Lock, color: 'orange', gradient: 'from-orange-500 to-red-500' },
  { id: 'frp_security', titleAr: 'حماية و تخطي FRP', icon: ShieldCheck, color: 'red', gradient: 'from-red-500 to-orange-500' },
  { id: 'tools_activation', titleAr: 'تفعيل البوكسات والأدوات', icon: Wrench, color: 'green', gradient: 'from-green-500 to-emerald-500' },
  { id: 'tools_credits', titleAr: 'كريديت الأدوات', icon: CreditCard, color: 'yellow', gradient: 'from-yellow-500 to-orange-500' },
  { id: 'game_topup', titleAr: 'شحن ألعاب', icon: Gamepad2, color: 'purple', gradient: 'from-purple-500 to-pink-500' },
  { id: 'live_streaming', titleAr: 'تطبيقات البث المباشر', icon: Globe, color: 'pink', gradient: 'from-pink-500 to-rose-500' },
  { id: 'remote_services', titleAr: 'خدمات عن بعد', icon: Monitor, color: 'cyan', gradient: 'from-cyan-500 to-blue-500' },
  { id: 'social_media', titleAr: 'خدمات السوشيال ميديا', icon: Share2, color: 'indigo', gradient: 'from-indigo-500 to-purple-500' }
];

export default function FinalCategoriesGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
      {CATEGORIES.map((cat, index) => {
        const Icon = cat.icon;
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={`${createPageUrl('Services')}?category=${cat.id}`}>
              <GlowCard
                glowColor={cat.color}
                className="p-4 h-full flex flex-col items-center text-center group cursor-pointer hover:scale-105 transition-all"
              >
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${cat.gradient} mb-3 text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {cat.titleAr}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  عرض الخدمات
                </p>
              </GlowCard>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
