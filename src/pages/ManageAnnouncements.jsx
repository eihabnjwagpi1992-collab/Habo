import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
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
import { Checkbox } from "@/components/ui/checkbox";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageAnnouncements() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    text: '',
    background_color: 'yellow',
    priority: 1,
    is_active: true
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements-admin'],
    queryFn: () => base44.entities.Announcement.list('-priority', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Announcement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('تم إنشاء الإعلان');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Announcement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('تم تحديث الإعلان');
      resetForm();
    },
    onError: () => toast.error('حدث خطأ')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Announcement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('تم حذف الإعلان');
    },
    onError: () => toast.error('حدث خطأ')
  });

  const resetForm = () => {
    setFormData({
      text: '',
      background_color: 'yellow',
      priority: 1,
      is_active: true
    });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleEdit = (announcement) => {
    setFormData({
      text: announcement.text,
      background_color: announcement.background_color,
      priority: announcement.priority,
      is_active: announcement.is_active
    });
    setEditingId(announcement.id);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.text.trim()) {
      toast.error('نص الإعلان مطلوب');
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const colorConfig = {
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-900', label: 'أصفر' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-900', label: 'أزرق' },
    red: { bg: 'bg-red-100', text: 'text-red-900', label: 'أحمر' },
    green: { bg: 'bg-green-100', text: 'text-green-900', label: 'أخضر' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-900', label: 'بنفسجي' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-900', label: 'سماوي' }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">الإعلانات</h2>
        <Button
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          إعلان جديد
        </Button>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {announcements.map((announcement) => (
            <motion.div key={announcement.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <GlowCard className="p-4">
                <div className={`${colorConfig[announcement.background_color]?.bg} ${colorConfig[announcement.background_color]?.text} p-4 rounded-lg mb-4`}>
                  <p className="font-semibold text-sm">{announcement.text}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge className="bg-white/10 text-gray-300">
                      {colorConfig[announcement.background_color]?.label}
                    </Badge>
                    <Badge className={announcement.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                      {announcement.is_active ? 'مفعّل' : 'معطّل'}
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-400">
                      أولوية: {announcement.priority}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(announcement)}
                      variant="ghost"
                      size="sm"
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteMutation.mutate(announcement.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل الإعلان' : 'إنشاء إعلان جديد'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">النص *</label>
              <Textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="أدخل نص الإعلان..."
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">اللون</label>
                <Select value={formData.background_color} onValueChange={(v) => setFormData({ ...formData, background_color: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {Object.entries(colorConfig).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">الأولوية</label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Checkbox
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <label className="text-sm text-gray-300 cursor-pointer">تفعيل الإعلان الآن</label>
            </div>

            {/* Preview */}
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">معاينة:</p>
              <div className={`${colorConfig[formData.background_color]?.bg} ${colorConfig[formData.background_color]?.text} p-3 rounded-lg text-sm`}>
                {formData.text || 'سيظهر النص هنا...'}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-white/20">
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {createMutation.isPending || updateMutation.isPending ? 'جاري...' : editingId ? 'تحديث' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}