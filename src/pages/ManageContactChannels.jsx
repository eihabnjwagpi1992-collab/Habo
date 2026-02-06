import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";

export default function ManageContactChannels() {
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState(null);

  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['contact-channels-all'],
    queryFn: () => base44.entities.ContactChannel.list('sort_order'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContactChannel.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact-channels-all']);
      toast.success('Contact channel created');
      setEditDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ContactChannel.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact-channels-all']);
      toast.success('Contact channel updated');
      setEditDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ContactChannel.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contact-channels-all']);
      toast.success('Contact channel deleted');
    }
  });

  const handleEdit = (channel) => {
    setEditData(channel || {
      type: 'WhatsApp',
      label: '',
      value: '',
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
            <h1 className="text-3xl font-bold text-white mb-2">Contact Channels</h1>
            <p className="text-gray-400">Manage contact information displayed to users</p>
          </div>
          <Button
            onClick={() => handleEdit(null)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Channel
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((channel) => (
              <GlowCard key={channel.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{channel.label}</h3>
                    <p className="text-sm text-cyan-400">{channel.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(channel)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(channel.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">Value:</span>
                    <p className="text-white">{channel.value}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-gray-400">Status:</span>
                    <span className={channel.is_active ? 'text-green-400' : 'text-red-400'}>
                      {channel.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}

        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>{editData?.id ? 'Edit' : 'Add'} Contact Channel</DialogTitle>
            </DialogHeader>

            {editData && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>Type</Label>
                  <Select 
                    value={editData.type} 
                    onValueChange={(v) => setEditData({...editData, type: v})}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Telegram">Telegram</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Phone">Phone</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Label</Label>
                  <Input
                    value={editData.label}
                    onChange={(e) => setEditData({...editData, label: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="e.g., WhatsApp Support"
                  />
                </div>

                <div>
                  <Label>Value (Number/Link/Address)</Label>
                  <Input
                    value={editData.value}
                    onChange={(e) => setEditData({...editData, value: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="e.g., +963123456789"
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