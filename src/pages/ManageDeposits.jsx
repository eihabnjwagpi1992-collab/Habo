import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { 
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  DollarSign,
  Filter,
  ExternalLink
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

export default function ManageDeposits() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['deposit-requests'],
    queryFn: () => base44.entities.DepositRequest.list('-created_date'),
    initialData: [],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ request }) => {
      // Get user to update balance
      const users = await base44.entities.User.filter({ email: request.user_email });
      if (!users || users.length === 0) throw new Error('User not found');
      
      const user = users[0];
      const newBalance = (user.balance || 0) + request.amount;

      // Update user balance
      await base44.entities.User.update(user.id, { balance: newBalance });

      // Create transaction
      await base44.entities.Transaction.create({
        type: 'deposit',
        amount: request.amount,
        balance_after: newBalance,
        description: `Deposit via ${request.method} - Ref: ${request.reference_number}`,
        deposit_request_id: request.id,
        payment_method: request.method,
        status: 'completed'
      });

      // Update deposit request
      await base44.entities.DepositRequest.update(request.id, {
        status: 'approved',
        admin_note: adminNote,
        reviewed_at: new Date().toISOString()
      });

      // Send notification
      await base44.entities.Notification.create({
        user_email: request.user_email,
        title: 'Deposit Approved',
        message: `Your deposit of $${request.amount} has been approved and added to your balance.`,
        type: 'payment',
        is_read: false
      });

      // Send email
      await base44.integrations.Core.SendEmail({
        to: request.user_email,
        subject: 'Tsmart GSM - Deposit Approved',
        body: `Your deposit request has been approved!\n\nAmount: $${request.amount}\nMethod: ${request.method}\nReference: ${request.reference_number}\n\nYour new balance: $${newBalance.toFixed(2)}\n\nThank you for using Tsmart GSM!`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deposit-requests']);
      toast.success('Deposit approved and balance updated');
      setReviewDialog(false);
      setAdminNote('');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ request }) => {
      await base44.entities.DepositRequest.update(request.id, {
        status: 'rejected',
        admin_note: adminNote,
        reviewed_at: new Date().toISOString()
      });

      // Send notification
      await base44.entities.Notification.create({
        user_email: request.user_email,
        title: 'Deposit Rejected',
        message: `Your deposit request of $${request.amount} has been rejected. ${adminNote ? `Reason: ${adminNote}` : ''}`,
        type: 'payment',
        is_read: false
      });

      // Send email
      await base44.integrations.Core.SendEmail({
        to: request.user_email,
        subject: 'Tsmart GSM - Deposit Rejected',
        body: `Your deposit request has been rejected.\n\nAmount: $${request.amount}\nMethod: ${request.method}\nReference: ${request.reference_number}\n${adminNote ? `\nReason: ${adminNote}` : ''}\n\nPlease contact support if you have questions.`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deposit-requests']);
      toast.success('Deposit rejected');
      setReviewDialog(false);
      setAdminNote('');
    }
  });

  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20" },
    approved: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20" },
    rejected: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20" }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.method?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReview = (request, action) => {
    setSelectedRequest({ ...request, action });
    setAdminNote('');
    setReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (selectedRequest.action === 'approve') {
      approveMutation.mutate({ request: selectedRequest });
    } else {
      rejectMutation.mutate({ request: selectedRequest });
    }
  };

  return (
    <div className="py-4">
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Manage Deposits</h1>
          <p className="text-gray-400">Review and approve deposit requests</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by email, reference, or method..."
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
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6 text-gray-400">
          Showing {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const config = statusConfig[request.status] || statusConfig.pending;
              return (
                <GlowCard key={request.id} className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${config.bg}`}>
                          <DollarSign className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-lg mb-1">
                            ${request.amount} - {request.method}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-2">
                            <span>{request.user_email}</span>
                            <span>•</span>
                            <span>{format(new Date(request.created_date), 'MMM d, yyyy HH:mm')}</span>
                          </div>
                          
                          <div className="space-y-1 text-sm">
                            <div>
                              <span className="text-gray-400">Reference: </span>
                              <span className="text-white font-mono">{request.reference_number}</span>
                            </div>
                            {request.note && (
                              <div>
                                <span className="text-gray-400">Note: </span>
                                <span className="text-white">{request.note}</span>
                              </div>
                            )}
                            {request.proof_image_url && (
                              <div>
                                <a 
                                  href={request.proof_image_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                >
                                  View Receipt <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            {request.admin_note && (
                              <div className="mt-2 p-2 rounded bg-white/5">
                                <span className="text-gray-400">Admin Note: </span>
                                <span className="text-white">{request.admin_note}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Badge className={`${config.bg} ${config.color} border-0`}>
                        {request.status}
                      </Badge>
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReview(request, 'approve')}
                            size="sm"
                            className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReview(request, 'reject')}
                            size="sm"
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </GlowCard>
              );
            })}
          </div>
        )}

        <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>
                {selectedRequest?.action === 'approve' ? 'Approve' : 'Reject'} Deposit
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-semibold">${selectedRequest?.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Method:</span>
                  <span className="text-white">{selectedRequest?.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">User:</span>
                  <span className="text-white">{selectedRequest?.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Reference:</span>
                  <span className="text-white font-mono">{selectedRequest?.reference_number}</span>
                </div>
              </div>

              <div>
                <Label>Admin Note {selectedRequest?.action === 'reject' && '(Required for rejection)'}</Label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-24"
                  placeholder={selectedRequest?.action === 'approve' 
                    ? "Optional note for approval" 
                    : "Reason for rejection"}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setReviewDialog(false)} 
                className="border-white/20 text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={selectedRequest?.action === 'reject' && !adminNote}
                className={selectedRequest?.action === 'approve'
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  : "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"}
              >
                {selectedRequest?.action === 'approve' ? 'Approve' : 'Reject'} Deposit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}