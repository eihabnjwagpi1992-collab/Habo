import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Trash2, Edit2, FileUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageSupportFiles() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    device_type: 'Samsung',
    file_type: 'Root File',
    version: '',
    min_tier: 'regular',
    min_balance: 0,
    is_active: true
  });

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['support-files-admin'],
    queryFn: () => base44.entities.SupportFile.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportFile.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-files-admin'] });
      queryClient.invalidateQueries({ queryKey: ['support-files'] });
      toast.success('تم إنشاء الملف');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportFile.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-files-admin'] });
      queryClient.invalidateQueries({ queryKey: ['support-files'] });
      toast.success('تم تحديث الملف');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SupportFile.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-files-admin'] });
      queryClient.invalidateQueries({ queryKey: ['support-files'] });
      toast.success('تم حذف الملف');
    },
    onError: () => toast.error('حدث خطأ')
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      
      setFormData(prev => ({
        ...prev,
        file_url: uploadResponse.file_url,
        file_size: Math.round(file.size / 1024 / 1024 * 100) / 100
      }));
      
      setSelectedFile(file);
      toast.success('تم رفع الملف بنجاح');
    } catch (error) {
      toast.error('خطأ في رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      device_type: 'Samsung',
      file_type: 'Root File',
      version: '',
      min_tier: 'regular',
      min_balance: 0,
      is_active: true
    });
    setSelectedFile(null);
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleEdit = (file) => {
    setFormData({
      name: file.name,
      description: file.description || '',
      device_type: file.device_type,
      file_type: file.file_type,
      version: file.version || '',
      min_tier: file.min_tier,
      min_balance: file.min_balance,
      is_active: file.is_active
    });
    setEditingId(file.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('اسم الملف مطلوب');
      return;
    }

    if (!editingId && !formData.file_url) {
      toast.error('رفع الملف مطلوب');
      return;
    }

    const submitData = editingId 
      ? { ...formData }
      : formData;

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: submitData
      });
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">ملفات السبورت والروت</h2>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          ملف جديد
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {files.map((file) => (
            <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <GlowCard className="p-4 flex flex-col h-full">
                <div className="mb-3">
                  <h3 className="font-semibold text-white mb-2">{file.name}</h3>
                  {file.description && <p className="text-sm text-gray-400">{file.description}</p>}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className="bg-cyan-500/20 text-cyan-400">{file.device_type}</Badge>
                  <Badge className="bg-blue-500/20 text-blue-400">{file.file_type}</Badge>
                  {file.version && <Badge className="bg-purple-500/20 text-purple-400">{file.version}</Badge>}
                  <Badge className={file.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                    {file.is_active ? 'مفعّل' : 'معطّل'}
                  </Badge>
                </div>

                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  <p>الحجم: {file.file_size} MB</p>
                  <p>التحميلات: {file.download_count}</p>
                  <p>الحد الأدنى: {file.min_tier}</p>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Button
                    onClick={() => handleEdit(file)}
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    تعديل
                  </Button>
                  <Button
                    onClick={() => deleteMutation.mutate(file.id)}
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-red-400 hover:text-red-300"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    حذف
                  </Button>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل الملف' : 'إضافة ملف جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Name */}
            <div>
              <Label>اسم الملف *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: Samsung Galaxy A51 Root"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="أضف معلومات إضافية عن الملف..."
                className="bg-white/5 border-white/10 text-white h-20"
              />
            </div>

            {/* Device Type & File Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>نوع الجهاز</Label>
                <Select value={formData.device_type} onValueChange={(v) => setFormData({ ...formData, device_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {['Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Vivo', 'Realme', 'OnePlus', 'Motorola', 'LG', 'HTC', 'Apple', 'Other'].map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>نوع الملف</Label>
                <Select value={formData.file_type} onValueChange={(v) => setFormData({ ...formData, file_type: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {['Root File', 'PIT File', 'Firmware', 'MDM Tool', 'IMEI Tool', 'Other'].map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Version & Min Tier */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الإصدار</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="v1.0"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label>الحد الأدنى للمستوى</Label>
                <Select value={formData.min_tier} onValueChange={(v) => setFormData({ ...formData, min_tier: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="regular">عادي</SelectItem>
                    <SelectItem value="silver">فضي</SelectItem>
                    <SelectItem value="gold">ذهبي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Min Balance */}
            <div>
              <Label>الحد الأدنى للرصيد (اختياري)</Label>
              <Input
                type="number"
                value={formData.min_balance}
                onChange={(e) => setFormData({ ...formData, min_balance: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                placeholder="0"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            {/* File Upload */}
            {!editingId && (
              <div>
                <Label>رفع الملف *</Label>
                <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-white/20 rounded-lg hover:border-cyan-500/40 cursor-pointer transition-colors">
                  <FileUp className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    {selectedFile ? selectedFile.name : 'اضغط لاختيار الملف'}
                  </span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {formData.file_url && (
                  <p className="text-xs text-green-400 mt-2">✓ تم رفع الملف ({formData.file_size} MB)</p>
                )}
              </div>
            )}

            {/* Active Status */}
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm text-gray-300 cursor-pointer">تفعيل الملف الآن</label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/20">
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || uploading}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {createMutation.isPending || updateMutation.isPending || uploading ? 'جاري...' : editingId ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}