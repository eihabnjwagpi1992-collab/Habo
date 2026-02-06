import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Plus, Edit, Trash2, Loader2, Eye, EyeOff, RefreshCw, History } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function ManageAPIProviders() {
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState(false);
  const [syncDialog, setSyncDialog] = useState(false);
  const [logsDialog, setLogsDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [syncMode, setSyncMode] = useState('create_only');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSecrets, setShowSecrets] = useState({});

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['api-providers'],
    queryFn: () => base44.entities.ProviderAPI.list('-created_date'),
    initialData: [],
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ['sync-logs', selectedProvider?.id],
    queryFn: () => selectedProvider ? base44.entities.SyncLog.filter({ provider_id: selectedProvider.id }, '-created_date', 10) : [],
    enabled: !!selectedProvider,
    initialData: [],
  });

  const { data: pricingSettings = [] } = useQuery({
    queryKey: ['pricing-settings'],
    queryFn: () => base44.entities.PricingSettings.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ProviderAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['api-providers']);
      toast.success('API Provider created');
      setEditDialog(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProviderAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['api-providers']);
      toast.success('API Provider updated');
      setEditDialog(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ProviderAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['api-providers']);
      toast.success('API Provider deleted');
    }
  });

  const handleEdit = (provider) => {
    setEditData(provider || {
      provider_name: '',
      base_url: '',
      api_key: '',
      username: '',
      password: '',
      webhook_secret: '',
      is_active: false,
      notes: ''
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

  const toggleSecret = (id) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSync = async () => {
    if (!selectedProvider) return;
    
    setIsSyncing(true);
    try {
      // Mock sync - في الواقع هنا ستتصل بـ API المزود
      // هذا مثال فقط - يجب استبداله بالتكامل الفعلي
      const mockServices = [
        { id: '1', name: 'iPhone 14 Unlock', category: 'gsm_server', base_cost: 10 },
        { id: '2', name: 'Samsung S23 Unlock', category: 'gsm_server', base_cost: 8 },
        { id: '3', name: 'PUBG 600 UC', category: 'game_topup', base_cost: 5 }
      ];

      const log = {
        provider_id: selectedProvider.id,
        provider_name: selectedProvider.provider_name,
        total_fetched: mockServices.length,
        created: 0,
        updated: 0,
        failed_count: 0,
        errors: '',
        sync_mode: syncMode,
        status: 'success'
      };

      // Get pricing settings
      const globalSettings = pricingSettings.find(s => s.setting_key === 'global') || {
        profit_type: 'fixed',
        profit_value: 0,
        reseller_discount_percent: 0,
        big_seller_discount_percent: 0
      };

      for (const apiService of mockServices) {
        try {
          // Save to APIService
          const existingAPIService = await base44.entities.APIService.filter({
            provider_id: selectedProvider.id,
            external_service_id: apiService.id
          });

          if (existingAPIService.length === 0) {
            await base44.entities.APIService.create({
              provider_id: selectedProvider.id,
              external_service_id: apiService.id,
              name: apiService.name,
              category: apiService.category,
              base_cost: apiService.base_cost,
              is_active: true,
              raw_payload: JSON.stringify(apiService)
            });
          }

          // Check category override
          const categorySettings = pricingSettings.find(s => s.setting_key === `category_${apiService.category}`);
          const settings = categorySettings || globalSettings;

          // Calculate price
          let price = apiService.base_cost;
          if (settings.profit_type === 'fixed') {
            price += settings.profit_value;
          } else {
            price += price * (settings.profit_value / 100);
          }

          // Calculate reseller/big seller prices
          const resellerPrice = price * (1 - (globalSettings.reseller_discount_percent || 0) / 100);
          const bigSellerPrice = price * (1 - (globalSettings.big_seller_discount_percent || 0) / 100);

          // Upsert to Service
          const existingServices = await base44.entities.Service.filter({
            external_service_id: apiService.id,
            provider_id: selectedProvider.id
          });

          if (existingServices.length > 0) {
            if (syncMode === 'update_existing') {
              await base44.entities.Service.update(existingServices[0].id, {
                name: apiService.name,
                category: apiService.category,
                base_cost: apiService.base_cost,
                price: price,
                reseller_price: resellerPrice,
                big_seller_price: bigSellerPrice,
                profit_type: settings.profit_type,
                profit_value: settings.profit_value,
                last_synced_at: new Date().toISOString()
              });
              log.updated++;
            }
          } else {
            await base44.entities.Service.create({
              name: apiService.name,
              category: apiService.category,
              subcategory: '',
              price: price,
              reseller_price: resellerPrice,
              big_seller_price: bigSellerPrice,
              provider_id: selectedProvider.id,
              external_service_id: apiService.id,
              base_cost: apiService.base_cost,
              profit_type: settings.profit_type,
              profit_value: settings.profit_value,
              sync_source: 'provider',
              last_synced_at: new Date().toISOString(),
              is_active: true
            });
            log.created++;
          }
        } catch (err) {
          log.failed_count++;
          log.errors += `${apiService.name}: ${err.message}\n`;
        }
      }

      log.status = log.failed_count === 0 ? 'success' : log.failed_count < log.total_fetched ? 'partial' : 'failed';
      
      await base44.entities.SyncLog.create(log);
      queryClient.invalidateQueries(['sync-logs']);
      queryClient.invalidateQueries(['admin-services']);

      toast.success(`Sync completed: ${log.created} created, ${log.updated} updated, ${log.failed_count} failed`);
      setSyncDialog(false);
    } catch (error) {
      console.error(error);
      toast.error('Sync failed: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">API Providers</h1>
            <p className="text-gray-400">Manage external API integrations (StarkCard, etc.)</p>
          </div>
          <Button
            onClick={() => handleEdit(null)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Provider
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <GlowCard key={provider.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">{provider.provider_name}</h3>
                    <p className="text-sm text-gray-400">{provider.base_url}</p>
                  </div>
                  <div className="flex gap-2">
                    {provider.is_active && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setSyncDialog(true);
                          }}
                          className="text-green-400 hover:text-green-300"
                          title="Sync Services"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setLogsDialog(true);
                          }}
                          className="text-purple-400 hover:text-purple-300"
                          title="View Logs"
                        >
                          <History className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(provider)}
                      className="text-cyan-400 hover:text-cyan-300"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(provider.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">API Key:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-white font-mono">
                        {showSecrets[provider.id] ? provider.api_key : '••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleSecret(provider.id)}
                        className="text-gray-500 hover:text-gray-300"
                      >
                        {showSecrets[provider.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {provider.username && (
                    <div>
                      <span className="text-gray-400">Username:</span>
                      <p className="text-white">{provider.username}</p>
                    </div>
                  )}

                  {provider.notes && (
                    <div className="md:col-span-2">
                      <span className="text-gray-400">Notes:</span>
                      <p className="text-white text-xs mt-1">{provider.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Status:</span>
                    <span className={provider.is_active ? 'text-green-400 font-semibold' : 'text-red-400'}>
                      {provider.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}

        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editData?.id ? 'Edit' : 'Add'} API Provider</DialogTitle>
            </DialogHeader>

            {editData && (
              <div className="space-y-4 py-4">
                <div>
                  <Label>Provider Name</Label>
                  <Input
                    value={editData.provider_name}
                    onChange={(e) => setEditData({...editData, provider_name: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="e.g., StarkCard"
                  />
                </div>

                <div>
                  <Label>Base URL</Label>
                  <Input
                    value={editData.base_url}
                    onChange={(e) => setEditData({...editData, base_url: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://api.example.com"
                  />
                </div>

                <div>
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    value={editData.api_key}
                    onChange={(e) => setEditData({...editData, api_key: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="API key"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Username (Optional)</Label>
                    <Input
                      value={editData.username || ''}
                      onChange={(e) => setEditData({...editData, username: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label>Password (Optional)</Label>
                    <Input
                      type="password"
                      value={editData.password || ''}
                      onChange={(e) => setEditData({...editData, password: e.target.value})}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label>Webhook Secret (Optional)</Label>
                  <Input
                    type="password"
                    value={editData.webhook_secret || ''}
                    onChange={(e) => setEditData({...editData, webhook_secret: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    className="bg-white/5 border-white/10 text-white h-24"
                    placeholder="Internal notes about this provider"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={editData.is_active}
                    onCheckedChange={(checked) => setEditData({...editData, is_active: checked})}
                  />
                  <Label>Activate Provider (enable API calls)</Label>
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

        {/* Sync Dialog */}
        <Dialog open={syncDialog} onOpenChange={setSyncDialog}>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Sync Services from {selectedProvider?.provider_name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-gray-400 text-sm">
                This will fetch services from the provider and create/update them in your database.
              </p>

              <div>
                <Label>Sync Mode</Label>
                <RadioGroup value={syncMode} onValueChange={setSyncMode} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="create_only" id="create_only" />
                    <Label htmlFor="create_only" className="font-normal cursor-pointer">
                      Create missing only (don't update existing)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="update_existing" id="update_existing" />
                    <Label htmlFor="update_existing" className="font-normal cursor-pointer">
                      Create missing and update existing
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <p className="text-sm text-cyan-400">
                  Pricing will be calculated automatically based on your pricing settings.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setSyncDialog(false)} 
                className="border-white/20 text-white"
                disabled={isSyncing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Start Sync
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Logs Dialog */}
        <Dialog open={logsDialog} onOpenChange={setLogsDialog}>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sync Logs - {selectedProvider?.provider_name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {syncLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No sync logs yet</p>
              ) : (
                syncLogs.map((log) => (
                  <div key={log.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className={
                        log.status === 'success' ? 'bg-green-500/20 text-green-400' :
                        log.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }>
                        {log.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_date).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                      <div>
                        <span className="text-gray-400">Fetched:</span>
                        <span className="text-white ml-2">{log.total_fetched}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Created:</span>
                        <span className="text-green-400 ml-2">{log.created}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Updated:</span>
                        <span className="text-cyan-400 ml-2">{log.updated}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Failed:</span>
                        <span className="text-red-400 ml-2">{log.failed_count}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Mode: {log.sync_mode === 'create_only' ? 'Create only' : 'Update existing'}
                    </div>

                    {log.errors && (
                      <div className="mt-2 p-2 rounded bg-red-500/10 text-xs text-red-400">
                        <pre className="whitespace-pre-wrap">{log.errors}</pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setLogsDialog(false)} 
                className="border-white/20 text-white"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}