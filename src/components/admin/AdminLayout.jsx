import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminSidebar from '@/components/AdminSidebar';
import AdminBreadcrumb from '@/components/AdminBreadcrumb';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLayout({ children, activeTab, onTabChange, tabs, user, isLoading }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Close mobile menu on larger screens
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div 
          className="max-w-md w-full border rounded-lg p-6 flex gap-3"
          style={{ 
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)'
          }}
        >
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--error)' }}>Access Denied</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>You don't have permission to access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-color)' }}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AdminSidebar
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={isSidebarOpen}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div 
          className="h-16 border-b flex items-center justify-between px-4 sticky top-0 z-30"
          style={{ 
            backgroundColor: 'var(--header-bg)',
            borderColor: 'var(--border-color)'
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Breadcrumb */}
          <div className="flex-1 px-4">
            <AdminBreadcrumb activeTab={activeTabData} />
          </div>

          <div style={{ color: 'var(--text-muted)' }} className="text-sm">
            {user.full_name || user.email}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 md:p-8"
          >
            {/* Page Header */}
            {activeTabData && (
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>
                  {activeTabData.label}
                </h1>
                {activeTabData.description && (
                  <p style={{ color: 'var(--text-muted)' }}>
                    {activeTabData.description}
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            <div className="admin-content-container">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}