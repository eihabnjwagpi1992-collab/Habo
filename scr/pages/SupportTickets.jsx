import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Loader2, Plus, MessageSquare, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import GlowCard from '@/components/ui/GlowCard';
import CreateTicketDialog from '@/components/CreateTicketDialog';
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportTickets() {
  const [user, setUser] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
    };
    checkAuth();
  }, []);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      if (!user?.email) return [];
      if (user.role === 'admin') {
        return base44.entities.SupportTicket.list('-created_date', 100);
      }
      return base44.entities.SupportTicket.filter(
        { created_by: user.email },
        '-created_date',
        100
      );
    },
    enabled: !!user?.email,
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      toast.success('تم تحديث التذكرة');
      setSelectedTicket(null);
    },
    onError: () => toast.error('حدث خطأ')
  });

  const priorityConfig = {
    low: { color: 'bg-blue-500/20 text-blue-400', label: 'منخفضة' },
    medium: { color: 'bg-yellow-500/20 text-yellow-400', label: 'متوسطة' },
    high: { color: 'bg-orange-500/20 text-orange-400', label: 'عالية' },
    urgent: { color: 'bg-red-500/20 text-red-400', label: 'حرجة' }
  };

  const statusConfig = {
    open: { icon: AlertCircle, color: 'text-yellow-400', label: 'مفتوحة' },
    in_progress: { icon: Clock, color: 'text-cyan-400', label: 'قيد المعالجة' },
    resolved: { icon: CheckCircle2, color: 'text-green-400', label: 'تم الحل' },
    closed: { icon: CheckCircle2, color: 'text-gray-400', label: 'مغلقة' }
  };

  if (!user) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">تذاكر الدعم</h1>
              <p className="text-gray-400">إدارة تذاكر الدعم والمشاكل</p>
            </div>
            {user?.role !== 'admin' && (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                فتح تذكرة جديدة
              </Button>
            )}
          </div>
        </motion.div>

        {/* Tickets Grid */}
        {tickets.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">لا توجد تذاكر دعم</p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {tickets.map((ticket) => {
                const statusIcon = statusConfig[ticket.status]?.icon;
                const StatusIcon = statusIcon;
                
                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <GlowCard
                      className="p-6 cursor-pointer hover:border-cyan-500/40 transition-all"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-2">
                          <Badge className={priorityConfig[ticket.priority]?.color}>
                            {priorityConfig[ticket.priority]?.label}
                          </Badge>
                          <Badge className="bg-white/5 text-gray-300 flex items-center gap-1">
                            <StatusIcon className={`w-3 h-3 ${statusConfig[ticket.status]?.color}`} />
                            {statusConfig[ticket.status]?.label}
                          </Badge>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-white mb-2">{ticket.title}</h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4">{ticket.description}</p>

                      {ticket.screenshot_url && (
                        <div className="mb-4 rounded-lg overflow-hidden max-h-32">
                          <img src={ticket.screenshot_url} alt="screenshot" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        {new Date(ticket.created_date).toLocaleDateString('ar-EG')}
                      </p>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Create Ticket Dialog */}
        <CreateTicketDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

        {/* Ticket Detail Dialog */}
        {selectedTicket && (
          <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
            <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedTicket.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الأولوية</p>
                    <Badge className={priorityConfig[selectedTicket.priority]?.color}>
                      {priorityConfig[selectedTicket.priority]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الحالة</p>
                    <Badge className="bg-white/5 text-gray-300 flex items-center gap-1 w-fit">
                      {statusConfig[selectedTicket.status]?.label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">الوصف</p>
                  <p className="bg-white/5 p-3 rounded-lg text-sm text-gray-300">{selectedTicket.description}</p>
                </div>

                {selectedTicket.screenshot_url && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">لقطة الشاشة</p>
                    <img src={selectedTicket.screenshot_url} alt="screenshot" className="w-full rounded-lg max-h-64 object-cover" />
                  </div>
                )}

                {/* Admin Notes Section */}
                {user?.role === 'admin' && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">ملاحظات الدعم</p>
                    <Textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="أضف ملاحظات الحل أو الخطوات المتخذة..."
                      className="bg-white/5 border-white/10 text-white h-24"
                    />
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  تم الفتح: {new Date(selectedTicket.created_date).toLocaleDateString('ar-EG')}
                </p>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTicket(null)}
                  className="border-white/20 text-white"
                >
                  إغلاق
                </Button>
                {user?.role === 'admin' && selectedTicket.status !== 'closed' && (
                  <Button
                    onClick={() => {
                      updateTicketMutation.mutate({
                        id: selectedTicket.id,
                        data: {
                          status: 'resolved',
                          admin_notes: adminNote,
                          resolved_at: new Date().toISOString()
                        }
                      });
                    }}
                    disabled={updateTicketMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updateTicketMutation.isPending ? 'جاري...' : 'تم حلها'}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}