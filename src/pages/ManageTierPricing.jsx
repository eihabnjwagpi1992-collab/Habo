import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { 
  Plus,
  Trash2,
  Loader2,
  DollarSign,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function ManageTierPricing() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedTier, setSelectedTier] = useState('regular');
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [deletingId, setDeletingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => base44.entities.Service.list(),
    initialData: [],
  });

  const { data: tierPricing = [], isLoading } = useQuery({
    queryKey: ['service-tier-pricing'],
    queryFn: () => base44.entities.ServiceTierPricing.list(),
    initialData: [],
  });

  const createPricingMutation = useMutation({
    mutationFn: (data) => base44.entities.ServiceTierPricing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-tier-pricing'] });
      resetForm();
    },
  });

  const deletePricingMutation = useMutation({
    mutationFn: (id) => base44.entities.ServiceTierPricing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-tier-pricing'] });
      setDeletingId(null);
    },
  });

  const resetForm = () => {
    setShowAddForm(false);
    setSelectedService('');
    setSelectedTier('regular');
    setPrice('');
    setDiscountPercent('0');
  };

  const handleAdd = async () => {
    if (selectedService && price) {
      createPricingMutation.mutate({
        service_id: selectedService,
        tier: selectedTier,
        price: parseFloat(price),
        discount_percent: parseFloat(discountPercent),
      });
    }
  };

  const getServiceName = (serviceId) => {
    return services.find(s => s.id === serviceId)?.name || 'Unknown Service';
  };

  const tierLabels = {
    regular: 'وكيل عادي',
    silver: 'وكيل فضي',
    gold: 'وكيل ذهبي',
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">إدارة أسعار الرتب</h1>
            <p className="text-gray-400">تعديل أسعار الخدمات حسب رتبة الوكيل</p>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة سعر جديد
          </Button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">إضافة سعر جديد لرتبة</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="اختر الخدمة" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="اختر الرتبة" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="regular">وكيل عادي</SelectItem>
                  <SelectItem value="silver">وكيل فضي</SelectItem>
                  <SelectItem value="gold">وكيل ذهبي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="السعر"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="خصم %"
                  type="number"
                  step="0.1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAdd}
                disabled={createPricingMutation.isPending}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {createPricingMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'إضافة'
                )}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-white/10"
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}

        {/* Pricing Table */}
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">الخدمة</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">الرتبة</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">السعر</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">الخصم</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="wait">
                    {tierPricing.map((item) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="text-white font-medium">{getServiceName(item.service_id)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-400">{tierLabels[item.tier]}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-white font-semibold">${item.price?.toFixed(2)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-cyan-400">{item.discount_percent || 0}%</p>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            size="sm"
                            onClick={() => setDeletingId(item.id)}
                            className="text-red-400 hover:bg-red-500/20 border border-red-500/30 bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
            <AlertDialogTitle className="text-white">تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              هل تريد حقاً حذف هذا السعر؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletePricingMutation.mutate(deletingId)}
                disabled={deletePricingMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}