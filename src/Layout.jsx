import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from '@/api/base44Client';
import {
Menu,
X,
Home,
Server,
LayoutDashboard,
Wallet,
ClipboardList,
LogOut,
User,
ChevronDown,
Languages,
FileText,
Sun,
Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuSeparator,
DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationDropdown from "@/components/NotificationDropdown";
import NotificationCenter from "@/components/NotificationCenter";
import AnnouncementTicker from "@/components/AnnouncementTicker";
import WhatsAppButton from "@/components/WhatsAppButton";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { ThemeProvider, useTheme } from "@/components/ThemeContext";

function LayoutContent({ children, currentPageName }) {
const { t, toggleLanguage, language } = useLanguage();
const { theme, toggleTheme } = useTheme();
const [isScrolled, setIsScrolled] = useState(false);
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
const [user, setUser] = useState(null);
const [isAuthenticated, setIsAuthenticated] = useState(false);

useEffect(() => {
const handleScroll = () => {
setIsScrolled(window.scrollY > 20);
};
window.addEventListener('scroll', handleScroll);
return () => window.removeEventListener('scroll', handleScroll);
}, []);

useEffect(() => {
const checkAuth = async () => {
try {
const authenticated = await base44.auth.isAuthenticated();
setIsAuthenticated(authenticated);
if (authenticated) {
const userData = await base44.auth.me();
setUser(userData);
}
} catch (e) {
console.error(e);
}
};
checkAuth();
}, []);

const navItems = [
{ nameKey: "home", page: "Home", icon: Home },
{ nameKey: "services", page: "Services", icon: Server },
{ nameKey: "dashboard", page: "Dashboard", icon: LayoutDashboard, auth: true },
{ nameKey: "orders", page: "Orders", icon: ClipboardList, auth: true },
{ nameKey: "supportFiles", page: "SupportFiles", icon: FileText, auth: true },
{ nameKey: "support", page: "SupportTickets", icon: Server, auth: true },
{ nameKey: "addFunds", page: "AddFunds", icon: Wallet, auth: true },
];

const adminNavItems = [
{ nameKey: "adminPanel", page: "AdminPanel" },
];

const filteredNavItems = navItems.filter(item => !item.auth || isAuthenticated);

return (
<div
className="min-h-screen transition-colors duration-300"
dir={language === 'ar' ? 'rtl' : 'ltr'}
style={{
fontFamily: language === 'ar' ? "'Readex Pro', sans-serif" : "'Plus Jakarta Sans', sans-serif",
backgroundColor: 'var(--bg-color)',
color: 'var(--text-color)'
}}
>
{/* PWA Meta Tags */}
<meta name="application-name" content="Tsmart GSM Pro" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Tsmart GSM Pro" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="theme-color" content="#00d4ff" />
<link rel="manifest" href="data:application/json;base64,eyJuYW1lIjoiVHNtYXJ0IEdTTSBQcm8iLCJzaG9ydF9uYW1lIjoiVHNtYXJ0IiwiZGVzY3JpcHRpb24iOiJQcm9mZXNzaW9uYWwgR1NNICYgRGlnaXRhbCBTZXJ2Iiwic3RhcnRfdXJsIjoiLyIsImRpc3BsYXkiOiJzdGFuZGFsb25lIiwiYmFja2dyb3VuZF9jb2xvciI6IiMwYTBhMGYiLCJ0aGVtZV9jb2xvciI6IiMwMGQ0ZmYiLCJpY29ucyI6W3sic3JjIjoiZGF0YTppbWFnZS9zdmcreG1sLCUzQ3N2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMDAgMTAwJyUzRSUzQ3JlY3Qgd2lkdGg9JzEwMCcgaGVpZ2h0PScxMDAnIGZpbGw9JyUyMzAwZDRmZicvJTNFJTNDdGV4dCB4PScxMCcgeT0nNzAnIGZvbnQtc2l6ZT0nNjAnIGZpbGw9JyUyM2ZmZicgZm9udC13ZWlnaHQ9J2JvbGQnJTNFVCUzQy90ZXh0JTNFJTNDL3N2ZyUzRSIsInNpemVzIjoiMTkyeDE5MiIsInR5cGUiOiJpbWFnZS9zdmcreG1sIn0seyJzcmMiOiJkYXRhOmltYWdlL3N2Zyt4bWwsJTNDc3ZnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zycgdmlld0JveD0nMCAwIDEwMCAxMDAnJTNFJTNDcmVjdCB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgZmlsbD0nJTIzMDBkNGZmJy8lM0UlM0N0ZXh0IHg9JzEwJyB5PSc3MCcgZm9udC1zaXplPSc2MCcgZmlsbD0nJTIzZmZmJyBmb250LXdlaWdodD0nYm9sZCclM0VUJTNDL3RleHQlM0UlM0Mvc3ZnJTNFIiwic2l6ZXMiOiI1MTJ4NTEyIiwidHlwZSI6ImltYWdlL3N2Zyt4bWwifV19" />

<style>{`  
    @import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@200;300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');  
      
    :root {  
      --bg-color: #ffffff;  
      --bg-secondary: #f4f7fa;  
      --text-color: #000000;  
      --text-secondary: #1a1a1a;  
      --text-muted: #666666;  
      --card-bg: #ffffff;  
      --card-hover: #f0f4f8;  
      --border-color: #e5e7eb;  
      --header-bg: rgba(255, 255, 255, 0.9);  
      --input-bg: #ffffff;  
      --input-border: #d1d5db;  
      --hover-bg: #f3f4f6;  
      --shadow: rgba(0, 0, 0, 0.05);  
      --shadow-lg: rgba(0, 0, 0, 0.1);  
      --primary: #0070f3;  
      --primary-hover: #0051ad;  
      --accent: #00d4ff;  
      --success: #10b981;  
      --warning: #f59e0b;  
      --error: #ff0000;  
      --gradient-from: #0070f3;  
      --gradient-to: #00d4ff;  
    }  
      
    [data-theme="dark"] {  
      --bg-color: #000000;  
      --bg-secondary: #0a0a0a;  
      --text-color: #ffffff;  
      --text-secondary: #e5e5e5;  
      --text-muted: #888888;  
      --card-bg: #050505;  
      --card-hover: #0f0f0f;  
      --border-color: #1f1f1f;  
      --header-bg: rgba(0, 0, 0, 0.85);  
      --input-bg: #0a0a0a;  
      --input-border: #262626;  
      --hover-bg: #171717;  
      --shadow: rgba(0, 0, 0, 0.5);  
      --shadow-lg: rgba(0, 0, 0, 0.8);  
      --primary: #00d4ff;  
      --primary-hover: #33e0ff;  
      --accent: #0070f3;  
      --success: #10b981;  
      --warning: #f59e0b;  
      --error: #ff4d4d;  
      --gradient-from: #00d4ff;  
      --gradient-to: #0070f3;  
    }  

    @keyframes liquid-flow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .liquid-blue-text {
      background: linear-gradient(270deg, #00d4ff, #0070f3, #00d4ff);
      background-size: 200% 200%;
      animation: liquid-flow 4s ease infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    * {  
      box-sizing: border-box;  
      margin: 0;  
      padding: 0;  
    }  
      
    html, body {  
      overflow-x: hidden;  
      max-width: 100vw;  
      font-family: ${language === 'ar' ? "'Readex Pro', sans-serif" : "'Plus Jakarta Sans', sans-serif"};  
      direction: ${language === 'ar' ? 'rtl' : 'ltr'};  
      background-color: var(--bg-color);  
      color: var(--text-color);  
    }  
      
    * {  
      direction: inherit;  
      transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;  
    }  

    /* Remove transitions from interactive elements for speed */  
    input, button, select, textarea, [role="button"] {  
      transition: none !important;  
    }  
      
    /* Force Dark Mode Styles - Override Defaults */  
    input, select, textarea {  
      background-color: var(--input-bg) !important;  
      color: var(--text-color) !important;  
      border-color: var(--input-border) !important;  
      transition: none !important;  
    }  

    input::placeholder, textarea::placeholder {  
      color: var(--text-muted) !important;  
    }  

    /* Light Mode Colors - Better Contrast */  
    [data-theme="light"] input,  
    [data-theme="light"] select,  
    [data-theme="light"] textarea {  
      background-color: #f8fafc !important;  
      color: #0f172a !important;  
      border-color: #cbd5e1 !important;  
    }  

    [data-theme="light"] input::placeholder,  
    [data-theme="light"] textarea::placeholder {  
      color: #94a3b8 !important;  
    }  
      
    /* Dropdown Menu Fix */  
    [role="menu"], [data-radix-menu-content] {  
      background-color: var(--card-bg) !important;  
      border: 1px solid var(--border-color) !important;  
      color: var(--text-color) !important;  
    }  
      
    [role="menuitem"], [data-radix-menu-item] {  
      color: var(--text-color) !important;  
    }  
      
    [role="menuitem"]:hover, [data-radix-menu-item]:hover {  
      background-color: var(--hover-bg) !important;  
    }  
      
    /* Button Icons Visibility */  
    button svg {  
      color: inherit !important;  
    }  
      
    /* Card Backgrounds */  
    .card, [role="dialog"] {  
      background-color: var(--card-bg) !important;  
      border-color: var(--border-color) !important;  
      color: var(--text-color) !important;  
    }  
      
    /* Select Dropdown Content */  
    [data-radix-select-content] {  
      background-color: var(--card-bg) !important;  
      border: 1px solid var(--border-color) !important;  
    }  
      
    [data-radix-select-item] {  
      color: var(--text-color) !important;  
    }  
      
    [data-radix-select-item]:hover {  
      background-color: var(--hover-bg) !important;  
    }  
      
    /* Admin Panel Modern Styling */  
    .admin-panel-container {  
      font-family: inherit !important;  
    }  
      
    .admin-panel-container input,  
    .admin-panel-container select,  
    .admin-panel-container textarea,  
    .admin-panel-container button {  
      border-radius: 8px !important;  
      padding: 10px 15px !important;  
      border: 1px solid var(--input-border) !important;  
      font-family: inherit !important;  
      height: auto !important;  
      min-height: 40px !important;  
    }  
      
    .admin-panel-container table {  
      border-collapse: collapse !important;  
      width: 100%;  
      table-layout: fixed;  
    }  

    .admin-panel-container table tr {  
      background-color: var(--card-bg) !important;  
      border: 1px solid var(--border-color) !important;  
      height: 60px;  
    }  

    .admin-panel-container table tr:hover {  
      background-color: var(--hover-bg) !important;  
    }  

    .admin-panel-container table td,  
    .admin-panel-container table th {  
      padding: 14px 16px !important;  
      border: 1px solid var(--border-color) !important;  
      text-align: right;  
      overflow: hidden;  
      text-overflow: ellipsis;  
      white-space: nowrap;  
    }  

    .admin-panel-container table thead tr {  
      background-color: var(--bg-secondary) !important;  
      border-bottom: 2px solid var(--border-color) !important;  
    }  
  `}</style>  

  {/* Header */}  
  <header   
    className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${  
      isScrolled   
        ? 'backdrop-blur-xl border-b'   
        : 'bg-transparent'  
    }`}  
    style={{  
      backgroundColor: isScrolled ? 'var(--header-bg)' : 'transparent',  
      borderColor: isScrolled ? 'var(--border-color)' : 'transparent'  
    }}  
  >  
    <div className="container mx-auto px-4">  
            <div className="flex items-center justify-between h-20">  
              {/* Logo */}  
              <Link to={createPageUrl("Home")} className="flex items-center gap-3">  
                <div   
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.4)]"  
                  style={{ color: 'white' }}  
                >  
                  <span className="text-xl font-bold">T</span>  
                </div>  
                <span   
                  className="text-2xl font-black hidden sm:block tracking-tighter"  
                  style={{ color: 'var(--text-color)' }}  
                >  
                  Tsmart<span className="liquid-blue-text px-1">GSM</span><span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1 align-top uppercase tracking-[0.2em] font-black border border-primary/30 shadow-[0_0_15px_rgba(0,112,243,0.3)]">Pro</span>  
                </span>  
              </Link>  

        {/* Desktop Navigation */}  
        <nav className="hidden lg:flex items-center gap-1">  
          {filteredNavItems.map((item) => (  
            <Link  
              key={item.page}  
              to={createPageUrl(item.page)}  
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${  
                currentPageName === item.page  
                  ? 'text-cyan-400'  
                  : 'hover:text-current'  
              }`}  
              style={{  
                backgroundColor: currentPageName === item.page ? 'var(--hover-bg)' : 'transparent',  
                color: currentPageName === item.page ? 'var(--primary)' : 'var(--text-secondary)'  
              }}  
            >  
              <item.icon className="w-4 h-4" />  
              {t(item.nameKey)}  
            </Link>  
          ))}  
        </nav>  

        {/* User Actions */}  
        <div className="flex items-center gap-3">  
          {/* Theme Toggle */}  
          <Button  
            variant="ghost"  
            size="icon"  
            onClick={toggleTheme}  
            className="transition-all"  
            style={{ color: 'var(--text-secondary)' }}  
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}  
          >  
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}  
          </Button>  

          {/* Language Toggle */}  
          <Button  
            variant="ghost"  
            size="icon"  
            onClick={toggleLanguage}  
            className="transition-all"  
            style={{ color: 'var(--text-secondary)' }}  
            title={language === 'ar' ? 'English' : 'العربية'}  
          >  
            <Languages className="w-5 h-5" />  
          </Button>  

          {isAuthenticated && user ? (  
            <div className="flex items-center gap-3">  
              <div   
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border"  
                style={{   
                  backgroundColor: 'var(--card-bg)',   
                  borderColor: 'var(--border-color)'   
                }}  
              >  
                <Wallet className="w-4 h-4" style={{ color: 'var(--primary)' }} />  
                <span className="font-semibold" style={{ color: 'var(--text-color)' }}>${(user.balance || 0).toFixed(2)}</span>  
              </div>  

              <NotificationCenter user={user} />  
              <NotificationDropdown user={user} />  

              <DropdownMenu>  
                <DropdownMenuTrigger asChild>  
                  <Button variant="ghost" className="flex items-center gap-2" style={{ color: 'var(--text-color)' }}>  
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">  
                      <span className="text-sm font-semibold text-white">  
                        {user.full_name?.[0] || user.email?.[0] || 'U'}  
                      </span>  
                    </div>  
                    <span className="hidden md:block">{user.full_name || 'User'}</span>  
                    <ChevronDown className="w-4 h-4" />  
                  </Button>  
                </DropdownMenuTrigger>  
                <DropdownMenuContent   
                  align="end"   
                  className="w-56 border"  
                  style={{   
                    backgroundColor: 'var(--card-bg)',   
                    borderColor: 'var(--border-color)'   
                  }}  
                >  
                  <div   
                    className="px-3 py-2 border-b"   
                    style={{ borderColor: 'var(--border-color)' }}  
                  >  
                    <p className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{user.full_name}</p>  
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>  
                  </div>  
                  <DropdownMenuItem asChild>  
                    <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 cursor-pointer">  
                      <LayoutDashboard className="w-4 h-4" />  
                      {t('dashboard')}  
                    </Link>  
                  </DropdownMenuItem>  
                  <DropdownMenuItem asChild>  
                    <Link to={createPageUrl("Orders")} className="flex items-center gap-2 cursor-pointer">  
                      <ClipboardList className="w-4 h-4" />  
                      {t('myOrders')}  
                    </Link>  
                  </DropdownMenuItem>  
                  <DropdownMenuItem asChild>  
                    <Link to={createPageUrl("AddFunds")} className="flex items-center gap-2 cursor-pointer">  
                      <Wallet className="w-4 h-4" />  
                      {t('addFunds')}  
                    </Link>  
                  </DropdownMenuItem>  
                  {user?.role === 'admin' && (  
                    <>  
                      <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-color)' }} />  
                      {adminNavItems.map((item) => (  
                        <DropdownMenuItem key={item.page} asChild>  
                          <Link to={createPageUrl(item.page)} className="flex items-center gap-2 cursor-pointer">  
                            <Server className="w-4 h-4" />  
                            {t(item.nameKey)}  
                          </Link>  
                        </DropdownMenuItem>  
                      ))}  
                    </>  
                  )}  
                  <DropdownMenuSeparator style={{ backgroundColor: 'var(--border-color)' }} />  
                  <DropdownMenuItem   
                    className="flex items-center gap-2 cursor-pointer"  
                    style={{ color: 'var(--error)' }}  
                    onClick={() => base44.auth.logout()}  
                  >  
                    <LogOut className="w-4 h-4" />  
                    {t('logout')}  
                  </DropdownMenuItem>  
                </DropdownMenuContent>  
              </DropdownMenu>  
            </div>  
          ) : (  
            <Button   
              onClick={() => base44.auth.redirectToLogin()}  
              className="text-white font-semibold shadow-[0_0_20px_rgba(0,112,243,0.3)]"  
              style={{   
                background: `linear-gradient(to right, var(--gradient-from), var(--gradient-to))`   
              }}  
            >  
              {t('signIn')}  
            </Button>  
          )}  

          {/* Mobile Menu Button */}  
          <Button  
            variant="ghost"  
            size="icon"  
            className="lg:hidden text-white"  
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}  
          >  
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}  
          </Button>  
        </div>  
      </div>  
    </div>  

    {/* Mobile Menu */}  
            {isMobileMenuOpen && (  
              <div   
                className="lg:hidden backdrop-blur-xl border-t"  
                style={{   
                  backgroundColor: 'var(--header-bg)',   
                  borderColor: 'var(--border-color)'   
                }}  
              >  
                <div className="container mx-auto px-4 py-4">  
                  <nav className="flex flex-col gap-2">  
                    {filteredNavItems.map((item) => (  
                      <Link  
                        key={item.page}  
                        to={createPageUrl(item.page)}  
                        onClick={() => setIsMobileMenuOpen(false)}  
                        className={`px-4 py-3 rounded-lg transition-all flex items-center gap-3 ${  
                          currentPageName === item.page  
                            ? 'bg-cyan-500/20 text-cyan-400'  
                            : 'text-gray-400 hover:text-white hover:bg-white/5'  
                        }`}  
                      >  
                        <item.icon className="w-5 h-5" />  
                        {t(item.nameKey)}  
                      </Link>  
                    ))}  
                  </nav>  
                </div>  
              </div>  
            )}  
          </header>  

          {/* Announcement Ticker with spacing */}  
          <div className="mt-20">
            <AnnouncementTicker />  
          </div>

  {/* Main Content */}  
  <main className="pt-6">  
    {children}  
  </main>  

  {/* WhatsApp Button */}  
  <WhatsAppButton />  

  {/* Footer */}  
  <footer className="border-t py-12 mt-20" style={{ borderColor: 'var(--border-color)' }}>  
    <div className="container mx-auto px-4">  
      <div className="grid md:grid-cols-4 gap-8 mb-8">  
        <div>  
          <Link to={createPageUrl("Home")} className="flex items-center gap-3 mb-4">  
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.3)]">  
              <span className="text-xl font-bold text-white">T</span>  
            </div>  
            <span className="text-2xl font-black tracking-tighter">  
              Tsmart<span className="liquid-blue-text px-1">GSM</span><span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1 align-top uppercase tracking-[0.2em] font-black border border-primary/30 shadow-[0_0_15px_rgba(0,112,243,0.3)]">Pro</span>  
            </span>  
          </Link>  
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>  
            Professional GSM and digital mobile services platform trusted by technicians and resellers worldwide.  
          </p>  
        </div>  
          
        <div>  
          <h4 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('services')}</h4>  
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>  
            <li><Link to={createPageUrl("Services") + "?category=device_unlock"} className="hover:text-cyan-400 transition-colors">{t('device_unlock')}</Link></li>  
            <li><Link to={createPageUrl("Services") + "?category=game_topup"} className="hover:text-cyan-400 transition-colors">{t('gameTopUp')}</Link></li>  
            <li><Link to={createPageUrl("Services") + "?category=live_apps"} className="hover:text-cyan-400 transition-colors">{t('live_apps')}</Link></li>  
            <li><Link to={createPageUrl("Services") + "?category=tool_activation"} className="hover:text-cyan-400 transition-colors">{t('tool_activation')}</Link></li>  
          </ul>  
        </div>  

        <div>  
          <h4 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('account')}</h4>  
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>  
            <li><Link to={createPageUrl("Dashboard")} className="hover:text-cyan-400 transition-colors">{t('dashboard')}</Link></li>  
            <li><Link to={createPageUrl("Orders")} className="hover:text-cyan-400 transition-colors">{t('myOrders')}</Link></li>  
            <li><Link to={createPageUrl("AddFunds")} className="hover:text-cyan-400 transition-colors">{t('addFunds')}</Link></li>  
          </ul>  
        </div>  

        <div>  
          <h4 className="font-semibold mb-4" style={{ color: 'var(--text-color)' }}>{t('support')}</h4>  
          <ul className="space-y-2 text-sm" style={{ color: 'var(--text-muted)' }}>  
            <li><Link to={createPageUrl("ContactUs")} className="hover:text-cyan-400 transition-colors">{t('contactUs')}</Link></li>  
            <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('faq')}</a></li>  
            <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('termsOfService')}</a></li>  
            <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('privacyPolicy')}</a></li>  
          </ul>  
        </div>  
      </div>  

      <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--border-color)' }}>  
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>  
          © {new Date().getFullYear()} Tsmart GSM Pro. {t('allRightsReserved')}  
        </p>  
        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-muted)' }}>  
          <span className="flex items-center gap-2">  
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />  
            {t('allSystemsOperational')}  
          </span>  
        </div>  
      </div>  
      </div>  
      </footer>  
      </div>  
      );  
      }  

      export default function Layout(props) {  
        return (  
          <ThemeProvider>  
            <LanguageProvider>  
              <LayoutContent {...props} />  
            </LanguageProvider>  
          </ThemeProvider>  
        );  
      }
