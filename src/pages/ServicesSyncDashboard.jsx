import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock, Activity, Play } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

export default function ServicesSyncDashboard() {
  const queryClient = useQueryClient();
  const [syncProgress, setSyncProgress] = useState({});
  const [testLogs, setTestLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [activeTab, setActiveTab] = useState('sync');

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers-sync'],
    queryFn: () => base44.entities.APIProvider.list('-created_date', 100),
  });

  const { data: syncLogs = [] } = useQuery({
    queryKey: ['sync-logs'],
    queryFn: () => base44.entities.SyncLog.list('-created_date', 50),
  });

  const addLog = (type, message, details = null) => {
    setTestLogs(prev => [{
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      details,
      timestamp: new Date().toLocaleTimeString('ar')
    }, ...prev]);
  };

  const syncMutation = useMutation({
    mutationFn: async (providerId) => {
      setSyncProgress(prev => ({ ...prev, [providerId]: 0 }));
      
      const provider = providers.find(p => p.id === providerId);
      const isDHRUProvider = provider?.name?.toLowerCase().includes('dhru') || provider?.base_url?.includes('powergsm');
      
      let result;
      if (isDHRUProvider) {
        result = await base44.functions.syncDHRUServices({ providerId });
      } else {
        result = await base44.functions.syncStarkCardServices({ providerId });
      }
      
      if (!result.success) {
        throw new Error(result.error || 'خطأ غير معروف');
      }
      if (provider) {
        await base44.entities.SyncLog.create({
          provider_id: providerId,
          provider_name: provider.name,
          total_fetched: result.total || 0,
          created: result.created || 0,
          updated: result.updated || 0,
          failed_count: result.failed || 0,
          sync_mode: 'create_only',
          status: result.success ? 'success' : 'failed'
        });
      }
      return result;
    },
    onSuccess: (result, providerId) => {
      setSyncProgress(prev => ({ ...prev, [providerId]: 100 }));
      toast.success(result.message || 'تمت المزامنة بنجاح');
      queryClient.invalidateQueries({ queryKey: ['providers-sync'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setTimeout(() => setSyncProgress(prev => ({ ...prev, [providerId]: 0 })), 2000);
    },
    onError: (error, providerId) => {
      setSyncProgress(prev => ({ ...prev, [providerId]: 0 }));
      toast.error(error.message || 'فشلت المزامنة');
    }
  });

  const testMutation = useMutation({
    mutationFn: async (providerId) => {
      setIsRunning(true);
      addLog('info', 'بدء اختبار المزامنة...', `معرف المزود: ${providerId}`);

      try {
        const result = await base44.functions.invoke('testProviderSync', { providerId });
        
        if (result.data?.logs) {
          result.data.logs.forEach(log => addLog(log.type, log.message, log.details));
        }

        if (!result.data?.success) {
          throw new Error(result.data?.error || 'خطأ غير معروف');
        }

        queryClient.invalidateQueries({ queryKey: ['providers-sync'] });
        queryClient.invalidateQueries({ queryKey: ['services'] });
        
        toast.success('اكتملت المزامنة بنجاح!');
        return result.data;
      } catch (error) {
        addLog('error', 'خطأ في المزامنة', error.message);
        toast.error(error.message);
        throw error;
      } finally {
        setIsRunning(false);
      }
    }
  });

  const getLastSyncInfo = (providerId) => {
    return syncLogs.find(l => l.provider_id === providerId);
  };

  const activeProviders = providers.filter(p => p.is_active);

  const handleSync = (providerId) => {
    syncMutation.mutate(providerId);
  };

  const handleTest = () => {
    if (!selectedProviderId) {
      toast.error('اختر مزود للاختبار');
      return;
    }
    testMutation.mutate(selectedProviderId);
  };

  const clearLogs = () => {
    setTestLogs([]);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">لوحة تحكم مزامنة الخدمات</h2>
        <p className="text-gray-400">إدارة ومزامنة الخدمات من جميع المزودين الخارجيين</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        <GlowCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">المزودون النشطون</p>
              <p className="text-3xl font-bold text-cyan-400">{activeProviders.length}</p>
            </div>
            <Activity className="w-8 h-8 text-cyan-500 opacity-30" />
          </div>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">آخر 7 أيام</p>
              <p className="text-3xl font-bold text-green-400">
                {syncLogs.filter(l => {
                  const date = new Date(l.created_date);
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return date > weekAgo;
                }).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-500 opacity-30" />
          </div>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">إجمالي الخدمات</p>
              <p className="text-3xl font-bold text-purple-400">
                {syncLogs.reduce((sum, log) => sum + (log.total_fetched || 0), 0)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-500 opacity-30" />
          </div>
        </GlowCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => setActiveTab('sync')}
          className={`px-4 py-3 transition-colors ${
            activeTab === 'sync'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          المزامنة التلقائية
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-3 transition-colors ${
            activeTab === 'test'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          اختبار المزامنة
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 transition-colors ${
            activeTab === 'history'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          السجل
        </button>
      </div>

      {/* Sync Tab */}
      {activeTab === 'sync' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">مزامنة المزودين</h3>
          
          <AnimatePresence>
            {activeProviders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white/5 rounded-lg border border-white/10"
              >
                <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">لا توجد مزودون نشطون</p>
              </motion.div>
            ) : (
              activeProviders.map(provider => {
                const lastSync = getLastSyncInfo(provider.id);
                const progress = syncProgress[provider.id] || 0;
                const isSyncing = syncMutation.isPending && syncMutation.variables === provider.id;

                return (
                  <motion.div
                    key={provider.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <GlowCard className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-white mb-1">{provider.name}</h4>
                          <p className="text-sm text-gray-400">{provider.base_url}</p>
                        </div>
                        <Badge className='bg-green-500/20 text-green-400'>
                          نشط
                        </Badge>
                      </div>

                      {lastSync && (
                        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div>
                            <p className="text-xs text-gray-500">الخدمات المسحوبة</p>
                            <p className="text-lg font-bold text-cyan-400">{lastSync.total_fetched || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">جديدة / محدثة</p>
                            <p className="text-lg font-bold text-blue-400">{lastSync.created}/{lastSync.updated}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">وقت المزامنة</p>
                            <p className="text-xs text-gray-400">
                              {new Date(lastSync.created_date).toLocaleDateString('ar')}
                            </p>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => handleSync(provider.id)}
                        disabled={isSyncing}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'جاري المزامنة...' : 'بدء المزامنة'}
                      </Button>

                      {progress > 0 && (
                        <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </GlowCard>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="space-y-6">
          <GlowCard className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">اختر مزود للاختبار</label>
                <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="اختر مزود..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {providers.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name} {provider.is_active ? '✓' : '✗'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProviderId && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    {providers.find(p => p.id === selectedProviderId)?.base_url}
                  </p>
                </div>
              )}

              <Button
                onClick={handleTest}
                disabled={isRunning || !selectedProviderId}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                <Play className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? 'جاري الاختبار...' : 'بدء الاختبار'}
              </Button>
            </div>
          </GlowCard>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">السجلات ({testLogs.length})</h3>
              <Button
                onClick={clearLogs}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-200"
              >
                مسح
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testLogs.length === 0 ? (
                <GlowCard className="p-6 text-center">
                  <p className="text-gray-500">لا توجد سجلات بعد</p>
                </GlowCard>
              ) : (
                testLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <GlowCard className={`p-4 border-l-4 ${
                      log.type === 'success' ? 'border-green-500' :
                      log.type === 'error' ? 'border-red-500' :
                      log.type === 'warning' ? 'border-yellow-500' :
                      'border-blue-500'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {log.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
                          {log.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                          {log.type === 'warning' && <AlertCircle className="w-5 h-5 text-yellow-400" />}
                          {log.type === 'info' && <Loader2 className="w-5 h-5 text-blue-400" />}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-semibold ${
                              log.type === 'success' ? 'text-green-400' :
                              log.type === 'error' ? 'text-red-400' :
                              log.type === 'warning' ? 'text-yellow-400' :
                              'text-blue-400'
                            }`}>
                              {log.message}
                            </p>
                            <span className="text-xs text-gray-500">{log.timestamp}</span>
                          </div>

                          {log.details && (
                            <div className="bg-black/20 rounded p-3 mt-2 text-xs text-gray-300 font-mono max-h-40 overflow-y-auto">
                              {typeof log.details === 'string' ? (
                                <p>{log.details}</p>
                              ) : (
                                <pre>{JSON.stringify(log.details, null, 2)}</pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">سجل المزامنة</h3>
          {syncLogs.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {syncLogs.slice(0, 20).map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <GlowCard className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{log.provider_name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(log.created_date).toLocaleString('ar')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={log.status === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {log.total_fetched || 0} خدمة
                          </Badge>
                          <Badge className="bg-blue-500/20 text-blue-400">
                            +{log.created} {log.updated > 0 ? `~${log.updated}` : ''}
                          </Badge>
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <GlowCard className="p-6 text-center">
              <p className="text-gray-500">لا توجد سجلات مزامنة</p>
            </GlowCard>
          )}
        </div>
      )}
    </div>
  );
}