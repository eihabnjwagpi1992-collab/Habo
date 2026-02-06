import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  StopCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const CATEGORIES = [
  { key: 'game_topup', name: '🟢 Game Top-Up' },
  { key: 'live_streaming', name: '🟣 Live Streaming Apps' },
  { key: 'apple_icloud', name: '🍎 Apple iCloud Services' },
  { key: 'frp_security', name: '🔐 FRP & Security Services' },
  { key: 'samsung', name: '🔵 Samsung Services' },
  { key: 'xiaomi', name: '🟠 Xiaomi Services' },
  { key: 'tools_activation', name: '🧰 Tools Activation' },
  { key: 'tools_credits', name: '💳 Tools Credits' },
  { key: 'remote_services', name: '🖥 Remote Services' },
  { key: 'social_media', name: '📣 Social Media Services' }
];

export default function ManageServiceClassifier() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [batchSize, setBatchSize] = useState(50);
  const [delayMs, setDelayMs] = useState(3000);

  // ✅ مهم: الافتراضي OFF حتى ما نمسح تصنيفات موجودة
  const [overwrite, setOverwrite] = useState(false);

  // ✅ تأكيد خاص فقط لـ game_topup لما يكون overwrite شغال
  const [confirmDanger, setConfirmDanger] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [progress, setProgress] = useState({
    totalProcessed: 0,
    matched: 0,
    updated: 0,
    skipped: 0,
    currentBatch: 0,
    lastServiceId: 0 // offset
  });

  const [logs, setLogs] = useState([]);

  const { data: keywords = [], refetch: refetchKeywords } = useQuery({
    queryKey: ['keywords', selectedCategory],
    queryFn: () => {
      if (!selectedCategory) return [];
      return base44.entities.ServiceKeyword.filter({ category: selectedCategory }, '-priority', 500);
    },
    enabled: !!selectedCategory
  });

  const addLog = (entry) => {
    setLogs(prev => [entry, ...prev].slice(0, 50));
  };

  const resetProgress = () => {
    setIsRunning(false);
    setIsPaused(false);
    setConfirmDanger(false);
    setProgress({
      totalProcessed: 0,
      matched: 0,
      updated: 0,
      skipped: 0,
      currentBatch: 0,
      lastServiceId: 0
    });
    addLog({ type: 'info', message: 'Progress reset (offset = 0)' });
  };

  useEffect(() => {
    // عند تغيير القسم: صفّر التقدم والتأكيد
    setIsRunning(false);
    setIsPaused(false);
    setConfirmDanger(false);
    setProgress({
      totalProcessed: 0,
      matched: 0,
      updated: 0,
      skipped: 0,
      currentBatch: 0,
      lastServiceId: 0
    });
    setLogs([]);
  }, [selectedCategory]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !selectedCategory) return;
    try {
      const kw = newKeyword.toLowerCase().trim();
      await base44.entities.ServiceKeyword.create({
        category: selectedCategory,
        keyword: kw
      });
      setNewKeyword('');
      refetchKeywords();
      addLog({ type: 'success', message: `Added keyword: "${kw}"` });
    } catch (e) {
      addLog({ type: 'error', message: `Failed to add keyword: ${e.message}` });
    }
  };

  const handleRemoveKeyword = async (keywordId) => {
    try {
      await base44.entities.ServiceKeyword.delete(keywordId);
      refetchKeywords();
      addLog({ type: 'success', message: 'Keyword removed' });
    } catch (e) {
      addLog({ type: 'error', message: `Failed to remove keyword: ${e.message}` });
    }
  };

  const runBatch = async () => {
    if (!selectedCategory || !keywords.length) {
      addLog({ type: 'error', message: 'Select category and ensure keywords exist' });
      return;
    }

    // ✅ حماية: game_topup + overwrite خطر لازم تأكيد
    if (selectedCategory === 'game_topup' && overwrite && !confirmDanger) {
      addLog({
        type: 'warn',
        message: 'DANGER: game_topup + overwrite can overwrite ALL services. Enable confirmation checkbox first.'
      });
      return;
    }

    if (isRunning && !isPaused) return;

    setIsRunning(true);
    setIsPaused(false);

    try {
      const response = await base44.functions.invoke('classifyServicesBatch', {
        category: selectedCategory,
        batchSize,
        delayMs,
        skip: progress.lastServiceId || 0,
        overwrite
      });

      const { matched, updated, skipped, has_more, last_service_id, next_delay_ms, errors } = response.data || {};

      setProgress(prev => ({
        ...prev,
        totalProcessed: prev.totalProcessed + (batchSize || 0), // ✅ processed فعليًا
        matched: prev.matched + (matched || 0),
        updated: prev.updated + (updated || 0),
        skipped: prev.skipped + (skipped || 0),
        currentBatch: prev.currentBatch + 1,
        lastServiceId: typeof last_service_id === 'number'
          ? last_service_id
          : (prev.lastServiceId + (batchSize || 0))
      }));

      addLog({
        type: 'info',
        message: `Batch ${progress.currentBatch + 1}: ${matched || 0} matched, ${updated || 0} updated, ${skipped || 0} skipped`
      });

      if (errors?.length > 0) {
        errors.forEach(err => {
          addLog({ type: 'warn', message: `Error: ${err.service_name || err.service_id || 'unknown'} - ${err.error}` });
        });
      }

      if (has_more && isRunning && !isPaused) {
        await new Promise(resolve => setTimeout(resolve, next_delay_ms || delayMs));
        if (isRunning && !isPaused) {
          setTimeout(() => runBatch(), 100);
        }
      } else {
        setIsRunning(false);
        if (!has_more) addLog({ type: 'success', message: 'Classification complete for this category' });
      }
    } catch (e) {
      addLog({ type: 'error', message: `Batch failed: ${e.message}` });
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-color)' }}>
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-color)' }}>
          Service Classifier Tool
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left */}
          <div className="md:col-span-1">
            <Card className="p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-color)' }}>Configuration</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
                    Category
                  </label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat.key} value={cat.key}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Overwrite */}
                <div className="flex items-center gap-2">
                  <input
                    id="overwriteToggle"
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => {
                      setOverwrite(e.target.checked);
                      setConfirmDanger(false);
                    }}
                  />
                  <label htmlFor="overwriteToggle" className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Overwrite existing category (DANGEROUS if keywords are broad)
                  </label>
                </div>

                {/* Danger confirm for game_topup */}
                {selectedCategory === 'game_topup' && overwrite && (
                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <input
                      id="confirmDanger"
                      type="checkbox"
                      checked={confirmDanger}
                      onChange={(e) => setConfirmDanger(e.target.checked)}
                    />
                    <label htmlFor="confirmDanger" className="text-sm" style={{ color: 'var(--warning)' }}>
                      I understand: this may overwrite ALL services to Game Top-Up
                    </label>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
                    Batch Size
                  </label>
                  <Input
                    type="number"
                    min="10"
                    max="200"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value || '50'))}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 block" style={{ color: 'var(--text-muted)' }}>
                    Delay Between Batches (ms)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10000"
                    step="500"
                    value={delayMs}
                    onChange={(e) => setDelayMs(parseInt(e.target.value || '3000'))}
                  />
                </div>

                {/* Controls */}
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      if (isPaused) {
                        setIsPaused(false);
                        setTimeout(() => runBatch(), 100);
                      } else {
                        runBatch();
                      }
                    }}
                    disabled={!selectedCategory || keywords.length === 0}
                    className="flex-1 text-white"
                    style={{ background: isRunning && !isPaused ? 'var(--warning)' : 'var(--primary)' }}
                  >
                    {isRunning && !isPaused ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Running
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>

                  {isRunning && (
                    <Button
                      onClick={() => setIsPaused(!isPaused)}
                      variant="outline"
                      className="flex-1"
                    >
                      {isPaused ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      )}
                    </Button>
                  )}

                  {isRunning && (
                    <Button
                      onClick={() => {
                        setIsRunning(false);
                        setIsPaused(false);
                      }}
                      variant="outline"
                      className="flex-1"
                      style={{ color: 'var(--error)' }}
                    >
                      <StopCircle className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  )}
                </div>

                {/* Reset offset */}
                <Button
                  onClick={resetProgress}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Offset / Progress
                </Button>
              </div>
            </Card>
          </div>

          {/* Middle */}
          <div className="md:col-span-1">
            <Card className="p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-color)' }}>
                Keywords ({keywords.length})
              </h2>

              {selectedCategory ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    />
                    <Button
                      onClick={handleAddKeyword}
                      size="icon"
                      style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2">
                    <AnimatePresence>
                      {keywords.map(kw => (
                        <motion.div
                          key={kw.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="flex items-center justify-between p-2 rounded-lg"
                          style={{ backgroundColor: 'var(--bg-secondary)' }}
                        >
                          <code className="text-sm" style={{ color: 'var(--primary)' }}>
                            {kw.keyword}
                          </code>
                          <Button
                            onClick={() => handleRemoveKeyword(kw.id)}
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            style={{ color: 'var(--error)' }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Select a category first</p>
              )}
            </Card>
          </div>

          {/* Right */}
          <div className="md:col-span-1">
            <Card className="p-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-color)' }}>Progress</h2>

              <div className="space-y-3">
                <div>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm">Total Processed (estimate)</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                    {progress.totalProcessed}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">Matched</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>
                      {progress.matched}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--text-muted)' }} className="text-xs">Updated</p>
                    <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                      {progress.updated}
                    </p>
                  </div>
                </div>

                <div>
                  <p style={{ color: 'var(--text-muted)' }} className="text-sm">Batch #{progress.currentBatch}</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                    Offset: {progress.lastServiceId}
                  </p>
                </div>

                {isRunning && (
                  <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--warning)' }} />
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {isPaused ? 'Paused' : 'Processing...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Logs */}
        <Card className="p-6 mt-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-color)' }}>Logs (Last 50)</h2>
          <div className="max-h-64 overflow-y-auto space-y-2">
            <AnimatePresence>
              {logs.map((log, idx) => (
                <motion.div
                  key={`${log.message}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-start gap-3 p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderLeft: `3px solid ${
                      log.type === 'error' ? 'var(--error)' :
                      log.type === 'success' ? 'var(--success)' :
                      log.type === 'warn' ? 'var(--warning)' :
                      'var(--primary)'
                    }`
                  }}
                >
                  {log.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />}
                  {log.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />}
                  <span style={{ color: 'var(--text-muted)' }}>{log.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </div>
    </div>
  );
}
