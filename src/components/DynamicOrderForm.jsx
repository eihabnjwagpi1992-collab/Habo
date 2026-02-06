import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, User, Mail, Gamepad2, Smartphone, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DynamicOrderForm({
  service,
  onSubmit,
  isLoading,
  userBalance,
  effectivePrice
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const getSmartFields = (service) => {
    const name = service?.name?.toLowerCase() || "";
    let fields = [];

    if (name.includes("pubg") || name.includes("free fire") || name.includes("yalla") || name.includes("id") || name.includes("game") || name.includes("chat")) {
      fields.push({ 
        name: "player_id", 
        label: "معرف اللاعب أو المستخدم (ID)", 
        type: "text", 
        required: true, 
        placeholder: "مثال: 548921003",
        icon: <Gamepad2 className="w-4 h-4 text-cyan-400" />
      });
    } 
    else if (name.includes("tool") || name.includes("activation") || name.includes("license") || name.includes("pro") || name.includes("server")) {
      fields.push({ 
        name: "username", 
        label: "اسم المستخدم (Username)", 
        type: "text", 
        required: true, 
        placeholder: "أدخل اسم المستخدم المسجل في البرنامج",
        icon: <User className="w-4 h-4 text-cyan-400" />
      });
      fields.push({ 
        name: "email", 
        label: "البريد الإلكتروني (Email)", 
        type: "email", 
        required: true, 
        placeholder: "example@mail.com",
        icon: <Mail className="w-4 h-4 text-cyan-400" />
      });
    }
    else if (name.includes("imei") || name.includes("icloud") || name.includes("iphone") || name.includes("unlock")) {
      fields.push({ 
        name: "imei", 
        label: "رقم الـ IMEI للجهاز", 
        type: "text", 
        required: true, 
        placeholder: "أدخل 15 رقماً (يمكنك الحصول عليه بطلب *#06#)",
        icon: <Smartphone className="w-4 h-4 text-cyan-400" />
      });
    }

    if (service?.fields?.length > 0) {
      service.fields.forEach(f => {
        if (!fields.find(existing => existing.name === (f.name || f.field_key))) {
          fields.push({
            name: f.name || f.field_key,
            label: f.label || f.field_label,
            type: f.type || f.field_type || "text",
            required: f.required || f.is_required,
            placeholder: f.placeholder
          });
        }
      });
    }

    if (fields.length === 0) {
      fields.push({ 
        name: "notes", 
        label: "البيانات المطلوبة للتنفيذ", 
        type: "text", 
        required: true, 
        placeholder: "أدخل البيانات المطلوبة هنا..." 
      });
    }

    return fields;
  };

  const activeFields = getSmartFields(service);

  useEffect(() => {
    const initialData = {};
    activeFields.forEach(field => {
      initialData[field.name] = '';
    });
    setFormData(initialData);
    setErrors({});
  }, [service]);

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    activeFields.forEach(field => {
      const value = formData[field.name];
      if (field.required && (!value || value.trim() === '')) {
        newErrors[field.name] = `حقل ${field.label} مطلوب`;
        isValid = false;
      }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  const displayPrice = effectivePrice ?? service?.price ?? 0;
  const canAfford = userBalance >= displayPrice;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {activeFields.map((field) => (
        <div key={field.name} className="space-y-2 group">
          {/* العنوان فوق الخانة بشكل بارز */}
          <label className="text-sm font-bold text-gray-200 flex items-center gap-2 group-focus-within:text-cyan-400 transition-colors">
            <span className="p-1.5 bg-gray-800 rounded-md border border-gray-700 group-focus-within:border-cyan-500/50">
              {field.icon || <Info className="w-3.5 h-3.5 text-gray-400" />}
            </span>
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>

          {/* الخانة بتصميم مضيء وواضح */}
          <div className="relative">
            <Input
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              placeholder={field.placeholder}
              className={`bg-gray-900/50 border-2 h-14 text-white text-base px-4 rounded-xl focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-gray-600 ${
                errors[field.name] ? 'border-red-500/50 bg-red-500/5' : 'border-gray-800 focus:border-cyan-500'
              }`}
            />
          </div>

          {errors[field.name] && (
            <p className="text-red-400 text-xs font-medium flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3.5 h-3.5" /> {errors[field.name]}
            </p>
          )}
        </div>
      ))}

      <div className="pt-6 mt-6 border-t border-gray-800">
        <div className="flex justify-between items-center p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/10 mb-6">
          <span className="text-gray-400 font-medium">المبلغ المطلوب خصمه:</span>
          <div className="text-right">
            <span className="text-2xl font-black text-cyan-400 font-mono">${Number(displayPrice).toFixed(2)}</span>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Credits</p>
          </div>
        </div>
        
        {!canAfford && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-6 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>عذراً، رصيدك الحالي ({userBalance.toFixed(2)}$) غير كافٍ لإتمام هذا الطلب.</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !canAfford}
          className="w-full h-14 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg font-black rounded-2xl shadow-xl shadow-cyan-500/20 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" /> جاري معالجة طلبك...
            </span>
          ) : 'تأكيد وإرسال الطلب الآن'}
        </Button>
      </div>
    </form>
  );
}
