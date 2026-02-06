import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { AlertCircle, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function CreateTicketDialog({ open, onOpenChange, orderId, orderName }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium'
  });
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData) => {
      // Upload screenshot if exists
      let screenshotUrl = null;
      if (screenshotFile) {
        const uploadResponse = await base44.integrations.Core.UploadFile({
          file: screenshotFile
        });
        screenshotUrl = uploadResponse.file_url;
      }

      // Create ticket
      const ticket = await base44.entities.SupportTicket.create({
        order_id: orderId,
        title: ticketData.title,
        description: ticketData.description,
        priority: ticketData.priority,
        screenshot_url: screenshotUrl
      });

      // Create notification for admins
      await base44.entities.Notification.create({
        order_id: orderId,
        title: 'تذكرة دعم جديدة',
        message: `فتح المستخدم تذكرة دعم: ${ticketData.title}`,
        type: 'pending',
        is_read: false
      });

      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('تم فتح التذكرة بنجاح');
      handleClose();
    },
    onError: (error) => {
      toast.error('حدث خطأ: ' + error.message);
    }
  });

  const handleClose = () => {
    setFormData({ title: '', description: '', priority: 'medium' });
    setScreenshotFile(null);
    setPreviewUrl(null);
    onOpenChange(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    createTicketMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>فتح تذكرة دعم</DialogTitle>
          {orderId && (
            <p className="text-sm text-gray-400 mt-2">
              بخصوص الطلب: <span className="text-cyan-400">{orderName}</span>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label>عنوان المشكلة *</Label>
            <Input
              placeholder="مثال: فشل الإرسال، مشكلة في التوثيق..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Description */}
          <div>
            <Label>وصف المشكلة بالتفصيل *</Label>
            <Textarea
              placeholder="اشرح المشكلة بالتفصيل لمساعدتنا على حلها بسرعة..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-white/5 border-white/10 text-white h-32"
            />
          </div>

          {/* Priority */}
          <div>
            <Label>الأولوية</Label>
            <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="low">منخفضة</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="urgent">حرجة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Screenshot Upload */}
          <div>
            <Label>أرفق لقطة شاشة (اختياري)</Label>
            <div className="mt-2">
              <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-white/20 rounded-lg hover:border-cyan-500/40 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {screenshotFile ? 'تم اختيار صورة' : 'اضغط لاختيار صورة'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">معاينة:</p>
                <div className="relative">
                  <img src={previewUrl} alt="preview" className="w-full rounded-lg max-h-64 object-cover" />
                  <button
                    onClick={() => {
                      setScreenshotFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                  >
                    حذف
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            <p className="text-sm text-blue-300">فريق الدعم سيتواصل معك قريباً لحل المشكلة</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="border-white/20 text-white">
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createTicketMutation.isPending || !formData.title || !formData.description}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {createTicketMutation.isPending ? 'جاري الإنشاء...' : 'فتح التذكرة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}