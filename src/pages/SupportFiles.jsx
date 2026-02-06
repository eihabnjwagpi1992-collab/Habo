import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Loader2, Download, AlertCircle, Lock, FileText } from 'lucide-react';
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

export default function SupportFiles() {
  const [user, setUser] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    };
    checkAuth();
  }, []);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['support-files'],
    queryFn: () => base44.entities.SupportFile.filter({ is_active: true }, '-created_date', 100),
  });

  const downloadMutation = useMutation({
    mutationFn: async (file) => {
      // تحقق من الصلاحيات
      if (!user) {
        base44.auth.redirectToLogin();
        throw new Error('يجب تسجيل الدخول');
      }

      // تحقق من إذن الوصول للسبورت
      if (!user.support_access) {
        throw new Error('ليس لديك صلاحية للوصول إلى ملفات السبورت. يرجى التواصل مع الأدمن');
      }

      // تحقق من الرصيد
      if (file.min_balance && user.balance < file.min_balance) {
        throw new Error(`الرصيد غير كافي. تحتاج إلى ${file.min_balance} على الأقل`);
      }

      // تحقق من المستوى
      if (file.min_tier !== 'regular' && user.tier !== file.min_tier) {
        const tierNames = { silver: 'فضي', gold: 'ذهبي' };
        throw new Error(`يتطلب حد أدنى من مستوى ${tierNames[file.min_tier]}`);
      }

      // زيادة عدد التحميلات
      await base44.entities.SupportFile.update(file.id, {
        download_count: (file.download_count || 0) + 1
      });

      // فتح رابط التحميل
      window.open(file.file_url, '_blank');

      return file;
    },
    onSuccess: () => {
      toast.success('جاري التحميل...');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deviceTypes = Array.from(new Set(files.map(f => f.device_type)));
  const fileTypes = Array.from(new Set(files.map(f => f.file_type)));

  const filteredFiles = files.filter(file => {
    const deviceMatch = selectedDevice === 'all' || file.device_type === selectedDevice;
    const typeMatch = selectedType === 'all' || file.file_type === selectedType;
    return deviceMatch && typeMatch;
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;
  }

  const canDownload = (file) => {
    if (!user) return false;
    if (!user.support_access) return false;
    if (file.min_balance && user.balance < file.min_balance) return false;
    if (file.min_tier !== 'regular' && user.tier !== file.min_tier) return false;
    return true;
  };

  const getDownloadReason = (file) => {
    if (!user) return 'يجب تسجيل الدخول';
    if (!user.support_access) return 'ليس لديك صلاحية الوصول - تواصل مع الأدمن';
    if (file.min_balance && user.balance < file.min_balance) {
      return `الرصيد غير كافي (تحتاج ${file.min_balance}$)`;
    }
    if (file.min_tier !== 'regular' && user.tier !== file.min_tier) {
      return `مستوى أقل من المطلوب`;
    }
    return '';
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ملفات السبورت والروت</h1>
          <p className="text-gray-400">تحميل ملفات الروت والـ PIT والأدوات اللازمة</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">نوع الجهاز</label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="all">جميع الأجهزة</SelectItem>
                {deviceTypes.map(device => (
                  <SelectItem key={device} value={device}>{device}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-2 block">نوع الملف</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                <SelectItem value="all">جميع الملفات</SelectItem>
                {fileTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Files Grid */}
        {filteredFiles.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">لا توجد ملفات متطابقة</p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredFiles.map((file) => {
                const canDownloadFile = canDownload(file);
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <GlowCard className="p-6 flex flex-col h-full hover:border-cyan-500/40 transition-all">
                      {/* Header */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white mb-2">{file.name}</h3>
                        {file.description && (
                          <p className="text-sm text-gray-400">{file.description}</p>
                        )}
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">
                          {file.device_type}
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                          {file.file_type}
                        </Badge>
                        {file.version && (
                          <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                            {file.version}
                          </Badge>
                        )}
                      </div>

                      {/* Info */}
                      <div className="bg-white/5 rounded-lg p-3 mb-4 space-y-1">
                        <p className="text-xs text-gray-400">
                          <span className="text-gray-500">الحجم:</span> {file.file_size} MB
                        </p>
                        <p className="text-xs text-gray-400">
                          <span className="text-gray-500">التحميلات:</span> {file.download_count || 0}
                        </p>
                        <p className="text-xs text-gray-400">
                          <span className="text-gray-500">المتطلب:</span> {
                            file.min_tier === 'regular' 
                              ? 'متاح للجميع' 
                              : file.min_tier === 'silver' 
                                ? 'فضي فما فوق'
                                : 'ذهبي فقط'
                          }
                        </p>
                        {file.min_balance > 0 && (
                          <p className="text-xs text-yellow-400">
                            <span className="text-gray-500">الحد الأدنى للرصيد:</span> ${file.min_balance}
                          </p>
                        )}
                      </div>

                      {/* Download Button */}
                      {canDownloadFile ? (
                        <Button
                          onClick={() => downloadMutation.mutate(file)}
                          disabled={downloadMutation.isPending}
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 mt-auto"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {downloadMutation.isPending ? 'جاري التحميل...' : 'تحميل الملف'}
                        </Button>
                      ) : (
                        <Button
                          disabled
                          className="w-full bg-gray-700 text-gray-400 cursor-not-allowed mt-auto"
                          title={getDownloadReason(file)}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          غير متاح
                        </Button>
                      )}

                      {!canDownloadFile && (
                        <div className="flex gap-2 items-start mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{getDownloadReason(file)}</span>
                        </div>
                      )}
                    </GlowCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}