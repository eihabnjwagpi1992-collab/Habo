import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import {
  Bell,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationCenter({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => 
      user?.email 
        ? base44.entities.Notification.filter({ created_by: user.email }, '-created_date', 20)
        : [],
    enabled: !!user?.email,
    initialData: [],
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.created_by === user.email) {
        queryClient.invalidateQueries({ queryKey: ['notifications', user.email] });
      }
    });

    return unsubscribe;
  }, [user?.email, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
    },
  });

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.is_read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const notificationIcons = {
    completed: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20" },
    failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
    processing: { icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/20" },
    pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
    refunded: { icon: RefreshCw, color: "text-gray-400", bg: "bg-gray-500/20" }
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-300 hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-96 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-2xl z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white">الإشعارات</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>لا توجد إشعارات حالياً</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notif) => {
                    const config = notificationIcons[notif.type] || notificationIcons.pending;
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                          notif.is_read ? 'opacity-60' : 'bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => !notif.is_read && markAsReadMutation.mutate(notif.id)}
                      >
                        <div className="flex gap-3">
                          <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm">{notif.title}</p>
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            {!notif.is_read && (
                              <div className="mt-2 w-2 h-2 bg-cyan-400 rounded-full" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}