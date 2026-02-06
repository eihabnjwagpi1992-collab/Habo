import React, { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const { data: contactChannels = [] } = useQuery({
    queryKey: ['contact-channels'],
    queryFn: () => base44.entities.ContactChannel.filter(
      { type: 'WhatsApp', is_active: true },
      'sort_order',
      1
    ),
    staleTime: 60000
  });

  if (!isVisible || contactChannels.length === 0) return null;

  const whatsappChannel = contactChannels[0];
  const whatsappNumber = whatsappChannel.value.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=مرحباً، أحتاج إلى مساعدة في خدمة TsmartGSM`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-8 right-8 z-40 group"
    >
      <div className="relative">
        {/* Background glow */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-green-500 rounded-full blur-lg opacity-50"
        />

        {/* Main button */}
        <div className="relative w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>

        {/* Label */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          whileHover={{ opacity: 1, x: -10 }}
          className="absolute bottom-0 right-16 bg-green-600 text-white text-sm font-semibold px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        >
          الدعم الفني
        </motion.div>
      </div>
    </motion.a>
  );
}