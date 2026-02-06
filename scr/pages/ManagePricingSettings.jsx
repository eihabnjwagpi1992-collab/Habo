import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Settings, Loader2, Save, RotateCcw, Smartphone, Shield, Gamepad, Wifi, Zap, CreditCard, Monitor, Video, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

// 1. تعريف الفئات الـ 10 بناءً على الصور المرفقة
// المفتاح (id) يستخدم في قاعدة البيانات، والـ label للعرض
const CATEGORIES_LIST = [
  { id: 'apple_services', label: 'خدمات آبل وآيكلود', icon: Smartphone },
  { id: 'samsung_services', label: 'خدمات سامسونج', icon: Smartphone },
  { id: 'xiaomi_services', label: 'خدمات شاومي', icon: Smartphone },
  { id: 'frp_security', label: 'حماية وتخطي FRP', icon: Shield },
  { id: 'box_activation', label: 'تفعيل البوكسات والأدوات', icon: Zap },
  { id: 'tool_credits', label: 'كريديت الأدوات', icon: CreditCard },
  { id: 'game_topup', label: 'شحن ألعاب', icon: Gamepad },
  { id: 'streaming_apps', label: 'تطبيقات البث المباشر', icon: Video },
  { id: 'remote_services', label: 'خدمات عن بعد', icon: Monitor },
  { id: 'social_media', label: 'خدمات السوشيال ميديا', icon: Globe },
];

const DEFAULT_VALUES = {
  profit_type: 'fixed',
  profit_value: '',
  reseller_discount_percent: '',
  big_seller_discount_percent: ''
};

