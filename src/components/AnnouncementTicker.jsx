import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnnouncementTicker() {
  const { data: announcements = [] } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => base44.entities.Announcement.filter({ is_active: true }, '-priority', 10),
    refetchInterval: 30000 // تحديث كل 30 ثانية
  });

  const activeAnnouncement = announcements[0];

  if (!activeAnnouncement) return null;

  const colorConfig = {
    yellow: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    blue: 'bg-blue-100 text-blue-900 border-blue-300',
    red: 'bg-red-100 text-red-900 border-red-300',
    green: 'bg-green-100 text-green-900 border-green-300',
    purple: 'bg-purple-100 text-purple-900 border-purple-300',
    cyan: 'bg-cyan-100 text-cyan-900 border-cyan-300'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${colorConfig[activeAnnouncement.background_color] || colorConfig.yellow} border-b py-2 px-4 overflow-hidden`}
    >
      <div className="flex items-center gap-3 justify-center">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1 overflow-hidden">
          <motion.div
            animate={{ x: ['100%', '-100%'] }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'linear'
            }}
            className="whitespace-nowrap text-sm font-semibold"
          >
            {activeAnnouncement.text}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}