import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationDropdown({ user }) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter(
      { user_email: user.email },
      '-created_date',
      20
    ),
    enabled: !!user?.email,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:text-cyan-400">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-2 border-[#0a0a0f]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-[#1a1a2e] border-white/10 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <span className="font-semibold text-white">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-xs text-cyan-400 hover:text-cyan-300 h-auto p-1"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <div key={notification.id}>
                <DropdownMenuItem
                  className={`p-4 cursor-pointer ${
                    !notification.is_read ? 'bg-cyan-500/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  asChild
                >
                  {notification.order_id ? (
                    <Link to={createPageUrl("Orders")}>
                      <div className="flex gap-3 w-full">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          !notification.is_read ? 'bg-cyan-400' : 'bg-transparent'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm mb-1">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-400 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(notification.created_date), 'MMM d, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex gap-3 w-full">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        !notification.is_read ? 'bg-cyan-400' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm mb-1">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(notification.created_date), 'MMM d, HH:mm')}
                        </p>
                      </div>
                    </div>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}