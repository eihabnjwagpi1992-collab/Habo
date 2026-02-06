import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Group sections by category
const SIDEBAR_GROUPS = [
  {
    name: 'المحتوى',
    icon: '📦',
    items: ['services', 'classifier', 'import-services', 'quality-enforcer']
  },
  {
    name: 'الطلبات والمبيعات',
    icon: '💳',
    items: ['orders', 'deposits', 'payment-methods']
  },
  {
    name: 'المستخدمون',
    icon: '👥',
    items: ['users', 'tiers', 'tier-pricing']
  },
  {
    name: 'التكاملات',
    icon: '🔗',
    items: ['api-integration', 'api-providers', 'api-logs']
  },
  {
    name: 'الإعدادات',
    icon: '⚙️',
    items: ['contact-channels', 'pricing-settings', 'announcements', 'support-files', 'sync-services']
  }
];

export default function AdminSidebar({ tabs, activeTab, onTabChange, isOpen, isMobileOpen, onMobileClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(
    SIDEBAR_GROUPS.map(g => g.name)
  );

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const filteredTabs = tabs.filter(tab =>
    tab.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabClick = (tabId) => {
    onTabChange(tabId);
    onMobileClose();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ duration: 0.2 }}
        className="hidden lg:flex w-64 bg-card border-r flex-col"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40
        }}
      >
        <SidebarContent
          tabs={tabs}
          filteredTabs={filteredTabs}
          activeTab={activeTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          onTabClick={handleTabClick}
        />
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 w-64 h-screen bg-card border-r lg:hidden z-50 flex flex-col"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-color)'
            }}
          >
            <SidebarContent
              tabs={tabs}
              filteredTabs={filteredTabs}
              activeTab={activeTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
              onTabClick={handleTabClick}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  tabs,
  filteredTabs,
  activeTab,
  searchQuery,
  setSearchQuery,
  expandedGroups,
  toggleGroup,
  onTabClick
}) {
  return (
    <>
      {/* Logo/Title */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div 
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold"
          >
            A
          </div>
          <span className="font-bold" style={{ color: 'var(--text-color)' }}>Admin</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 text-sm"
          />
        </div>
      </div>

      {/* Sidebar Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {searchQuery ? (
          // Search Results
          <div className="space-y-1">
            {filteredTabs.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                لا توجد نتائج
              </p>
            ) : (
              filteredTabs.map(tab => (
                <SidebarItem
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => onTabClick(tab.id)}
                />
              ))
            )}
          </div>
        ) : (
          // Grouped Items
          SIDEBAR_GROUPS.map(group => {
            const groupTabs = tabs.filter(t => group.items.includes(t.id));
            if (groupTabs.length === 0) return null;

            const isExpanded = expandedGroups.includes(group.name);

            return (
              <div key={group.name}>
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors mb-1"
                  style={{
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--hover-bg)'
                  }}
                >
                  <span className="flex items-center gap-2">
                    {group.icon}
                    {group.name}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 transition-transform"
                    style={{
                      transform: isExpanded ? 'rotate(0)' : 'rotate(-90deg)'
                    }}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 pl-2"
                    >
                      {groupTabs.map(tab => (
                        <SidebarItem
                          key={tab.id}
                          tab={tab}
                          isActive={activeTab === tab.id}
                          onClick={() => onTabClick(tab.id)}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

function SidebarItem({ tab, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
      style={{
        backgroundColor: isActive ? 'var(--primary)' : 'transparent',
        color: isActive ? 'white' : 'var(--text-secondary)'
      }}
    >
      {tab.label}
    </button>
  );
}