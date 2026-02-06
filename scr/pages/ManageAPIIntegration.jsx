import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import GlowCard from "@/components/ui/GlowCard";

export default function ManageAPIIntegration() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    base_url: '',
    api_key: '',
    api_format: 'json',
    margin_type: 'percentage',
    margin_value: 0,
    auto_submit_enabled: false,
    sync_interval_hours: 24
  });

  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['api-providers'],
    queryFn: () => base44.entities.APIProvider.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.APIProvider.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.APIProvider.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      setShowForm(false);
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.APIProvider.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
      setShowDeleteDialog(null);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (providerId) => {
      const response = await fetch('/api/functions/syncServicesFromProvider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-providers'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      base_url: '',
      api_key: '',
      api_format: 'json',
      margin_type: 'percentage',
      margin_value: 0,
      auto_submit_enabled: false,
      sync_interval_hours: 24
    });
    setEditingId(null);
  };

  const handleEdit = (provider) => {
    setFormData(provider);
    setEditingId(provider.id);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">إدارة ربط API</h1>
              <p className="text-gray-400">ربط خوادم GSM وسحب الخدمات والأسعار تلقائياً</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              إضافة مزود جديد
            </Button>
          </div>
        </motion.div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GlowCard className="p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                {editingId ? 'تعديل المزود' : 'إضافة مزود جديد'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      اسم المزود
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="مثال: Yemen Server"
                      required
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      رابط API الأساسي
                    </label>
                    <Input
                      value={formData.base_url}
                      onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                      placeholder="https://api.provider.com"
                      required
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      مفتاح API
                    </label>
                    <Input
                      value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder="أدخل المفتاح السري"
                      required
                      type="password"
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      صيغة API
                    </label>
                    <Select
                      value={formData.api_format}
                      onValueChange={(value) =>
                        setFormData({ ...formData, api_format: value })
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="xml">XML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      نوع هامش الربح
                    </label>
                    <Select
                      value={formData.margin_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, margin_type: value })
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                        <SelectItem value="fixed">مبلغ ثابت ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      قيمة هامش الربح
                    </label>
                    <Input
                      type="number"
                      value={formData.margin_value}
                      onChange={(e) =>
                        setFormData({ ...formData, margin_value: parseFloat(e.target.value) })
                      }
                      placeholder="0"
                      step="0.1"
                      className="bg-white/5 border-white/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      فترة السحب التلقائي (ساعات)
                    </label>
                    <Input
                      type="number"
                      value={formData.sync_interval_hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sync_interval_hours: parseInt(e.target.value)
                        })
                      }
                      placeholder="24"
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_submit_enabled}
                      onChange={(e) =>
                        setFormData({ ...formData, auto_submit_enabled: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-white">تفعيل الإرسال التلقائي للطلبات</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-cyan-500 hover:bg-cyan-600"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      'حفظ'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </GlowCard>
          </motion.div>
        )}

        {/* Providers List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : providers.length === 0 ? (
            <GlowCard className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">لم يتم إضافة أي مزود حتى الآن</p>
              <Button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                أضف المزود الأول
              </Button>
            </GlowCard>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GlowCard className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                          <Badge
                            className={
                              provider.is_active
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }
                          >
                            {provider.is_active ? 'مفعل' : 'معطل'}
                          </Badge>
                          {provider.auto_submit_enabled && (
                            <Badge className="bg-cyan-500/20 text-cyan-400">
                              إرسال تلقائي
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-400 mb-4">{provider.base_url}</p>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">صيغة API</p>
                            <p className="text-white font-medium uppercase">
                              {provider.api_format}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">هامش الربح</p>
                            <p className="text-white font-medium">
                              {provider.margin_type === 'percentage'
                                ? `${provider.margin_value}%`
                                : `$${provider.margin_value}`}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-gray-500">آخر سحب</p>
                            <p className="text-white font-medium">
                              {provider.last_sync
                                ? new Date(provider.last_sync).toLocaleDateString('ar')
                                : 'لم يتم السحب'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => syncMutation.mutate(provider.id)}
                          disabled={syncMutation.isPending}
                          variant="outline"
                          size="icon"
                          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                          title="سحب الخدمات"
                        >
                          {syncMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </Button>

                        <Button
                          onClick={() => handleEdit(provider)}
                          variant="outline"
                          size="icon"
                          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <Button
                          onClick={() => setShowDeleteDialog(provider.id)}
                          variant="outline"
                          size="icon"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Delete Dialog */}
        <AlertDialog open={!!showDeleteDialog}>
          <AlertDialogContent className="bg-[#1a1a2e] border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                هل أنت متأكد من رغبتك في حذف هذا المزود؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel className="border-white/10">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteMutation.mutate(showDeleteDialog);
                }}
                className="bg-red-500 hover:bg-red-600"
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