export default function ManagePricingSettings() {
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['pricing-settings'],
    queryFn: () => base44.entities.PricingSettings.list(),
    initialData: [],
  });

  // Global State
  const [globalSettings, setGlobalSettings] = useState({ ...DEFAULT_VALUES });
  
  // Category State: نولد الحالة الأولية ديناميكياً بناءً على القائمة أعلاه
  const [categorySettings, setCategorySettings] = useState(() => {
    const initialState = {};
    CATEGORIES_LIST.forEach(cat => {
      initialState[cat.id] = { ...DEFAULT_VALUES, db_id: null };
    });
    return initialState;
  });

  // تحميل البيانات وربطها بالفئات
  useEffect(() => {
    if (settings.length > 0) {
      // 1. Global Settings
      const global = settings.find(s => s.setting_key === 'global');
      if (global) {
        setGlobalSettings({
          profit_type: global.profit_type || 'fixed',
          profit_value: global.profit_value?.toString() || '',
          reseller_discount_percent: global.reseller_discount_percent?.toString() || '',
          big_seller_discount_percent: global.big_seller_discount_percent?.toString() || ''
        });
      }

      // 2. Category Settings (Loop through our 10 defined categories)
      const newCategorySettings = { ...categorySettings };
      
      CATEGORIES_LIST.forEach(cat => {
        // مفتاح البحث في الداتابيز سيكون مثلاً: category_apple_services
        const dbKey = `category_${cat.id}`;
        const catSetting = settings.find(s => s.setting_key === dbKey);

        if (catSetting) {
          newCategorySettings[cat.id] = {
            db_id: catSetting.id, // نحفظ الـ ID لعمليات التحديث والحذف
            profit_type: catSetting.profit_type || 'fixed',
            profit_value: catSetting.profit_value?.toString() || '',
            reseller_discount_percent: catSetting.reseller_discount_percent?.toString() || '',
            big_seller_discount_percent: catSetting.big_seller_discount_percent?.toString() || ''
          };
        } else {
            // تصفير الحالة إذا لم يكن موجوداً في الداتابيز
            newCategorySettings[cat.id] = { ...DEFAULT_VALUES, db_id: null };
        }
      });
      
      setCategorySettings(newCategorySettings);
    }
  }, [settings]);

  // دالة الحفظ (Create or Update)
  const upsertMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        setting_key: data.setting_key,
        profit_type: data.profit_type,
        profit_value: parseFloat(data.profit_value) || 0,
        reseller_discount_percent: parseFloat(data.reseller_discount_percent) || 0,
        big_seller_discount_percent: parseFloat(data.big_seller_discount_percent) || 0,
      };

      if (data.db_id) {
        await base44.entities.PricingSettings.update(data.db_id, payload);
      } else {
        await base44.entities.PricingSettings.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-settings'] });
      toast.success('تم حفظ الإعدادات بنجاح');
    },
    onError: () => toast.error('حدث خطأ أثناء الحفظ')
  });

  // دالة الحذف (Reset to Global)
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.PricingSettings.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-settings'] });
      toast.info('تمت إعادة تعيين الفئة للإعدادات العامة');
    }
  });

  const handleSaveGlobal = () => {
    const globalId = settings.find(s => s.setting_key === 'global')?.id;
    upsertMutation.mutate({
      db_id: globalId,
      setting_key: 'global',
      ...globalSettings
    });
  };

  const handleSaveCategory = (catId) => {
    upsertMutation.mutate({
      db_id: categorySettings[catId].db_id,
      setting_key: `category_${catId}`, // سيتم حفظها باسم مثل category_apple_services
      ...categorySettings[catId]
    });
  };

  const handleResetCategory = (catId, catLabel) => {
    const dbId = categorySettings[catId].db_id;
    if (dbId) {
        if(window.confirm(`هل أنت متأكد من إعادة تعيين "${catLabel}" للإعدادات العامة؟`)) {
            deleteMutation.mutate(dbId);
        }
    }
  };

  const updateGlobal = (field, value) => setGlobalSettings(prev => ({ ...prev, [field]: value }));
  const updateCategory = (catId, field, value) => setCategorySettings(prev => ({
    ...prev,
    [catId]: { ...prev[catId], [field]: value }
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12" dir="rtl">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-8 text-right">
          <h1 className="text-3xl font-bold text-white mb-2">إعدادات التسعير</h1>
          <p className="text-gray-400">تحكم في قواعد الربح العامة وتخصيص الأسعار لكل فئة (10 فئات).</p>
        </div>

        {/* Global Settings */}
        <GlowCard className="p-6 mb-8 border-cyan-500/20">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <Settings className="w-6 h-6 text-cyan-400" />
            <div>
                <h2 className="text-xl font-semibold text-white">التسعير العام (Global)</h2>
                <p className="text-xs text-gray-400">القواعد الافتراضية المطبقة على جميع الخدمات ما لم يتم تجاوزها.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>نوع الربح</Label>
                <Select 
                  value={globalSettings.profit_type}
                  onValueChange={(v) => updateGlobal('profit_type', v)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10" dir="rtl">
                    <SelectItem value="fixed">مبلغ ثابت ($)</SelectItem>
                    <SelectItem value="percent">نسبة مئوية (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>قيمة الربح</Label>
                <Input
                  type="number"
                  placeholder="مثلاً: 0.5 أو 10"
                  value={globalSettings.profit_value}
                  onChange={(e) => updateGlobal('profit_value', e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-right"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>خصم الموزع (Reseller) %</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={globalSettings.reseller_discount_percent}
                  onChange={(e) => updateGlobal('reseller_discount_percent', e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-right"
                />
              </div>
              <div>
                <Label>خصم التاجر الكبير (Big Seller) %</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={globalSettings.big_seller_discount_percent}
                  onChange={(e) => updateGlobal('big_seller_discount_percent', e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-right"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
                <Button
                onClick={handleSaveGlobal}
                disabled={upsertMutation.isPending}
                className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white min-w-[200px]"
                >
                {upsertMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                حفظ الإعدادات العامة
                </Button>
            </div>
          </div>
        </GlowCard>

        {/* Category Overrides List */}
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">تخصيص الفئات (Category Overrides)</h2>
            <p className="text-gray-400 text-sm">يمكنك هنا كسر القواعد العامة ووضع تسعير خاص لكل قسم من الأقسام العشرة.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {CATEGORIES_LIST.map((cat) => {
                const data = categorySettings[cat.id] || DEFAULT_VALUES;
                const isOverridden = !!data.db_id; // هل يوجد تخصيص محفوظ؟
                const Icon = cat.icon;

                return (
                <GlowCard key={cat.id} className={`p-5 transition-all duration-300 ${isOverridden ? 'border-cyan-500/50 bg-cyan-950/10' : 'border-white/5'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isOverridden ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400'}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <h3 className="text-white font-bold text-lg">{cat.label}</h3>
                            {isOverridden && <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">مخصص</span>}
                        </div>
                        
                        {isOverridden && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleResetCategory(cat.id, cat.label)}
                                disabled={deleteMutation.isPending}
                                className="text-red-400 hover:text-red-300 hover:bg-red-950/20 h-8 self-end md:self-auto"
                            >
                                {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin"/> : <RotateCcw className="w-3 h-3 ml-2" />}
                                إعادة للعام (Reset)
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-xs text-gray-400 mb-1.5 block">نوع الربح الخاص</Label>
                            <Select 
                                value={data.profit_type}
                                onValueChange={(v) => updateCategory(cat.id, 'profit_type', v)}
                            >
                                <SelectTrigger className="h-9 bg-black/20 border-white/10 text-white text-right">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a2e] border-white/10" dir="rtl">
                                    <SelectItem value="fixed">مبلغ ثابت ($)</SelectItem>
                                    <SelectItem value="percent">نسبة مئوية (%)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div>
                            <Label className="text-xs text-gray-400 mb-1.5 block">قيمة الربح الخاصة</Label>
                            <Input
                                type="number"
                                className="h-9 bg-black/20 border-white/10 text-white text-right"
                                value={data.profit_value}
                                onChange={(e) => updateCategory(cat.id, 'profit_value', e.target.value)}
                                placeholder="اتركه فارغاً للعام"
                            />
                        </div>

                        <div>
                            <Label className="text-xs text-gray-400 mb-1.5 block">خصم الموزع الخاص %</Label>
                            <Input
                                type="number"
                                className="h-9 bg-black/20 border-white/10 text-white text-right"
                                value={data.reseller_discount_percent}
                                onChange={(e) => updateCategory(cat.id, 'reseller_discount_percent', e.target.value)}
                                placeholder="خصم خاص..."
                            />
                        </div>

                        <div>
                            <Label className="text-xs text-gray-400 mb-1.5 block">خصم التاجر الكبير الخاص %</Label>
                            <Input
                                type="number"
                                className="h-9 bg-black/20 border-white/10 text-white text-right"
                                value={data.big_seller_discount_percent}
                                onChange={(e) => updateCategory(cat.id, 'big_seller_discount_percent', e.target.value)}
                                placeholder="خصم خاص..."
                            />
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        <Button
                        onClick={() => handleSaveCategory(cat.id)}
                        size="sm"
                        disabled={upsertMutation.isPending}
                        className={isOverridden ? "bg-cyan-600 text-white hover:bg-cyan-700" : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10"}
                        >
                        {upsertMutation.isPending ? <Loader2 className="w-3 h-3 ml-2 animate-spin" /> : <Save className="w-3 h-3 ml-2" />}
                        {isOverridden ? "تحديث التخصيص" : "تفعيل التخصيص"}
                        </Button>
                    </div>
                </GlowCard>
            )})}
        </div>
      </div>
    </div>
  );
}
