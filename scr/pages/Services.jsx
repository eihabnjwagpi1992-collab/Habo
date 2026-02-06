import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { motion } from "framer-motion";
import { Search, Loader2, X, Folder, ChevronRight, ArrowRight, ArrowLeft, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { useLanguage } from "@/components/LanguageContext";
import { useTheme } from "@/components/ThemeContext";
import { usePriceCalculator } from '@/hooks/usePriceCalculator';

export default function Services() {
  const { t, language } = useLanguage();
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeGroup, setActiveGroup] = useState(null);

  const { calculatePrice } = usePriceCalculator();
  const SERVICES_PER_PAGE = 50;

  const normalize = (v) => {
    const s = (v ?? '').toString().toLowerCase().trim();
    return s
      .replace(/[إأآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ـ/g, '')
      .replace(/[ًٌٍَُِّْ]/g, '')
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
      .replace(/\s+/g, ' ').trim();
  };

  const tokenize = (q) => normalize(q).split(' ').filter(Boolean);

  const expandToken = (tok) => {
    const map = {
      'لايف': ['live', 'stream', 'broadcast'], 'بث': ['live', 'stream'], 'تيك': ['tiktok'],
      'frp': ['google lock', 'factory reset protection'], 'حمايه': ['security', 'lock'],
      'قفل': ['lock'], 'ايميل': ['email'], 'يوزر': ['user'], 'imei': ['imei'], 'سيريال': ['serial', 'sn'],
    };
    const key = tok.replace(/\s+/g, ' ').trim();
    const extra = map[key] || map[tok] || [];
    return [tok, ...extra.map(normalize)];
  };

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 180);
    return () => clearTimeout(id);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    setActiveGroup(null);
  }, [debouncedQuery, categoryFilter]);

  const shouldContainImage = (url = '') => {
    const u = (url || '').toString().toLowerCase();
    return u.endsWith('.png') || u.endsWith('.svg') || u.includes('logo') || u.includes('icon');
  };

  const FALLBACK_STATIC = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&h=450&q=80";

  const getServiceImage = (s) => {
    const apiImg = s?.image_url || s?.image || s?.logo_url;
    if (apiImg) return apiImg;
    const q = encodeURIComponent((s?.name || 'gsm service').slice(0, 60));
    const sig = encodeURIComponent(String(s?.id || q));
    return `https://source.unsplash.com/random/800x450/?technology,network&sig=${sig}&${q}`;
  };

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services-all'],
    queryFn: async () => base44.entities.Service.filter({ is_active: true }, 'sort_order', 5000),
    initialData: [],
  });

  const scoreItem = (item, tokensExpanded) => {
    const { name, hay } = item;
    let score = 0;
    for (const group of tokensExpanded) {
      if (!group.some(tok => hay.includes(tok))) return -1;
    }
    const raw = tokensExpanded.flat();
    for (const tok of raw) {
      if (!tok) continue;
      if (name === tok) score += 120;
      if (name.startsWith(tok)) score += 70;
      if (name.includes(tok)) score += 40;
      if (hay.includes(tok)) score += 15;
    }
    return score;
  };

  const filteredSortedServices = useMemo(() => {
    let baseList = services;
    if (categoryFilter && categoryFilter !== 'all') {
      baseList = services.filter(s => normalize(s.category) === normalize(categoryFilter));
    }
    const tokens = tokenize(debouncedQuery);
    if (tokens.length === 0) return baseList;

    const currentIndexed = baseList.map(s => {
      const name = normalize(s?.name);
      const desc = normalize(s?.description);
      const cat = normalize(s?.category);
      const hay = `${name} ${desc} ${cat}`.trim();
      return { s, name, hay };
    });

    const tokensExpanded = tokens.map(expandToken);
    const scored = currentIndexed.map(item => ({ s: item.s, sc: scoreItem(item, tokensExpanded) }))
                                 .filter(x => x.sc >= 0);
    scored.sort((a, b) => b.sc - a.sc);
    return scored.map(x => x.s);
  }, [services, categoryFilter, debouncedQuery]);

  // =================================================================================
  // =================== START: منطق التجميع الذكي المطور (2000+ خدمة) ===================
  // =================================================================================
  const { groups, directItems, allGroupKeys } = useMemo(() => {
    
    const priorityGroups = {
        'PUBG Mobile': ['pubg', 'pobg', 'ببجي', 'uc'],
        'Free Fire': ['free fire', 'فري فاير', 'diamonds'],
        'Netflix': ['netflix', 'نتفلكس'],
        'Shahid': ['shahid', 'شاهد'],
        'Disney+': ['disney', 'ديزني'],
        'Yalla Ludo': ['yalla ludo', 'يلا لودو'],
        '8 Ball Pool': ['8ball', 'بلياردو'],
        'Jawaker': ['jawaker', 'جواكر'],
        'Mobile Legends': ['mobile legends', 'mlbb'],
        'Razer Gold': ['razer', 'ريزر'],
        'Roblox': ['roblox'],
        'AI Services': ['chatgpt', 'gemini', 'openai', 'midjourney'],
    };

    const secondaryGroups = {
        'خدمات iCloud': ['icloud', 'ايكلاود', 'fmi', 'hello', 'bypass', 'ipad', 'iphone', 'ios', 'signal'],
        'خدمات FRP': ['frp', 'google lock', 'حماية جوجل', 'bypass frp', 'remove account'],
        'إصلاح IMEI والشبكة': ['imei', 'network', 'unlock', 'signal', 'meid', 'cpid', 'اصلاح ايمي', 'فك شبكة'],
        'تفعيل أدوات السوفت وير': ['activation', 'tool', 'box', 'dongle', 'pro', 'license', 'تفعيل', 'اداة', 'chimera', 'unlocktool', 'dft', 'eft'],
        'أرصدة وسيرفرات': ['credits', 'credit', 'server', 'رصيد', 'كريديت', 'سيرفر'],
    };

    const generalGroups = {
        'تطبيقات البث والدردشة': ['live', 'chat', 'coins', 'gold', 'بث', 'لايف', 'دردشه', 'tango', 'bigo', 'imo', 'yalla live', 'mixu', 'livu', 'tumile'],
        'بطاقات الهدايا والفيزا': ['itunes', 'google play', 'psn', 'xbox', 'visa', 'ايتونز', 'بلايستيشن', 'فيزا'],
        'خدمات Samsung': ['samsung', 'سامسونج'],
        'خدمات Xiaomi': ['xiaomi', 'redmi', 'poco', 'شاومي'],
        'خدمات Huawei': ['huawei', 'هواوي'],
        'الاتصالات والإنترنت': ['mtn', 'syriatel', 'bills', 'internet', 'فواتير', 'اتصالات'],
        'العملات الرقمية USDT': ['usdt', 'crypto', 'binance'],
    };

    const groups = {};
    const assignedServiceIds = new Set();

    const processGrouping = (serviceList, groupDefinitions) => {
        Object.keys(groupDefinitions).forEach(groupName => {
            const keywords = groupDefinitions[groupName].map(kw => normalize(kw));
            
            serviceList.forEach(s => {
                if (assignedServiceIds.has(s.id)) return;

                const serviceNameLower = normalize(s.name);
                const categoryLower = normalize(s.category);
                const subcatLower = normalize(s.subcategory);
                const combinedText = `${serviceNameLower} ${categoryLower} ${subcatLower}`;

                if (keywords.some(kw => combinedText.includes(kw))) {
                    if (!groups[groupName]) groups[groupName] = [];
                    const regex = new RegExp(keywords.join('|'), 'gi');
                    const displayName = s.name.replace(regex, '').replace(/[-:|]/g, '').trim();
                    groups[groupName].push({ ...s, displayName: displayName || s.name });
                    assignedServiceIds.add(s.id);
                }
            });
        });
    };

    processGrouping(filteredSortedServices, priorityGroups);
    processGrouping(filteredSortedServices, secondaryGroups);
    processGrouping(filteredSortedServices, generalGroups);

    const directItems = [];
    filteredSortedServices.forEach(s => {
        if (!assignedServiceIds.has(s.id)) {
            directItems.push({ ...s, displayName: s.name });
        }
    });

    return { 
      groups, 
      directItems, 
      allGroupKeys: Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length)
    };
  }, [filteredSortedServices]);

  const viewData = useMemo(() => {
    if (activeGroup) return groups[activeGroup] || [];
    const groupItems = allGroupKeys.map(key => ({
      id: `group-${key}`,
      isGroup: true,
      name: key,
      count: groups[key].length,
      imageSample: groups[key][0]
    }));
    return [...groupItems, ...directItems];
  }, [activeGroup, groups, directItems, allGroupKeys]);

  const paginatedView = useMemo(() => {
    return viewData.slice(0, currentPage * SERVICES_PER_PAGE);
  }, [viewData, currentPage]);

  const hasMore = viewData.length > paginatedView.length;

  if (isLoading && services.length === 0) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-cyan-500" /></div>;
  }

  const ServiceCard = ({ s }) => {
    const img = getServiceImage(s);
    const contain = shouldContainImage(img);
    const finalDisplayPrice = calculatePrice(s.price, s.category_id || s.category);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border overflow-hidden flex flex-col h-full transition-all hover:border-cyan-500/50"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <img
          src={img} alt={s.name} className={`w-full h-28 ${contain ? 'object-contain p-2' : 'object-cover'}`}
          loading="lazy" style={{ backgroundColor: "rgba(0,0,0,0.10)" }}
          onError={(e) => { e.currentTarget.src = FALLBACK_STATIC; }}
        />
        <div className="p-3 flex-1 flex flex-col">
          <div className="font-semibold line-clamp-2 text-sm md:text-base mb-2">{s.displayName || s.name}</div>
          <div className="mt-auto">
            <div className="font-bold text-lg mb-3" style={{ color: 'var(--primary)' }}>${Number(finalDisplayPrice).toFixed(2)}</div>
            <Link 
              to={`/service/${s.id}`} 
              className="w-full py-2 px-4 rounded-xl bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-cyan-600 transition-colors text-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              {t('order_now') || 'اطلب الآن'}
            </Link>
          </div>
        </div>
      </motion.div>
    );
  };

  const GroupCard = ({ g }) => {
    const img = getServiceImage(g.imageSample);
    return (
      <motion.div
        layout
        onClick={() => setActiveGroup(g.name)}
        className="cursor-pointer rounded-2xl border overflow-hidden flex flex-col h-full transition-all hover:border-cyan-500 group"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="relative h-28 overflow-hidden">
          <img src={img} alt={g.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" onError={(e) => { e.currentTarget.src = FALLBACK_STATIC; }} />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Folder className="w-8 h-8 text-white opacity-80" />
          </div>
        </div>
        <div className="p-3 flex-1 flex flex-col">
          <div className="font-bold text-sm md:text-base">{g.name}</div>
          <div className="text-xs opacity-60 mt-1">{g.count} {t('services')}</div>
          <div className="mt-auto pt-3 flex items-center text-cyan-500 text-xs font-bold">
            {t('view_all')} <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{activeGroup ? activeGroup : t('services')}</h1>
          <p className="opacity-60">{activeGroup ? `${groups[activeGroup].length} ${t('services_in_group')}` : `${services.length} ${t('total_services')}`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <Input placeholder={t('search_services')} className="pl-10 rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 opacity-40" /></button>}
          </div>
        </div>
      </div>

      {activeGroup && (
        <button onClick={() => setActiveGroup(null)} className="mb-6 flex items-center text-cyan-500 font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" /> {t('back_to_all_groups')}
        </button>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {paginatedView.map((item) => (
          item.isGroup ? <GroupCard key={item.id} g={item} /> : <ServiceCard key={item.id} s={item} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-12">
          <button onClick={() => setCurrentPage(prev => prev + 1)} className="px-8 py-3 rounded-2xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition-colors">
            {t('load_more')}
          </button>
        </div>
      )}
    </div>
  );
}
