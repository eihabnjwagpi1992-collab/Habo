import React from 'react';
import { AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function APIIntegrationGuide() {
  return (
    <div className="space-y-6 text-white">
      {/* How It Works */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          كيفية العمل
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge className="bg-cyan-500/20 text-cyan-400">1</Badge>
            </div>
            <div>
              <p className="font-medium">إضافة المزود</p>
              <p className="text-sm text-gray-400">أدخل رابط API ومفتاح الوصول للمزود</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge className="bg-cyan-500/20 text-cyan-400">2</Badge>
            </div>
            <div>
              <p className="font-medium">سحب الخدمات</p>
              <p className="text-sm text-gray-400">انقر على زر السحب أو انتظر السحب التلقائي</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge className="bg-cyan-500/20 text-cyan-400">3</Badge>
            </div>
            <div>
              <p className="font-medium">تطبيق هامش الربح</p>
              <p className="text-sm text-gray-400">يتم إضافة النسبة تلقائياً على جميع الأسعار</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <Badge className="bg-cyan-500/20 text-cyan-400">4</Badge>
            </div>
            <div>
              <p className="font-medium">إرسال الطلبات تلقائياً</p>
              <p className="text-sm text-gray-400">عند تفعيل Auto-Submit، يتم إرسال الطلبات تلقائياً</p>
            </div>
          </div>
        </div>
      </div>

      {/* Margin System */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          نظام هامش الربح
        </h3>
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-medium">النسبة المئوية:</span>
            <br />
            السعر النهائي = السعر الأساسي × (1 + النسبة ÷ 100)
            <br />
            <span className="text-gray-400">مثال: سعر 10$ + هامش 20% = 12$</span>
          </p>

          <div className="border-t border-white/10 pt-3">
            <p>
              <span className="font-medium">المبلغ الثابت:</span>
              <br />
              السعر النهائي = السعر الأساسي + المبلغ الثابت
              <br />
              <span className="text-gray-400">مثال: سعر 10$ + هامش 2$ = 12$</span>
            </p>
          </div>
        </div>
      </div>

      {/* Auto Submission */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          الإرسال التلقائي (Auto-Submit)
        </h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2">
            <span className="text-cyan-400">✓</span>
            عند تفعيل هذه الميزة، سيتم إرسال الطلبات للمزود تلقائياً
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400">✓</span>
            يتم التحقق من حالة الطلب لدى المزود دورياً
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400">✓</span>
            عند اكتمال الطلب يتم إشعار المستخدم تلقائياً
          </li>
          <li className="flex gap-2">
            <span className="text-cyan-400">✓</span>
            النتائج (مثل أكواد الفتح) تُرسل عبر الإشعارات والبريد
          </li>
        </ul>
      </div>

      {/* API Format Support */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-400" />
          صيغ API المدعومة
        </h3>
        <div className="space-y-2 text-sm">
          <p>
            <Badge className="bg-cyan-500/20 text-cyan-400">JSON</Badge>
            {' '}
            الصيغة الحديثة والموصى بها
          </p>
          <p>
            <Badge className="bg-purple-500/20 text-purple-400">XML</Badge>
            {' '}
            للمزودين القدماء
          </p>
        </div>
      </div>
    </div>
  );
}