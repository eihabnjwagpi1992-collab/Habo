import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdminBreadcrumb({ activeTab }) {
  if (!activeTab) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        to={createPageUrl('AdminPanel')}
        className="flex items-center gap-1 transition-colors"
        style={{ color: 'var(--primary)' }}
      >
        <Home className="w-4 h-4" />
        <span>لوحة التحكم</span>
      </Link>

      <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />

      <span style={{ color: 'var(--text-secondary)' }}>
        {activeTab.label}
      </span>
    </div>
  );
}