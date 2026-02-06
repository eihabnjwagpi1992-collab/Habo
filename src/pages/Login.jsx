import React, { useState } from 'react';
import { base44 } from '../api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // محاولة تسجيل الدخول
      const { error } = await base44.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      // نجاح الدخول -> توجيه للوحة التحكم
      navigate('/dashboard'); 
    } catch (err) {
      console.error(err);
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* خلفية تفاعلية مثل الصفحة الرئيسية */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* اللوجو الاحترافي في الأعلى */}
        <div className="flex justify-center mb-8">
           <div className="flex items-center gap-1">
              <span className="text-white font-black text-3xl tracking-tighter">Tsmart</span>
              <span className="text-cyan-500 font-black text-3xl tracking-tighter">GSM</span>
              <div className="relative ml-1">
                <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full"></div>
                <span className="relative bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full border border-white/20 tracking-widest shadow-lg">
                  PRO
                </span>
              </div>
            </div>
        </div>

        {/* كرت تسجيل الدخول الزجاجي */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/50">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">مرحباً بعودتك 👋</h2>
            <p className="text-gray-400 text-sm">أدخل بيانات حسابك للمتابعة</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* حقل الإيميل */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 mr-1">البريد الإلكتروني</label>
              <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-right dir-rtl"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            {/* حقل الباسورد */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300 mr-1">كلمة المرور</label>
                <Link to="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all text-right dir-rtl"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {/* زر الدخول */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  تسجيل الدخول
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* إنشاء حساب جديد */}
          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <p className="text-gray-400 text-sm">
              ليس لديك حساب؟{' '}
              <Link to="/signup" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
                أنشئ حساباً مجاناً
              </Link>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}

