import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { 
  Search,
  UserCog,
  Shield,
  Loader2,
  Edit,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import GlowCard from "@/components/ui/GlowCard";
import { format } from "date-fns";
import { toast } from "sonner";

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({
    balance: '',
    user_type: 'regular',
    discount_percent: '',
    account_status: 'active',
    support_access: false,
    tier: 'regular'
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('User updated successfully');
      setEditDialog(false);
    }
  });

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditData({
      balance: user.balance?.toString() || '0',
      user_type: user.user_type || 'regular',
      discount_percent: user.discount_percent?.toString() || '0',
      account_status: user.account_status || 'active',
      support_access: user.support_access || false,
      tier: user.tier || 'regular'
    });
    setEditDialog(true);
  };

  const handleUpdate = () => {
    updateMutation.mutate({
      id: selectedUser.id,
      data: {
        balance: parseFloat(editData.balance),
        user_type: editData.user_type,
        discount_percent: parseFloat(editData.discount_percent),
        account_status: editData.account_status,
        support_access: editData.support_access,
        tier: editData.tier
      }
    });
  };

  return (
    <div className="py-4">
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Manage Users</h1>
          <p className="text-gray-400">Manage user accounts and balances</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="mb-6 text-gray-400">
          Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <GlowCard key={user.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {user.full_name?.[0] || user.email?.[0] || 'U'}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg mb-1">
                        {user.full_name || 'Unnamed User'}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">{user.email}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserCog className="w-3 h-3 mr-1" />}
                          {user.role}
                        </Badge>
                        <Badge className={
                          user.user_type === 'big_seller'
                            ? 'bg-amber-500/20 text-amber-400'
                            : user.user_type === 'reseller' 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-white/10 text-gray-300'
                        }>
                          {user.user_type === 'big_seller' ? 'Big Seller' : user.user_type === 'reseller' ? 'Reseller' : 'Regular'}
                        </Badge>
                        <Badge variant={
                          user.account_status === 'active' ? 'default' : 'destructive'
                        }>
                          {user.account_status || 'active'}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-400">
                        <span>Orders: {user.total_orders || 0}</span>
                        <span>•</span>
                        <span>Spent: ${(user.total_spent || 0).toFixed(2)}</span>
                        {user.user_type === 'reseller' && user.discount_percent > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-green-400">Discount: {user.discount_percent}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-1">Balance</p>
                      <p className="text-xl font-bold text-white">
                        ${(user.balance || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined {format(new Date(user.created_date), 'MMM yyyy')}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleEdit(user)}
                      variant="outline"
                      size="sm"
                      className="border-cyan-500/30 text-cyan-400"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}

        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-4 py-4">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-white text-sm break-all">{selectedUser.email}</p>
                </div>

                <div>
                  <Label className="text-sm">Balance ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editData.balance}
                    onChange={(e) => setEditData({...editData, balance: e.target.value})}
                    className="bg-white/5 border-white/10 text-white h-10"
                  />
                </div>

                <div>
                  <Label className="text-sm">User Type</Label>
                  <Select value={editData.user_type} onValueChange={(v) => setEditData({...editData, user_type: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="reseller">Reseller</SelectItem>
                      <SelectItem value="big_seller">Big Seller (Wholesale)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editData.user_type === 'reseller' && (
                  <div>
                    <Label className="text-sm">Discount Percentage (%)</Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={editData.discount_percent}
                      onChange={(e) => setEditData({...editData, discount_percent: e.target.value})}
                      className="bg-white/5 border-white/10 text-white h-10"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm">Tier Level</Label>
                  <Select value={editData.tier} onValueChange={(v) => setEditData({...editData, tier: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm">Account Status</Label>
                  <Select value={editData.account_status} onValueChange={(v) => setEditData({...editData, account_status: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <Label className="text-cyan-400 block">Support Files Access</Label>
                      <p className="text-xs text-gray-400">Allow user to download support files</p>
                    </div>
                  </div>
                  <Switch
                    checked={editData.support_access}
                    onCheckedChange={(checked) => setEditData({...editData, support_access: checked})}
                    className="flex-shrink-0 ml-4"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)} className="border-white/20 text-white">
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}