import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import GlowCard from '@/components/ui/GlowCard';
import { PlayCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ServiceQualityEnforcer() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  const runBatchUpdate = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    
    let offset = 0;
    const batchSize = 50;
    let hasMore = true;
    let totalUpdated = 0;

    while (hasMore) {
      try {
        const { data } = await base44.functions.invoke('enforceServiceQualityBatched', {
          offset,
          batchSize
        });

        if (data.success) {
          setProgress(data.stats.progress);
          totalUpdated += data.stats.updated;
          
          setLogs(prev => [...prev, {
            type: 'success',
            message: `✅ دفعة ${offset}-${offset + batchSize}: تم تحديث ${data.stats.updated} خدمة`
          }]);

          hasMore = data.hasMore;
          offset = data.nextOffset;

          // انتظار 2 ثانية بين الدفعات لتجنب Rate Limit
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } else {
          setLogs(prev => [...prev, {
            type: 'error',
            message: `❌ خطأ: ${data.error}`
          }]);
          hasMore = false;
        }
      } catch (error) {
        setLogs(prev => [...prev, {
          type: 'error',
          message: `❌ خطأ: ${error.message}`
        }]);
        hasMore = false;
      }
    }

    setStats({ totalUpdated });
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <GlowCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">تحسين جودة الخدمات</h2>
            <p className="text-gray-400 text-sm">
              تحديث تلقائي للصور والأسماء لجميع الخدمات
            </p>
          </div>
          <Button
            onClick={runBatchUpdate}
            disabled={isRunning}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                بدء التحديث
              </>
            )}
          </Button>
        </div>

        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>التقدم</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {stats && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">اكتمل التحديث!</span>
            </div>
            <p className="text-sm text-gray-300 mt-2">
              تم تحديث {stats.totalUpdated} خدمة بنجاح
            </p>
          </div>
        )}
      </GlowCard>

      {logs.length > 0 && (
        <GlowCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">سجل العمليات</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-sm ${
                  log.type === 'success'
                    ? 'bg-green-500/10 text-green-300'
                    : 'bg-red-500/10 text-red-300'
                }`}
              >
                {log.message}
              </div>
            ))}
          </div>
        </GlowCard>
      )}
    </div>
  );
}