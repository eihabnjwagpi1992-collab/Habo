import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { 
  Wallet,
  Lock,
  RefreshCw,
  Search,
  Eye,
  Download,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function BalanceManagement() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // جلب سجلات الرصيد
  const { data: balanceLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['balance-logs'],
    queryFn: () => base44.entities.BalanceLog.list('-created_date'),
    initialData: [],
  });

  // جلب معلومات المستخدم
  const checkBalanceMutation = useMutation({
    mutationFn: (userEmail) => base44.functions.invoke('manageBalance', {
      action: 'check',
      user_email: userEmail,
      amount: 0
    }),
    onSuccess: (response) => {
      setSelectedUser(response.data);
    },
    onError: () => {
      toast.error('فشل في جلب معلومات الرصيد');
    }
  });

  const refundMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('manageBalance', {
        action: 'refund',
        user_email: selectedUser.user_email,
        amount: parseFloat(refundAmount),
        order_id: `ADMIN-REFUND-${Date.now()}`,
        service_name: 'إرجاع يدوي من الإدارة',
        reason: refundReason
      });
      return result;
    },
    onSuccess: () => {
      toast.success('تم إرجاع الرصيد بنجاح');
      setShowRefundDialog(false);
      setRefundAmount('');
      setRefundReason('');
      checkBalanceMutation.mutate(selectedUser.user_email);
    },
    onError: (error) => {
      toast.error(`فشل الإرجاع: ${error.message}`);
    }
  });

  const userLogs = balanceLogs.filter(log => 
    searchEmail === '' || log.user_email?.includes(searchEmail)
  );

  const getTransactionTypeLabel = (type) => {
    const types = {
      deposit: { label: 'إيداع', color: 'bg-green-500/20 text-green-400' },
      reserve: { label: 'حجز', color: 'bg-blue-500/20 text-blue-400' },
      confirm: { label: 'تثبيت خصم', color: 'bg-orange-500/20 text-orange-400' },
      refund: { label: 'إرجاع', color: 'bg-purple-500/20 text-purple-400' },
      bonus: { label: 'مكافأة', color: 'bg-pink-500/20 text-pink-400' }
    };
    return types[type] || { label: type, color: 'bg-gray-500/20 text-gray-400' };
  };

  return (
    <div className="py-8 px-4" style={{ color: 'var(--text-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Wallet className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            إدارة أرصدة المستخدمين
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            تحكم شامل بأرصدة المستخدمين والعمليات والحجوزات
          </p>
        </div>

        {/* Search Section */}
        <GlowCard className="p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
              <Input
                placeholder="ابحث عن بريد المستخدم..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="pl-12 h-10 border"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  borderColor: 'var(--input-border)',
                  color: 'var(--text-color)'
                }}
              />
            </div>
            <Button
              onClick={() => selectedUser && checkBalanceMutation.mutate(selectedUser.user_email)}
              className="text-white"
              style={{ background: 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))' }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </div>
        </GlowCard>

        {/* User Balance Info */}
        {selectedUser && (
          <GlowCard className="p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">البريد الإلكتروني</p>
                <p className="font-semibold text-lg">{selectedUser.user_email}</p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">الرصيد الكلي</p>
                <p className="font-semibold text-2xl" style={{ color: 'var(--primary)' }}>
                  ${selectedUser.total_balance?.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">الرصيد المحجوز</p>
                <p className="font-semibold text-2xl text-orange-400">
                  ${selectedUser.reserved_balance?.toFixed(2)}
                </p>
              </div>
              <div>
                <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">الرصيد المتاح</p>
                <p className="font-semibold text-2xl text-green-400">
                  ${selectedUser.available_balance?.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setShowRefundDialog(true)}
                className="text-white"
                style={{ background: 'linear-gradient(to right, #8b5cf6, #ec4899)' }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                إرجاع رصيد يدوي
              </Button>
            </div>
          </GlowCard>
        )}

        {/* Refund Dialog */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent 
            className="border max-w-md"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)'
            }}
          >
            <DialogHeader>
              <DialogTitle>إرجاع رصيد يدوي</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label style={{ color: 'var(--text-color)' }}>المبلغ ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="border mt-2"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-color)'
                  }}
                />
              </div>

              <div>
                <Label style={{ color: 'var(--text-color)' }}>السبب</Label>
                <Textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="border h-24 mt-2"
                  style={{
                    backgroundColor: 'var(--input-bg)',
                    borderColor: 'var(--input-border)',
                    color: 'var(--text-color)'
                  }}
                  placeholder="اكتب سبب الإرجاع..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowRefundDialog(false)}
                className="border"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-color)'
                }}
              >
                إلغاء
              </Button>
              <Button
                onClick={() => refundMutation.mutate()}
                disabled={!refundAmount || !refundReason || refundMutation.isPending}
                className="text-white"
                style={{ background: 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))' }}
              >
                تأكيد الإرجاع
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transaction Logs */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-6">سجل العمليات</h2>
          {logsLoading ? (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              جاري التحميل...
            </div>
          ) : userLogs.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
              لا توجد عمليات
            </div>
          ) : (
            <div className="space-y-3">
              {userLogs.map((log) => {
                const txType = getTransactionTypeLabel(log.transaction_type);
                return (
                  <GlowCard key={log.id} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={txType.color}>{txType.label}</Badge>
                          <span style={{ color: 'var(--text-muted)' }} className="text-sm">
                            {new Date(log.created_date).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        <p className="font-semibold" style={{ color: 'var(--text-color)' }}>
                          {log.user_email}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                          {log.service_name}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          ['deposit', 'refund', 'bonus'].includes(log.transaction_type)
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          {['deposit', 'refund', 'bonus'].includes(log.transaction_type) ? '+' : '-'}
                          ${log.amount?.toFixed(2)}
                        </p>
                        <p style={{ color: 'var(--text-muted)' }} className="text-sm">
                          من: ${log.previous_balance?.toFixed(2)}
                          <br />
                          إلى: ${log.new_balance?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {log.notes && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <p style={{ color: 'var(--text-muted)' }} className="text-sm italic">
                          {log.notes}
                        </p>
                      </div>
                    )}
                  </GlowCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}