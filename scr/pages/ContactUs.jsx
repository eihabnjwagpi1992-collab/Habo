import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { 
  MessageCircle,
  Mail,
  Phone,
  Globe,
  Loader2
} from "lucide-react";
import GlowCard from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function ContactUs() {
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['contact-channels'],
    queryFn: () => base44.entities.ContactChannel.filter({ is_active: true }, 'sort_order'),
    initialData: [],
  });

  const iconMap = {
    WhatsApp: MessageCircle,
    Telegram: MessageCircle,
    Email: Mail,
    Phone: Phone,
    Website: Globe,
  };

  const colorMap = {
    WhatsApp: 'from-green-500 to-emerald-500',
    Telegram: 'from-blue-500 to-cyan-500',
    Email: 'from-purple-500 to-pink-500',
    Phone: 'from-orange-500 to-amber-500',
    Website: 'from-indigo-500 to-blue-500',
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            تواصل <span className="text-cyan-400">معنا</span>
          </h1>
          <p className="text-gray-400 text-lg">نحن هنا للمساعدة! اختر قناة التواصل المفضلة</p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : channels.length === 0 ? (
          <div className="text-center py-20">
            <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">لا توجد قنوات تواصل متاحة حالياً</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {channels.map((channel, index) => {
              const Icon = iconMap[channel.type] || MessageCircle;
              const gradient = colorMap[channel.type] || 'from-cyan-500 to-blue-500';
              
              return (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <GlowCard className="p-6 h-full">
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${gradient}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {channel.label}
                        </h3>
                        <p className="text-gray-400 mb-4">{channel.value}</p>
                        
                        {channel.type === 'WhatsApp' && (
                          <Button
                            asChild
                            className={`bg-gradient-to-r ${gradient} hover:opacity-90 w-full`}
                          >
                            <a
                              href={`https://wa.me/${channel.value.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              فتح المحادثة
                            </a>
                          </Button>
                        )}
                        
                        {channel.type === 'Telegram' && (
                          <Button
                            asChild
                            className={`bg-gradient-to-r ${gradient} hover:opacity-90 w-full`}
                          >
                            <a
                              href={`https://t.me/${channel.value.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              فتح المحادثة
                            </a>
                          </Button>
                        )}
                        
                        {channel.type === 'Email' && (
                          <Button
                            asChild
                            className={`bg-gradient-to-r ${gradient} hover:opacity-90 w-full`}
                          >
                            <a href={`mailto:${channel.value}`}>
                              إرسال بريد
                            </a>
                          </Button>
                        )}
                        
                        {channel.type === 'Phone' && (
                          <Button
                            asChild
                            className={`bg-gradient-to-r ${gradient} hover:opacity-90 w-full`}
                          >
                            <a href={`tel:${channel.value}`}>
                              اتصال
                            </a>
                          </Button>
                        )}
                        
                        {channel.type === 'Website' && (
                          <Button
                            asChild
                            className={`bg-gradient-to-r ${gradient} hover:opacity-90 w-full`}
                          >
                            <a
                              href={channel.value}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              زيارة الموقع
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}