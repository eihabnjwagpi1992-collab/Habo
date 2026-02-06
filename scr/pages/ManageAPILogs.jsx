import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Loader2, Eye, Copy, Filter, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
} from "@/components/ui/dialog";
import GlowCard from '@/components/ui/GlowCard';
import { toast } from "sonner";
import { motion, AnimatePresence } from 'framer-motion';

export default function ManageAPILogs() {
  const [selectedLog, setSelectedLog] = useState(null);
  const [filter, setFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['api-logs'],
    queryFn: () => base44.entities.APILog.list('-created_date', 200),
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers-for-logs'],
    queryFn: () => base44.entities.APIProvider.list('-created_date', 100),
  });

  const filteredLogs = logs.filter(log => {
    const statusMatch = filter === 'all' || 
      (filter === 'success' ? log.success : !log.success);
    const providerMatch = providerFilter === 'all' || 
      log.provider_id === providerFilter;
    return statusMatch && providerMatch;
  });

  const getStatusBadgeColor = (success) => {
    return success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ');
  };

  const downloadLogs = () => {
    const csv = [
      ['التاريخ', 'المزود', 'الطلب', 'العملية', 'الحالة', 'الخطأ'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_date).toLocaleString('ar'),
        log.provider_name,
        log.order_id,
        log.action,
        log.success ? 'نجح' : 'فشل',
        log.error_message || '-'
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `api-logs-${Date.now()}.csv`;
    link.click();
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;

  const successCount = logs.filter(l => l.success).length;
  const failedCount = logs.filter(l => !l.success).length;

  return (
    <div className="space-y-6 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">سجلات API</h2>
        <p className="text-gray-400">تتبع جميع عمليات الإرسال والاستجابات من المزودين</p>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        <GlowCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">إجمالي السجلات</p>
              <p className="text-3xl font-bold text-cyan-400">{logs.length}</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">نجح</p>
              <p className="text-3xl font-bold text-green-400">{successCount}</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">فشل</p>
              <p className="text-3xl font-bold text-red-400">{failedCount}</p>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Filters */}
      <GlowCard className="p-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">الحالة</label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="success">نجح فقط</SelectItem>
                <SelectItem value="failed">فشل فقط</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">المزود</label>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="all">جميع المزودين</SelectItem>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={downloadLogs}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              <Download className="w-4 h-4 mr-2" />
              تحميل CSV
            </Button>
          </div>
        </div>
      </GlowCard>

      {/* Logs Table */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white/5 rounded-lg border border-white/10"
            >
              <Filter className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">لا توجد سجلات</p>
            </motion.div>
          ) : (
            filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GlowCard className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-40">
                      <p className="text-sm text-gray-400">الطلب / العملية</p>
                      <p className="font-semibold text-white">{log.order_id}</p>
                      <p className="text-xs text-gray-500">{log.action}</p>
                    </div>

                    <div className="flex-1 min-w-40">
                      <p className="text-sm text-gray-400">المزود</p>
                      <p className="font-semibold text-cyan-400">{log.provider_name}</p>
                    </div>

                    <div className="flex-1 min-w-40">
                      <p className="text-sm text-gray-400">الحالة</p>
                      <Badge className={getStatusBadgeColor(log.success)}>
                        {log.success ? '✓ نجح' : '✗ فشل'}
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-40">
                      <p className="text-sm text-gray-400">HTTP</p>
                      <Badge variant="outline" className={log.http_status === 200 ? 'border-green-500/50' : 'border-red-500/50'}>
                        {log.http_status || '-'}
                      </Badge>
                    </div>

                    <div className="flex-1 min-w-40">
                      <p className="text-sm text-gray-400">الوقت</p>
                      <p className="text-xs text-gray-300">
                        {new Date(log.created_date).toLocaleString('ar')}
                      </p>
                    </div>

                    <Button
                      onClick={() => setSelectedLog(log)}
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-cyan-400"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </GlowCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">تفاصيل السجل</DialogTitle>
            <DialogDescription className="text-gray-400">
              طلب: {selectedLog?.order_id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <GlowCard className="p-4">
              <h3 className="font-semibold text-white mb-3">معلومات عامة</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">المزود</p>
                  <p className="text-white font-semibold">{selectedLog?.provider_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">العملية</p>
                  <p className="text-white font-semibold">{selectedLog?.action}</p>
                </div>
                <div>
                  <p className="text-gray-400">الحالة</p>
                  <Badge className={getStatusBadgeColor(selectedLog?.success)}>
                    {selectedLog?.success ? '✓ نجح' : '✗ فشل'}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-400">HTTP Status</p>
                  <p className="text-white font-semibold">{selectedLog?.http_status}</p>
                </div>
              </div>
            </GlowCard>

            {/* Error Message */}
            {selectedLog?.error_message && (
              <GlowCard className="p-4 border-red-500/20">
                <h3 className="font-semibold text-red-400 mb-2">رسالة الخطأ</h3>
                <p className="text-sm text-gray-300 bg-red-500/10 p-3 rounded border border-red-500/20">
                  {selectedLog.error_message}
                </p>
              </GlowCard>
            )}

            {/* Request Payload */}
            {selectedLog?.request_payload && (
              <GlowCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">الطلب المرسل</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedLog.request_payload)}
                    className="text-gray-400 hover:text-cyan-400"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="text-xs text-gray-300 bg-black/30 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                  {JSON.stringify(JSON.parse(selectedLog.request_payload), null, 2)}
                </pre>
              </GlowCard>
            )}

            {/* Response Payload */}
            {selectedLog?.response_payload && (
              <GlowCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">الرد من المزود</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(selectedLog.response_payload)}
                    className="text-gray-400 hover:text-cyan-400"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="text-xs text-gray-300 bg-black/30 p-3 rounded overflow-x-auto max-h-48 overflow-y-auto">
                  {JSON.stringify(JSON.parse(selectedLog.response_payload), null, 2)}
                </pre>
              </GlowCard>
            )}

            {/* Field Mappings */}
            {selectedLog?.field_mappings && (
              <GlowCard className="p-4">
                <h3 className="font-semibold text-white mb-3">معايرة الحقول</h3>
                <pre className="text-xs text-gray-300 bg-black/30 p-3 rounded overflow-x-auto">
                  {JSON.stringify(JSON.parse(selectedLog.field_mappings), null, 2)}
                </pre>
              </GlowCard>
            )}

            {/* Error Diagnosis */}
            {selectedLog?.error_diagnosis && (
              <GlowCard className="p-4 border-yellow-500/20">
                <h3 className="font-semibold text-yellow-400 mb-3">🔍 تشخيص الخطأ</h3>
                <div className="space-y-3">
                  {(() => {
                    try {
                      const diagnosis = JSON.parse(selectedLog.error_diagnosis);
                      return (
                        <>
                          <div className="p-3 bg-black/30 rounded">
                            <p className="text-sm font-mono text-gray-300">
                              <span className="text-yellow-400">نوع الخطأ:</span> {diagnosis.error_type}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className={`p-3 rounded border ${diagnosis.is_cors ? 'bg-red-500/10 border-red-500/30' : 'bg-black/30 border-white/10'}`}>
                              <p className="text-gray-400">CORS Error</p>
                              <p className={`font-semibold ${diagnosis.is_cors ? 'text-red-400' : 'text-gray-500'}`}>
                                {diagnosis.is_cors ? '✓ نعم' : '✗ لا'}
                              </p>
                            </div>

                            <div className={`p-3 rounded border ${diagnosis.is_parameter_mismatch ? 'bg-orange-500/10 border-orange-500/30' : 'bg-black/30 border-white/10'}`}>
                              <p className="text-gray-400">Parameter Mismatch</p>
                              <p className={`font-semibold ${diagnosis.is_parameter_mismatch ? 'text-orange-400' : 'text-gray-500'}`}>
                                {diagnosis.is_parameter_mismatch ? '✓ نعم' : '✗ لا'}
                              </p>
                            </div>

                            <div className={`p-3 rounded border ${diagnosis.is_authentication ? 'bg-red-500/10 border-red-500/30' : 'bg-black/30 border-white/10'}`}>
                              <p className="text-gray-400">Authentication Error</p>
                              <p className={`font-semibold ${diagnosis.is_authentication ? 'text-red-400' : 'text-gray-500'}`}>
                                {diagnosis.is_authentication ? '✓ نعم' : '✗ لا'}
                              </p>
                            </div>

                            <div className={`p-3 rounded border ${diagnosis.is_server_error ? 'bg-red-500/10 border-red-500/30' : 'bg-black/30 border-white/10'}`}>
                              <p className="text-gray-400">Server Error</p>
                              <p className={`font-semibold ${diagnosis.is_server_error ? 'text-red-400' : 'text-gray-500'}`}>
                                {diagnosis.is_server_error ? '✓ نعم' : '✗ لا'}
                              </p>
                            </div>
                          </div>

                          {diagnosis.suggestions?.length > 0 && (
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                              <p className="text-sm font-semibold text-blue-400 mb-2">التوصيات:</p>
                              <ul className="space-y-1 text-xs text-blue-300">
                                {diagnosis.suggestions.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <pre className="text-xs text-gray-400 bg-black/30 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                            {JSON.stringify(diagnosis, null, 2)}
                          </pre>
                        </>
                      );
                    } catch (e) {
                      return <p className="text-gray-400">{selectedLog.error_diagnosis}</p>;
                    }
                  })()}
                </div>
              </GlowCard>
            )}

            {/* Detailed Log */}
            {selectedLog?.detailed_log && (
              <GlowCard className="p-4">
                <h3 className="font-semibold text-white mb-3">📊 السجل المفصل</h3>
                <pre className="text-xs text-gray-300 bg-black/30 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                  {typeof selectedLog.detailed_log === 'string' 
                    ? selectedLog.detailed_log 
                    : JSON.stringify(selectedLog.detailed_log, null, 2)}
                </pre>
              </GlowCard>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}