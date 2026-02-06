import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { 
  Search, 
  Star, 
  Shield,
  Crown,
  Loader2,
  Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";

export default function ManageUserTiers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const updateUserTierMutation = useMutation({
    mutationFn: ({ userId, tier }) => 
      base44.entities.User.update(userId, { tier }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-all'] });
      setSelectedUser(null);
      setSelectedTier(null);
    },
  });

  const tierInfo = {
    regular: {
      label: 'وكيل عادي',
      icon: Shield,
      color: 'from-gray-500 to-slate-600',
      badge: 'bg-gray-500',
    },
    silver: {
      label: 'وكيل فضي',
      icon: Star,
      color: 'from-slate-400 to-gray-400',
      badge: 'bg-slate-400',
    },
    gold: {
      label: 'وكيل ذهبي',
      icon: Crown,
      color: 'from-amber-500 to-yellow-500',
      badge: 'bg-amber-500',
    },
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpdateTier = async () => {
    if (selectedUser && selectedTier) {
      updateUserTierMutation.mutate({ userId: selectedUser.id, tier: selectedTier });
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">إدارة رتب الوكلاء</h1>
          <p className="text-gray-400">تغيير رتبة الوكلاء لتحديد الأسعار المناسبة لكل مستوى</p>
        </div>

        {/* Tier Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {Object.entries(tierInfo).map(([key, info]) => {
            const Icon = info.icon;
            return (
              <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-cyan-400" />
                  <span className="font-semibold text-white">{info.label}</span>
                </div>
                <p className="text-sm text-gray-400">
                  {key === 'regular' && 'أسعار قياسية بدون خصم'}
                  {key === 'silver' && 'خصم 10% على جميع الخدمات'}
                  {key === 'gold' && 'خصم 20% على جميع الخدمات'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">الاسم</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">البريد الإلكتروني</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">الرتبة الحالية</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="wait">
                    {filteredUsers.map((user) => {
                      const userTier = user.tier || 'regular';
                      const TierIcon = tierInfo[userTier].icon;
                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="text-white font-medium">{user.full_name || 'غير محدد'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-400 text-sm">{user.email}</p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`bg-gradient-to-r ${tierInfo[userTier].color} text-white border-0 flex items-center gap-1 w-fit`}>
                              <TierIcon className="w-3 h-3" />
                              {tierInfo[userTier].label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                              className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30"
                            >
                              تغيير الرتبة
                            </Button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Change Tier Dialog */}
        <AlertDialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
          <AlertDialogContent className="bg-[#1a1a2e] border-white/10 max-w-md">
            <AlertDialogTitle className="text-white">تغيير رتبة الوكيل</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              اختر الرتبة الجديدة لـ {selectedUser?.full_name}
            </AlertDialogDescription>

            {selectedUser && (
              <div className="space-y-4 my-4">
                <Select value={selectedTier || (selectedUser.tier || 'regular')} onValueChange={setSelectedTier}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="اختر الرتبة" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {Object.entries(tierInfo).map(([key, info]) => (
                      <SelectItem key={key} value={key}>
                        {info.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUpdateTier}
                disabled={updateUserTierMutation.isPending}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                {updateUserTierMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    تحديث
                  </>
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}