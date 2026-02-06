import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Wallet, 
  ClipboardList, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import GlowCard from "@/components/ui/GlowCard";
import { format, startOfDay, isAfter } from "date-fns";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error(e);
      }
    };
    loadUser();
  }, []);

  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders', user?.email],
    queryFn: () => base44.entities.Order.filter({ created_by: user?.email }, '-created_date', 5),
    enabled: !!user?.email,
    initialData: [],
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['recent-transactions', user?.email],
    queryFn: () => base44.entities.Transaction.filter({ created_by: user?.email }, '-created_date', 5),
    enabled: !!user?.email,
    initialData: [],
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  // Calculate today's stats
  const today = startOfDay(new Date());
  const todaySuccessful = recentOrders.filter(o => 
    o.status === 'completed' && isAfter(new Date(o.created_date), today)
  ).length;
  const todayPending = recentOrders.filter(o => 
    o.status === 'pending' && isAfter(new Date(o.created_date), today)
  ).length;

  const stats = [
    {
      label: "الرصيد الحالي",
      value: `$${(user?.balance || 0).toFixed(2)}`,
      icon: Wallet,
      color: "cyan",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      label: "طلبات ناجحة اليوم",
      value: todaySuccessful,
      icon: CheckCircle2,
      color: "green",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      label: "طلبات قيد الانتظار",
      value: todayPending,
      icon: Clock,
      color: "yellow",
      gradient: "from-yellow-500 to-orange-500"
    }
  ];

  // Filter transactions by search query
  const filteredTransactions = recentTransactions.filter(tx => {
    const query = searchQuery.toLowerCase();
    const imei = tx.imei?.toLowerCase() || '';
    const deviceType = tx.device_type?.toLowerCase() || '';
    const description = tx.description?.toLowerCase() || '';
    
    return imei.includes(query) || deviceType.includes(query) || description.includes(query);
  });

  const statusConfig = {
    pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Pending" },
    processing: { icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-500/20", label: "Processing" },
    completed: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/20", label: "Completed" },
    failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/20", label: "Failed" },
    refunded: { icon: RefreshCw, color: "text-gray-400", bg: "bg-gray-500/20", label: "Refunded" }
  };

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}>
      <div className="container mx-auto px-4">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>
            Welcome back, <span style={{ color: 'var(--primary)' }}>{user?.full_name || 'User'}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Here's your account overview</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlowCard glowColor={stat.color} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--text-color)' }}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-4 mb-12"
        >
          <Link to={createPageUrl("Services")}>
            <Button 
              className="text-white"
              style={{ background: 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))' }}
            >
              <Plus className="mr-2 w-4 h-4" />
              New Order
            </Button>
          </Link>
          <Link to={createPageUrl("AddFunds")}>
            <Button 
              variant="outline" 
              className="border"
              style={{
                borderColor: 'var(--primary)',
                color: 'var(--primary)'
              }}
            >
              <Wallet className="mr-2 w-4 h-4" />
              Add Funds
            </Button>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
             <GlowCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>Recent Orders</h2>
                <Link to={createPageUrl("Orders")}>
                  <Button variant="ghost" size="sm" style={{ color: 'var(--primary)' }}>
                    View All
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>No orders yet</p>
                  <Link to={createPageUrl("Services")}>
                    <Button variant="link" className="mt-2" style={{ color: 'var(--primary)' }}>
                      Browse Services
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentOrders.map((order) => {
                    const config = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 rounded-lg transition-colors"
                        style={{
                          backgroundColor: 'var(--hover-bg)'
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate" style={{ color: 'var(--text-color)' }}>
                            {order.service_name}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {format(new Date(order.created_date), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold" style={{ color: 'var(--text-color)' }}>
                            ${order.amount?.toFixed(2)}
                          </span>
                          <Badge className={`${config.bg} ${config.color} border-0`}>
                            <config.icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlowCard>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
           >
             <GlowCard className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>العمليات</h2>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p style={{ color: 'var(--text-muted)' }}>لا توجد عمليات حالياً</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <Input
                      placeholder="ابحث برقم IMEI أو نوع الجهاز..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border"
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        borderColor: 'var(--input-border)',
                        color: 'var(--text-color)'
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    {filteredTransactions.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>لم يتم العثور على نتائج</p>
                      </div>
                    ) : (
                      filteredTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 rounded-lg"
                          style={{ backgroundColor: 'var(--hover-bg)' }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize" style={{ color: 'var(--text-color)' }}>
                              {tx.type}
                            </p>
                            <p className="text-sm truncate" style={{ color: 'var(--text-muted)' }}>
                              {tx.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold" style={{ color: tx.amount >= 0 ? 'var(--success)' : 'var(--error)' }}>
                              {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {format(new Date(tx.created_date), 'MMM d')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </GlowCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}