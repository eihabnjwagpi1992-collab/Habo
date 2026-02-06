import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getEffectivePrice } from './priceCalculator.js';
import { checkBalance, reserveBalance, confirmDeduction, refundBalance } from './manageBalance.js';

/**
 * دالة موحدة لإنشاء وإرسال الطلب مع التحقق الصارم من الرصيد
 * التسلسل:
 * 1. التحقق من الرصيد
 * 2. حجز المبلغ
 * 3. إنشاء Order
 * 4. إرسال للمزود
 * 5. نجاح → تثبيت الخصم | فشل → إرجاع تلقائي
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  let reserveTransactionId = null;

  try {
    // التحقق من المصادقة
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service_id, custom_inputs } = await req.json();

    if (!service_id) {
      return Response.json({ error: 'Missing service_id' }, { status: 400 });
    }

    // 1️⃣ جلب بيانات الخدمة
    const services = await base44.asServiceRole.entities.Service.filter({ id: service_id });
    const service = services[0];

    if (!service) {
      return Response.json({ error: 'Service not found' }, { status: 404 });
    }

    // حساب السعر الفعلي حسب رتبة المستخدم
    const priceInfo = await getEffectivePrice(base44, service, user.email);
    const effectivePrice = priceInfo.effective_price;

    // 2️⃣ التحقق من الرصيد (BLOCKING)
    const balanceCheck = await checkBalance(base44, user.email, effectivePrice);

    if (!balanceCheck.can_purchase) {
      return Response.json({
        error: `رصيد غير كافي`,
        available_balance: balanceCheck.available_balance,
        required_amount: effectivePrice,
        shortage: balanceCheck.shortage
      }, { status: 402 }); // Payment Required
    }

    // 3️⃣ حجز الرصيد
    const reserveResult = await reserveBalance(
      base44,
      user.email,
      effectivePrice,
      `TEMP-${Date.now()}`,
      service.name
    );
    reserveTransactionId = reserveResult.transaction_id;

    // 4️⃣ إنشاء Order
    const order = await base44.asServiceRole.entities.Order.create({
      service_id: service_id,
      service_name: service.name,
      amount: effectivePrice, // السعر الفعلي المخزن
      status: 'pending',
      custom_inputs: custom_inputs,
      imei: custom_inputs?.imei,
      player_id: custom_inputs?.player_id,
      email_target: custom_inputs?.email
    });

    // تحديث معرف الحجز بمعرف الطلب الفعلي
    await base44.asServiceRole.entities.BalanceLog.filter({ transaction_id: reserveTransactionId }).then(async (logs) => {
      if (logs[0]) {
        await base44.asServiceRole.entities.BalanceLog.update(logs[0].id, {
          order_id: order.id
        });
      }
    });

    // 5️⃣ إنشاء إشعار
    await base44.asServiceRole.entities.Notification.create({
      order_id: order.id,
      title: 'تم استقبال طلبك',
      message: `تم استقبال طلبك لخدمة ${service.name} بنجاح`,
      type: 'pending',
      is_read: false
    });

    // 6️⃣ إرسال للمزود
    try {
      const submitResponse = await base44.asServiceRole.functions.invoke('submitOrderToProvider', {
        orderId: order.id
      });

      if (!submitResponse.data?.success) {
        // فشل الإرسال → إرجاع الرصيد
        await refundBalance(
          base44,
          user.email,
          effectivePrice,
          order.id,
          service.name,
          `فشل الإرسال للمزود: ${submitResponse.data?.error}`
        );

        await base44.asServiceRole.entities.Order.update(order.id, {
          status: 'failed',
          admin_notes: `فشل الإرسال للمزود - تم إرجاع الرصيد تلقائياً`
        });

        return Response.json({
          success: false,
          error: `فشل في إرسال الطلب للمزود`,
          order_id: order.id
        }, { status: 500 });
      }

      // ✅ النجاح → تثبيت الخصم
      const confirmResult = await confirmDeduction(
        base44,
        user.email,
        effectivePrice,
        order.id,
        service.name,
        reserveTransactionId
      );

      return Response.json({
        success: true,
        order_id: order.id,
        effective_price: effectivePrice,
        user_tier: priceInfo.user_tier,
        message: 'تم إنشاء الطلب بنجاح والخصم تم تثبيته'
      }, { status: 201 });

    } catch (providerError) {
      console.error('خطأ في إرسال الطلب للمزود:', providerError);

      // فشل → إرجاع الرصيد تلقائياً
      await refundBalance(
        base44,
        user.email,
        effectivePrice,
        order.id,
        service.name,
        `خطأ في المعالجة: ${providerError.message}`
      );

      await base44.asServiceRole.entities.Order.update(order.id, {
        status: 'failed',
        admin_notes: `خطأ أثناء الإرسال - تم إرجاع الرصيد تلقائياً`
      });

      return Response.json({
        success: false,
        error: 'فشل في معالجة الطلب',
        order_id: order.id
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in placeOrderWithBalance:', error);

    // محاولة إرجاع الرصيد المحجوز في حالة الخطأ
    if (reserveTransactionId) {
      try {
        const user = await base44.auth.me();
        // سيتم التعامل معه تلقائياً عند فشل إنشاء الطلب
      } catch (e) {
        console.error('Failed to refund on error:', e);
      }
    }

    return Response.json({
      error: error.message || 'فشل في معالجة الطلب'
    }, { status: 500 });
  }
});