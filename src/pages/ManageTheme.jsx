import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import GlowCard from '@/components/ui/GlowCard';
import { Palette, Type, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageTheme() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    primary_color: '#00d4ff',
    secondary_color: '#3b82f6',
    background_color: '#0a0a0f',
    card_background: '#1a1a2e',
    text_color: '#ffffff',
    font_family: 'Cairo',
    border_radius: 'medium',
    is_active: true
  });

  const { data: themeSettings, isLoading } = useQuery({
    queryKey: ['themeSettings'],
    queryFn: async () => {
      const data = await base44.entities.ThemeSettings.list();
      if (data && data.length > 0) {
        setSettings(data[0]);
        return data[0];
      }
      return null;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (themeSettings) {
        return await base44.entities.ThemeSettings.update(themeSettings.id, data);
      } else {
        return await base44.entities.ThemeSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themeSettings'] });
      toast.success('تم حفظ إعدادات الثيم بنجاح');
      window.location.reload();
    }
  });

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const radiusMap = {
    none: '0px',
    small: '4px',
    medium: '12px',
    large: '24px'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Palette className="w-6 h-6 text-cyan-400" />
          إعدادات الثيم والتصميم
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Colors */}
        <GlowCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-cyan-400" />
            الألوان
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">اللون الأساسي</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                  className="flex-1 bg-[#1a1a2e] border-white/10"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">اللون الثانوي</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                  className="flex-1 bg-[#1a1a2e] border-white/10"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">لون الخلفية</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={settings.background_color}
                  onChange={(e) => setSettings({...settings, background_color: e.target.value})}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.background_color}
                  onChange={(e) => setSettings({...settings, background_color: e.target.value})}
                  className="flex-1 bg-[#1a1a2e] border-white/10"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">لون البطاقات</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={settings.card_background}
                  onChange={(e) => setSettings({...settings, card_background: e.target.value})}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.card_background}
                  onChange={(e) => setSettings({...settings, card_background: e.target.value})}
                  className="flex-1 bg-[#1a1a2e] border-white/10"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-300">لون النص</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={settings.text_color}
                  onChange={(e) => setSettings({...settings, text_color: e.target.value})}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.text_color}
                  onChange={(e) => setSettings({...settings, text_color: e.target.value})}
                  className="flex-1 bg-[#1a1a2e] border-white/10"
                />
              </div>
            </div>
          </div>
        </GlowCard>

        {/* Typography */}
        <GlowCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-cyan-400" />
            الخطوط والأشكال
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">الخط</Label>
              <Select value={settings.font_family} onValueChange={(val) => setSettings({...settings, font_family: val})}>
                <SelectTrigger className="bg-[#1a1a2e] border-white/10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="Cairo">Cairo (كايرو)</SelectItem>
                  <SelectItem value="Tajawal">Tajawal (تجوال)</SelectItem>
                  <SelectItem value="Amiri">Amiri (أميري)</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-300">استدارة الحواف</Label>
              <Select value={settings.border_radius} onValueChange={(val) => setSettings({...settings, border_radius: val})}>
                <SelectTrigger className="bg-[#1a1a2e] border-white/10 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="none">بدون استدارة</SelectItem>
                  <SelectItem value="small">صغيرة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="large">كبيرة</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="mt-6">
              <Label className="text-gray-300 mb-2 block">معاينة</Label>
              <div 
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: settings.card_background,
                  borderRadius: radiusMap[settings.border_radius],
                  fontFamily: settings.font_family
                }}
              >
                <h4 style={{ color: settings.primary_color }} className="font-bold mb-2">عنوان تجريبي</h4>
                <p style={{ color: settings.text_color }} className="text-sm">هذا نص تجريبي لمعاينة الخط والألوان</p>
                <button
                  className="mt-3 px-4 py-2 rounded"
                  style={{
                    backgroundColor: settings.primary_color,
                    color: settings.background_color,
                    borderRadius: radiusMap[settings.border_radius]
                  }}
                >
                  زر تجريبي
                </button>
              </div>
            </div>
          </div>
        </GlowCard>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </Button>
      </div>
    </div>
  );
}