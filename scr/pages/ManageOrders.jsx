import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { 
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Edit,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import GlowCard from "@/components/ui/GlowCard";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ManageOrders() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({ status: '', result: '', admin_notes: '' });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, order }) => {
      // 1. تحديث بيانات الطلب في قاعدة البيانات
      await base44.entities.Order.update(id, data);
      
      // 2. منطق استرجاع الرصيد التلقائي
      // يتم الاسترجاع فقط إذا تغيرت الحالة إلى refunded أو failed ولم تكن كذلك من قبل
      if ((data.status === 'refunded' || data.status === 'failed') && order.status !== data.status) {
        try {
          // البحث عن المستخدم صاحب الطلب بناءً على الإيميل
          const usersResponse = await base44.entities.User.list();
          const targetUser = usersResponse.items?.find(u => u.email === order.created_by);
          
          if (targetUser) {
            const currentBalance = Number(targetUser.balance || 0);
            const refundAmount = Number(order.amount || 0);
            
            // إضافة المبلغ لرصيد المستخدم
            await base44.entities.User.update(targetUser.id, {
              balance: currentBalance + refundAmount
            });
            toast.success(`تم استرجاع مبلغ $${refundAmount.toFixed(2)} لحساب المستخدم ${order.created_by}`);
          }
        } catch (refundError) {
          console.error('Refund failed:', refundError);
          toast.error('فشل استرجاع الرصيد تلقائياً، يرجى التحقق يدوياً');
        }
      }
      
      // 3. إرسال الإشعارات (الكود الأصلي الخاص بك)
      if (data.status && data.status !== order.status) {
        const statusMessages = {
          processing: {
            title: 'Order Processing',
            message: `Your order for ${order.service_name} is now being processed.`
          },
          completed: {
            title: 'Order Completed',
            message: `Your order for ${order.service_name} has been completed successfully!${data.result ? ` Result: ${data.result}` : ''}`
          },
          failed: {
            title: 'Order Failed',
            message: `Unfortunately, your order for ${order.service_name} could not be completed. The amount has been refunded to your balance.`
          },
          refunded: {
            title: 'Order Refunded',
            message: `Your order for ${order.service_name} has been refunded to your balance.`
          }
        };

        const notification = statusMessages[data.status];
        
        if (notification) {
          // إنشاء إشعار داخل التطبيق
          await base44.entities.Notification.create({
            user_email: order.created_by,
            title: notification.title,
            message: notification.message,
            type: 'order_status',
            order_id: order.id,
            is_read: false
          });

          // إرسال إشعار عبر البريد الإلكتروني
          try {
            await base44.integrations.Core.SendEmail({
              to: order.created_by,
              subject: `Tsmart GSM - ${notification.title}`,
              body: `${notification.message}\n\nOrder ID: ${order.id}\nService: ${order.service_name}\nAmount: $${order.amount?.toFixed(2)}\n\nThank you for using Tsmart GSM!`
            });
          } catch (e) {
            console.error('Failed to send email:', e);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders']);
      queryClient.invalidateQueries(['me']); // لتحديث رصيد الأدمن إذا كان هو نفسه المستخدم
      toast.success('تم تحديث الطلب وإشعار المستخدم بنجاح');
      setEditDialog(false);
    }
  });

  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
    processing: { icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/20" },
    completed: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20" },
    failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" },
    refunded: { icon: RefreshCw, color: "text-gray-400", bg: "bg-gray-500/20" }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.service_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.created_by?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.imei?.includes(searchQuery) ||
      order.id?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (order) => {
    setSelectedOrder(order);
    setEditData({
      status: order.status || 'pending',
      result: order.result || '',
      admin_notes: order.admin_notes || ''
    });
    setEditDialog(true);
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      id: selectedOrder.id,
      data: editData,
      order: selectedOrder
    });
  };

  return (
    <div className="py-4">
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">إدارة الطلبات</h1>
          <p className="text-gray-400">معالجة وإدارة طلبات العملاء واسترجاع الرصيد</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="بحث بالخدمة، الإيميل، IMEI، أو رقم الطلب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 h-12 bg-white/5 border-white/10 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a2e] border-white/10">
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="processing">جاري المعالجة</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="failed">فاشل (استرجاع تلقائي)</SelectItem>
              <SelectItem value="refunded">مسترجع (استرجاع تلقائي)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              return (
                <GlowCard key={order.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${config.bg}`}>
                          <config.icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-lg mb-1">
                            {order.service_name}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                            <span>Order #{order.id.slice(-8)}</span>
                            <span>•</span>
                            <span>{order.created_by}</span>
                            <span>•</span>
                            <span>{order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy HH:mm') : '---'}</span>
                          </div>
                          
                          {order.imei && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-400">IMEI: </span>
                              <span className="text-white font-mono">{order.imei}</span>
                            </div>
                          )}
                          {order.result && (
                            <div className="mt-2 p-2 rounded bg-green-500/10 text-sm">
                              <span className="text-gray-400">النتيجة: </span>
                              <span className="text-green-400 font-mono">{order.result}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">
                          ${order.amount?.toFixed(2)}
                        </p>
                        <Badge className={`${config.bg} ${config.color} border-0 mt-1`}>
                          {order.status}
                        </Badge>
                      </div>
                      <Button
                        onClick={() => handleEdit(order)}
                        variant="outline"
                        size="sm"
                        className="border-cyan-500/30 text-cyan-400"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        تعديل
                      </Button>
                    </div>
                  </div>
                </GlowCard>
              );
            })}
          </div>
        )}

        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>تحديث حالة الطلب</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>الحالة</Label>
                <Select value={editData.status} onValueChange={(v) => setEditData({...editData, status: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="processing">جاري المعالجة</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="failed">فاشل (سيتم استرجاع الرصيد)</SelectItem>
                    <SelectItem value="refunded">مسترجع (سيتم استرجاع الرصيد)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>النتيجة / كود فك التشفير</Label>
                <Input
                  value={editData.result}
                  onChange={(e) => setEditData({...editData, result: e.target.value})}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="أدخل النتيجة هنا"
                />
              </div>

              <div>
                <Label>ملاحظات الإدارة (داخلية)</Label>
                <Textarea
                  value={editData.admin_notes}
                  onChange={(e) => setEditData({...editData, admin_notes: e.target.value})}
                  className="bg-white/5 border-white/10 text-white h-24"
                  placeholder="ملاحظات لا يراها العميل"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-white/20 text-white">
                إلغاء
              </Button>
              <Button
                onClick={handleUpdate}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                تحديث الطلب
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
