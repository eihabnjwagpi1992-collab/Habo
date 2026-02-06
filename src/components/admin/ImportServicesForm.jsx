import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Upload, File } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from "@/components/ui/GlowCard";

export default function ImportServicesForm({ onImportComplete }) {
  const [csvText, setCsvText] = useState('');
  const [providerId, setProviderId] = useState('');
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [autoCategory, setAutoCategory] = useState(true);

  const detectInputType = (serviceName, category) => {
    const name = serviceName.toLowerCase();
    
    // خدمات الألعاب وتطبيقات اللايف (تحتاج Player ID)
    if (category === 'game_topup' || category === 'live_streaming') {
      return 'GAME_TOPUP';
    }
    
    // خدمات Apple و iCloud (تحتاج Serial Number)
    if (category === 'apple_icloud' || name.includes('serial') || name.includes('sn')) {
      return 'SERIAL_SERVICE';
    }
    
    // خدمات فك التشفير و IMEI
    if (category === 'samsung' || category === 'frp_security' || name.includes('imei') || name.includes('unlock')) {
      return 'IMEI_SERVICE';
    }
    
    // تفعيل الأدوات والكريديت
    if (category === 'tools_activation' || category === 'tools_credits' || name.includes('activation') || name.includes('credit')) {
      return 'SERVER_TOOL';
    }
    
    // الخدمات عن بعد
    if (category === 'remote_services' || name.includes('remote') || name.includes('anydesk')) {
      return 'REMOTE_SERVICE';
    }
    
    return 'SIMPLE';
  };

  const detectCategory = (serviceName) => {
    const name = serviceName.toLowerCase();
    
    // 1. Apple / iCloud (أولوية عالية)
    if (name.includes('icloud') || name.includes('apple') || name.includes('iphone')) {
      return 'apple_icloud';
    }

    // 2. Samsung
    if (name.includes('samsung') || name.includes('kg lock')) {
      return 'samsung';
    }

    // 3. Xiaomi
    if (name.includes('xiaomi') || name.includes('mi account')) {
      return 'xiaomi';
    }

    // 4. FRP & Security
    if (name.includes('frp') || name.includes('google lock') || name.includes('bypass')) {
      return 'frp_security';
    }

    // 5. Tools Activation (تفعيل الأدوات)
    if (name.includes('activation') || name.includes('license') || name.includes('unlocktool') || 
        name.includes('chimera') || name.includes('dft') || name.includes('z3x')) {
      return 'tools_activation';
    }

    // 6. Tools Credits (كريديت)
    if (name.includes('credit') || name.includes('token')) {
      return 'tools_credits';
    }

    // 7. Live Streaming Apps (تطبيقات اللايف)
    if (name.includes('tiktok') || name.includes('bigo') || name.includes('live') || 
        name.includes('tango') || name.includes('likee')) {
      return 'live_streaming';
    }

    // 8. Game Top-Up (شحن الألعاب)
    if (name.includes('game') || name.includes('pubg') || name.includes('free fire') || 
        name.includes('uc') || name.includes('diamond') || name.includes('roblox')) {
      return 'game_topup';
    }

    // 9. Remote Services (خدمات عن بعد)
    if (name.includes('remote') || name.includes('anydesk') || name.includes('teamviewer')) {
      return 'remote_services';
    }

    // 10. Social Media (سوشيال ميديا)
    if (name.includes('instagram') || name.includes('facebook') || name.includes('youtube') || 
        name.includes('followers') || name.includes('likes')) {
      return 'social_media';
    }
    
    // الافتراضي لخدمات الـ GSM غير المعروفة
    return 'frp_security';
  };

  React.useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await base44.entities.APIProvider.list();
        setProviders(data || []);
      } catch (e) {
        console.error('Failed to fetch providers:', e);
      }
    };
    fetchProviders();
  }, []);

  const parseTableData = (text) => {
    const lines = text.trim().split('\n').filter(line => line.trim());
    const services = [];

    for (const line of lines) {
      if (line.includes('معرف الخدمة') || line.includes('Service') || line.includes('---') || 
          (line.toLowerCase().includes('id') && line.toLowerCase().includes('name'))) continue;

      let id, name, price;

      const pipeMatches = line.match(/\|\s*([^\|]+?)\s*\|\s*([^\|]+?)\s*\|\s*([^\|]+?)\s*\|/);
      if (pipeMatches && pipeMatches.length >= 4) {
        id = pipeMatches[1].trim();
        name = pipeMatches[2].trim();
        price = parseFloat(pipeMatches[3].trim());
      } 
      else if (line.includes(',')) {
        const csvMatches = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (csvMatches.length >= 3) {
          id = csvMatches[0].replace(/^"|"$/g, '').trim();
          name = csvMatches[1].replace(/^"|"$/g, '').trim();
          price = parseFloat(csvMatches[2].replace(/^"|"$/g, '').trim());
        }
      }
      else if (line.includes('\t')) {
        const tabMatches = line.split('\t');
        if (tabMatches.length >= 3) {
          id = tabMatches[0].trim();
          name = tabMatches[1].trim();
          price = parseFloat(tabMatches[2].trim());
        }
      }

      if (id && name && !isNaN(price)) {
        services.push({
          external_service_id: id,
          name: name,
          base_cost: price
        });
      }
    }
    return services;
  };

  const handleImport = async () => {
    setError('');
    setResult(null);

    if (!csvText.trim()) {
      setError('الرجاء إدراج البيانات');
      return;
    }

    if (!providerId) {
      setError('الرجاء اختيار مزود الخدمة');
      return;
    }

    try {
      setIsLoading(true);
      const services = parseTableData(csvText);

      if (services.length === 0) {
        setError('لم يتمكن من استخراج خدمات من البيانات المدرجة');
        return;
      }

       const servicesWithProvider = services.map(s => {
         const category = detectCategory(s.name);
         return {
           ...s,
           provider_id: providerId,
           category: category,
           input_type: detectInputType(s.name, category),
           price: s.base_cost,
           is_active: true,
           sync_source: 'manual'
         };
       });

      await base44.entities.Service.bulkCreate(servicesWithProvider);

      setResult({
        success: true,
        count: services.length,
        message: `تم استيراد ${services.length} خدمة بنجاح`
      });

      setCsvText('');
      if (onImportComplete) onImportComplete();
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء الاستيراد');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlowCard className="p-6" glowColor="cyan">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-cyan-400" />
          استيراد الخدمات المطور
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">مزود الخدمة</label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                <SelectValue placeholder="اختر مزود الخدمة" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-white/10">
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2 flex items-center gap-2">
              <File className="w-4 h-4" />
              رفع ملف CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setCsvText(event.target?.result || '');
                  };
                  reader.readAsText(file);
                }
              }}
              className="w-full px-4 py-2 bg-[#1a1a2e] border border-white/10 rounded-lg text-white text-sm cursor-pointer"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2">
              أو انسخ البيانات مباشرة
            </label>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder="| ID | Service Name | Price |"
              className="bg-[#1a1a2e] border-white/10 text-white h-48 font-mono text-sm"
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {result?.success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{result.message}</span>
            </motion.div>
          )}

          <Button
            onClick={handleImport}
            disabled={isLoading || !csvText.trim() || !providerId}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'جاري الاستيراد...' : `استيراد الخدمات`}
          </Button>
        </div>
      </GlowCard>
    </div>
  );
}
