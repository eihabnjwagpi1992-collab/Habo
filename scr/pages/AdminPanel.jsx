import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '@/components/AdminLayout';

// Icons
import { 
  LayoutGrid, Users, Settings, ShoppingCart, 
  Server, ShieldCheck, DollarSign, Megaphone, 
  FileText, Activity, Layers, Globe, CreditCard, 
  MessageCircle, RefreshCw, UploadCloud, FileCode,
  FolderPlus
} from 'lucide-react';

// Admin Tab Components
import ManageServices from '@/pages/ManageServices';
import ManageOrders from '@/pages/ManageOrders';
import ManageUsers from '@/pages/ManageUsers';
import ManageUserTiers from '@/pages/ManageUserTiers';
import ManageTierPricing from '@/pages/ManageTierPricing';
import ManageAPIIntegration from '@/pages/ManageAPIIntegration';
import ManageDeposits from '@/pages/ManageDeposits';
import ManagePaymentMethods from '@/pages/ManagePaymentMethods';
import ManageContactChannels from '@/pages/ManageContactChannels';
import ManageAPIProviders from '@/pages/ManageAPIProviders';
import ManagePricingSettings from '@/pages/ManagePricingSettings';
import ManageAnnouncements from '@/pages/ManageAnnouncements';
import ManageSupportFiles from '@/pages/ManageSupportFiles';
import ServicesSyncDashboard from '@/pages/ServicesSyncDashboard';
import ManageAPILogs from '@/pages/ManageAPILogs';
import ImportServices from '@/pages/ImportServices';
import ServiceQualityEnforcer from '@/components/ServiceQualityEnforcer';
import ManageServiceClassifier from '@/pages/ManageServiceClassifier';
import ManageServiceGroups from '@/pages/ManageServiceGroups'; // القسم الجديد للفرز الذكي

// تنظيم القوائم
const MENU_GROUPS = [
  {
    title: "العمليات الأساسية",
    items: [
      { id: 'orders', label: 'الطلبات', icon: ShoppingCart, component: ManageOrders },
      { id: 'services', label: 'الخدمات', icon: LayoutGrid, component: ManageServices },
      { id: 'pricing-settings', label: 'التسعير', icon: DollarSign, component: ManagePricingSettings },
    ]
  },
  {
    title: "أدوات الخدمات",
    items: [
      { id: 'service-groups', label: 'مجموعات الخدمات', icon: FolderPlus, component: ManageServiceGroups }, // إضافة الميزة هنا
      { id: 'classifier', label: 'تصنيف', icon: Layers, component: ManageServiceClassifier },
      { id: 'quality-enforcer', label: 'الجودة', icon: ShieldCheck, component: ServiceQualityEnforcer },
      { id: 'sync-services', label: 'مزامنة', icon: RefreshCw, component: ServicesSyncDashboard },
      { id: 'import-services', label: 'استيراد', icon: UploadCloud, component: ImportServices },
    ]
  },
  {
    title: "المستخدمين والمالية",
    items: [
      { id: 'users', label: 'المستخدمين', icon: Users, component: ManageUsers },
      { id: 'deposits', label: 'الإيداعات', icon: CreditCard, component: ManageDeposits },
      { id: 'payment-methods', label: 'الدفع', icon: CreditCard, component: ManagePaymentMethods },
      { id: 'tiers', label: 'المستويات', icon: Activity, component: ManageUserTiers },
      { id: 'tier-pricing', label: 'أسعار التير', icon: DollarSign, component: ManageTierPricing },
    ]
  },
  {
    title: "النظام والربط (API)",
    items: [
      { id: 'api-integration', label: 'إعدادات API', icon: Server, component: ManageAPIIntegration },
      { id: 'api-providers', label: 'المزودين', icon: Globe, component: ManageAPIProviders },
      { id: 'api-logs', label: 'السجلات', icon: FileCode, component: ManageAPILogs },
    ]
  },
  {
    title: "المحتوى والدعم",
    items: [
      { id: 'announcements', label: 'الإعلانات', icon: Megaphone, component: ManageAnnouncements },
      { id: 'support-files', label: 'السبورت', icon: FileText, component: ManageSupportFiles },
      { id: 'contact-channels', label: 'التواصل', icon: MessageCircle, component: ManageContactChannels },
    ]
  }
];

const ALL_TABS = MENU_GROUPS.flatMap(g => g.items);

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        const userData = await base44.auth.me();
        if (userData.role !== 'admin') {
          window.location.href = '/';
          return;
        }
        setUser(userData);
      } catch (error) {
        console.error('Auth error:', error);
        base44.auth.redirectToLogin(window.location.href);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const activeTabData = ALL_TABS.find(t => t.id === activeTab);
  const Component = activeTabData?.component;

  return (
    <AdminLayout
      user={user}
      isLoading={isLoading}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={ALL_TABS} 
    >
      <div className="min-h-screen bg-background text-foreground py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
                  لوحة القيادة
                </span>
                <span className="text-[10px] md:text-xs bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20 font-mono">
                  ADMIN v2.0
                </span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                أهلاً بك، {user?.username || 'Admin'} - مركز التحكم الكامل بالمنصة
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
              <span className="text-sm text-muted-foreground">القسم الحالي:</span>
              <span className="text-sm font-bold text-cyan-400">{activeTabData?.label}</span>
            </div>
          </div>

          {/* Navigation Groups */}
          <div className="space-y-6">
            {MENU_GROUPS.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider px-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></span>
                  {group.title}
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {group.items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          relative group flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-300
                          ${isActive 
                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)] scale-[1.02]' 
                            : 'bg-card/40 border-white/5 text-muted-foreground hover:bg-card/80 hover:border-white/10 hover:text-foreground'
                          }
                        `}
                      >
                        <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-xs font-medium truncate w-full text-center">{tab.label}</span>
                        
                        {isActive && (
                          <div className="absolute top-0 right-0 w-2 h-2">
                            <div className="absolute top-0 right-0 w-full h-full bg-cyan-500 rounded-bl-full opacity-50"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="mt-8 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-3xl -z-10 blur-xl opacity-50" />
            <div className="bg-card/60 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden min-h-[600px]">
              <div className="p-1 md:p-2">
                {Component ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Component />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <Activity className="w-12 h-12 mb-4 opacity-20" />
                    <p>اختر قسماً من القائمة للبدء</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
