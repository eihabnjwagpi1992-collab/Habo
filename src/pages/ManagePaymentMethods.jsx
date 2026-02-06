import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function ManagePaymentMethods() {
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState(null);

  const { data: methods = [], isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => base44.entities.PaymentMethod.list('sort_order'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PaymentMethod.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods']);
      toast.success('Payment method created');
      setEditDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PaymentMethod.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods']);
      toast.success('Payment method updated');
      setEditDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PaymentMethod.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payment-methods']);
      toast.success('Payment method deleted');
    }
  });

  const handleEdit = (method) => {
    setEditData(method || {
      name: '',
      code: '',
      address_text: '',
      instructions: '',
      is_active: true,
      sort_order: 0
    });
    setEditDialog(true);
  };

  const handleSubmit = () => {
    if (editData.id) {
      updateMutation.mutate({ id: editData.id, data: editData });
    } else {
      createMutation.mutate(editData);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Payment Methods</h1>
            <p className="text-gray-400">Manage payment method details shown to users</p>
          </div>
          <Button
            onClick={() => handleEdit(null)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {methods.map((method) => (
              <GlowCard key={method.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{method.name}</h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(method)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(method.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">Code:</span>
                    <p className="text-white font-mono">{method.code}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Address/Account:</span>
                    <p className="text-white">{method.address_text}</p>
                  </div>
                  {method.instructions && (
                    <div>
                      <span className="text-gray-400">Instructions:</span>
                      <p className="text-white text-xs">{method.instructions}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-gray-400">Status:</span>
                    <span className={method.is_active ? 'text-green-400' : 'text-red-400'}>
                      {method.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}

        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editData?.id ? 'Edit' : 'Add'} Payment Method</DialogTitle>
            </DialogHeader>

            {editData && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editData.name}
                      onChange={(e) => setEditData({...editData, name: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g., Sham Cash"
                    />
                  </div>
                  <div>
                    <Label>Code</Label>
                    <Input
                      value={editData.code}
                      onChange={(e) => setEditData({...editData, code: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="e.g., ShamCash"
                    />
                  </div>
                </div>

                <div>
                  <Label>Account/Wallet Address</Label>
                  <Input
                    value={editData.address_text}
                    onChange={(e) => setEditData({...editData, address_text: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Account number or wallet address"
                  />
                </div>

                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    value={editData.instructions || ''}
                    onChange={(e) => setEditData({...editData, instructions: e.target.value})}
                    className="bg-white/5 border-white/10 text-white h-24"
                    placeholder="Payment instructions for users"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={editData.sort_order || 0}
                      onChange={(e) => setEditData({...editData, sort_order: parseInt(e.target.value)})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      checked={editData.is_active}
                      onCheckedChange={(checked) => setEditData({...editData, is_active: checked})}
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-white/20 text-white">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-cyan-500 to-blue-500"
              >
                {editData?.id ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}