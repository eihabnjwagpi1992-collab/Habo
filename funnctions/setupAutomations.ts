/**
 * دليل إعداد Automations
 * 
 * يجب إنشاء الـ Automations التالية في لوحة التحكم:
 */

export const AUTOMATION_SETUP_GUIDE = {
  automations: [
    {
      name: "Auto Submit Order to Provider",
      trigger: "Order - Created",
      action: "Run Backend Function",
      function: "submitOrderToProvider",
      description: "عند إنشاء طلب جديد، إرساله للمزود تلقائياً إذا كان الإرسال التلقائي مفعلاً",
      steps: [
        "1. اذهب إلى Dashboard → Automations",
        "2. انقر على 'New Automation'",
        "3. اختر 'Data event' → 'Order' → 'Created'",
        "4. اختر function: submitOrderToProvider",
        "5. حدد condition: provider.auto_submit_enabled = true",
        "6. انقر Save"
      ]
    },
    {
      name: "Check External Order Status",
      trigger: "ExternalOrder - Updated",
      description: "كل ساعة، تحقق من حالة الطلبات الخارجية",
      function: "checkProviderOrderStatus",
      steps: [
        "1. اذهب إلى Dashboard → Automations",
        "2. انقر على 'New Automation'",
        "3. اختر 'Data event' → 'ExternalOrder' → 'Updated'",
        "4. اختر function: checkProviderOrderStatus",
        "5. اضبط التكرار: كل 1 ساعة",
        "6. انقر Save"
      ]
    },
    {
      name: "Sync Services Periodically",
      trigger: "Scheduled",
      description: "سحب الخدمات من المزودين بشكل دوري",
      function: "syncServicesFromProvider",
      steps: [
        "1. اذهب إلى Dashboard → Automations",
        "2. انقر على 'New Automation'",
        "3. اختر 'Scheduled'",
        "4. اختر interval: حسب sync_interval_hours (افتراضياً 24 ساعة)",
        "5. اختر function: syncServicesFromProvider",
        "6. Pass all active providers",
        "7. انقر Save"
      ]
    }
  ],

  manualTesting: {
    testSubmitOrder: {
      description: "لاختبار إرسال الطلب للمزود يدوياً",
      steps: [
        "1. اذهب إلى منصة التطوير",
        "2. اختر 'Backends' → 'Functions'",
        "3. اختر 'submitOrderToProvider'",
        "4. أدخل معرّف الطلب",
        "5. انقر Run"
      ]
    },
    testSyncServices: {
      description: "لاختبار سحب الخدمات يدوياً",
      steps: [
        "1. من لوحة إدارة API Integration",
        "2. اضغط زر السحب (🔄) بجانب المزود",
        "3. سيتم سحب الخدمات وتحديثها تلقائياً"
      ]
    }
  }
};

export default AUTOMATION_SETUP_GUIDE;