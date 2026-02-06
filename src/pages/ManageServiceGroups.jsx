import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, CheckCircle2, AlertCircle, Save, FolderPlus, ListChecks } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ManageServiceGroups() {
    const queryClient = useQueryClient();
    const [selectedCategoryName, setSelectedCategoryName] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // 1. جلب الخدمات جميعاً لنستخرج منها الفئات الـ 10 الموجودة فعلياً
    const { data: allServices = [], isLoading: loadingAll } = useQuery({
        queryKey: ['all-services-for-groups'],
        queryFn: async () => {
            const res = await base44.entities.Service.list(5000);
            return res || [];
        }
    });

    // استخراج الفئات الفريدة من الخدمات (سامسونج، شاومي، ألعاب...)
    const uniqueCategories = useMemo(() => {
        const cats = allServices.map(s => s.category).filter(Boolean);
        return [...new Set(cats)];
    }, [allServices]);

    // 2. فلترة الخدمات حسب الفئة المختارة من القائمة
    const filteredByCategory = useMemo(() => {
        if (!selectedCategoryName) return [];
        return allServices.filter(s => s.category === selectedCategoryName);
    }, [allServices, selectedCategoryName]);

    // فلترة البحث داخل الفئة
    const finalFilteredServices = useMemo(() => {
        return filteredByCategory.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [filteredByCategory, searchTerm]);

    // 3. Mutation للتحديث الجماعي
    const bulkUpdateMutation = useMutation({
        mutationFn: async () => {
            const updates = selectedServiceIds.map(id => {
                const service = allServices.find(s => s.id === id);
                const cleanName = service.name.includes(' - ') ? service.name.split(' - ')[1] : service.name;
                const newName = `${groupName} - ${cleanName}`;
                return base44.entities.Service.update(id, { name: newName });
            });
            return Promise.all(updates);
        },
        onSuccess: () => {
            toast.success(`تم تحديث ${selectedServiceIds.length} خدمة بنجاح`);
            setSelectedServiceIds([]);
            queryClient.invalidateQueries(['all-services-for-groups']);
        },
        onError: () => toast.error("حدث خطأ أثناء التحديث")
    });

    const toggleService = (id) => {
        setSelectedServiceIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="p-6 space-y-6 text-right" dir="rtl">
            <div className="bg-cyan-500/5 border border-cyan-500/20 p-4 rounded-2xl flex items-center gap-4">
                <FolderPlus className="text-cyan-400 w-10 h-10" />
                <div>
                    <h2 className="text-xl font-bold text-white">إدارة المجموعات (الفرز الصارم)</h2>
                    <p className="text-gray-400 text-sm">اختر إحدى الفئات الـ 10، ثم حدد الخدمات لإضافتها لمجموعة (مثل PUBG).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border p-5 rounded-2xl space-y-4 h-fit sticky top-4">
                    <label className="block text-sm font-bold text-gray-300">1. اختر الفئة (من الـ 10 الموجودة):</label>
                    <select 
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none"
                        value={selectedCategoryName}
                        onChange={(e) => {
                            setSelectedCategoryName(e.target.value);
                            setSelectedServiceIds([]);
                        }}
                    >
                        <option value="">-- اختر الفئة --</option>
                        {uniqueCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    <label className="block text-sm font-bold text-gray-300">2. اسم المجموعة:</label>
                    <Input 
                        placeholder="مثلاً: PUBG Mobile"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="bg-black/40 border-white/10"
                    />

                    <Button 
                        onClick={() => bulkUpdateMutation.mutate()}
                        disabled={!groupName || selectedServiceIds.length === 0 || bulkUpdateMutation.isPending}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12 rounded-xl mt-4"
                    >
                        تحديث ({selectedServiceIds.length}) خدمة
                    </Button>
                </div>

                <div className="md:col-span-2 bg-card border rounded-2xl overflow-hidden h-[600px] flex flex-col">
                    <div className="p-4 border-b border-white/5 bg-white/5 flex gap-3">
                        <Input 
                            placeholder="ابحث عن خدمة محددة داخل الفئة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/20"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {loadingAll ? (
                            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-cyan-500" /></div>
                        ) : !selectedCategoryName ? (
                            <p className="text-center py-20 text-gray-500 italic">الرجاء اختيار فئة لعرض خدماتها</p>
                        ) : (
                            finalFilteredServices.map(service => (
                                <div 
                                    key={service.id}
                                    onClick={() => toggleService(service.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                        selectedServiceIds.includes(service.id) 
                                        ? 'bg-cyan-500/20 border-cyan-500/50' 
                                        : 'bg-white/5 border-transparent hover:border-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border ${selectedServiceIds.includes(service.id) ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}`}>
                                            {selectedServiceIds.includes(service.id) && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="text-sm text-white">{service.name}</span>
                                    </div>
                                    <span className="text-xs font-mono text-cyan-400">${service.price}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
