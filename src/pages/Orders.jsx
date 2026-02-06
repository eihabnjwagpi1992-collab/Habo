import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { Loader2, Package, ShoppingBag, RefreshCw, AlertTriangle, User } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from "date-fns"; // تأكد من وجود هذه المكتبة أو استخدم الطريقة العادية

export default function Orders() {
  // 1. جلب بيانات المستخدم (نحتاج الإيميل للمقارنة)
  const { data: user } = useQuery({ 
    queryKey: ['me'], 
    queryFn: () => base44.auth.me(),
    staleTime: 1000 * 60 * 5
  });

  // 2. جلب الطلبات بناءً على الإيميل (created_by) كما يفعل نظام الأدمن
  const { data: orders, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['my-orders-list', user?.email], 
    enabled: !!user?.email,
    queryFn: async () => {
      const response = await base44.entities.Order.list('-created_date'); // استخدام نفس ترتيب الأدمن
      
      // تصفية الطلبات لتظهر فقط طلبات المستخدم الحالي بناءً على الإيميل
      const allItems = response.items || response || [];
      return allItems.filter(order => order.created_by === user.email);
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return (
    <div className="flex justify-center h-screen items-center">
      <Loader2 className="animate-spin text-cyan-500 w-10 h-10"/>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 pb-24">
      <div className="max-w-3xl mx-auto">
        
        <div className="bg-gray-900 border border-gray-700 p-4 rounded mb-6 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="bg-cyan-500/20 p-2 rounded-full"><User className="w-5 h-5 text-cyan-400"/></div>
             <div>
               <p className="text-xs text-gray-400">الحساب الحالي</p>
               <p className="text-xs text-white font-mono">{user?.email || "جاري التحميل..."}</p>
             </div>
           </div>
           <Button 
             onClick={() => refetch()} 
             disabled={isFetching}
             size="sm" 
             variant="outline" 
             className="h-8 gap-2"
           >
             <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`}/> 
             تحديث
           </Button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-cyan-400" /> طلباتي
          </h1>
          <Badge variant="outline" className="text-white border-gray-600">{orders?.length || 0}</Badge>
        </div>

        <div className="space-y-4">
          {orders && orders.length > 0 ? (
            orders.map((order) => (
              <GlowCard key={order.id} className="p-4 border-l-4 border-cyan-500">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold">{order.service_name}</h3>
                    <span className="text-cyan-400 font-mono font-bold">${order.amount?.toFixed(2)}</span>
                </div>
                
                {order.result && (
                  <div className="mt-2 p-2 rounded bg-green-500/10 text-xs mb-2">
                    <span className="text-gray-400">النتيجة: </span>
                    <span className="text-green-400 font-mono">{order.result}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-800 pt-2 mt-2">
                    <span>
                      {order.created_date ? format(new Date(order.created_date), 'MMM d, yyyy') : '---'}
                    </span>
                    <Badge className="bg-gray-800 text-white">{order.status}</Badge>
                </div>
              </GlowCard>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-900/50 rounded-lg border border-gray-800">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-bold">لا توجد طلبات</h3>
              <p className="text-gray-500 text-sm mt-2">تأكد من أنك قمت بطلب خدمات مسبقاً.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
