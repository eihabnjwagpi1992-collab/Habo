import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * نظام إدارة الرصيد المتقدم
 * - التحقق من الرصيد
 * - حجز الرصيد
 * - تثبيت الخصم
 * - إرجاع الرصيد
 * - تسجيل العمليات
 */

export async function checkBalance(base44, userEmail, amount) {
  const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
  const user = users[0];

  if (!user) {
    throw new Error('المستخدم غير موجود');
  }

  const availableBalance = (user.balance || 0) - (user.reserved_balance || 0);

  return {
    total_balance: user.balance || 0,
    reserved_balance: user.reserved_balance || 0,
    available_balance: availableBalance,
    can_purchase: availableBalance >= amount,
    shortage: availableBalance < amount ? amount - availableBalance : 0
  };
}

export async function reserveBalance(base44, userEmail, amount, orderId, serviceName) {
  const transactionId = `RES-${orderId}-${Date.now()}`;

  try {
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    const user = users[0];

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    const availableBalance = (user.balance || 0) - (user.reserved_balance || 0);

    if (availableBalance < amount) {
      throw new Error(`رصيد غير كافي. الرصيد المتاح: ${availableBalance}, المطلوب: ${amount}`);
    }

    // تحديث الرصيد المحجوز
    const newReservedBalance = (user.reserved_balance || 0) + amount;

    await base44.asServiceRole.entities.User.update(user.id, {
      reserved_balance: newReservedBalance
    });

    // تسجيل العملية
    await base44.asServiceRole.entities.BalanceLog.create({
      user_email: userEmail,
      transaction_type: 'reserve',
      amount: amount,
      previous_balance: user.balance || 0,
      new_balance: user.balance || 0,
      order_id: orderId,
      service_name: serviceName,
      status: 'completed',
      transaction_id: transactionId,
      notes: `تم حجز الرصيد للطلب ${orderId}`
    });

    return {
      success: true,
      transaction_id: transactionId,
      reserved_amount: amount,
      new_reserved_total: newReservedBalance
    };
  } catch (error) {
    // تسجيل فشل العملية
    await base44.asServiceRole.entities.BalanceLog.create({
      user_email: userEmail,
      transaction_type: 'reserve',
      amount: amount,
      order_id: orderId,
      service_name: serviceName,
      status: 'failed',
      transaction_id: transactionId,
      notes: `فشل حجز الرصيد: ${error.message}`
    });

    throw error;
  }
}

export async function confirmDeduction(base44, userEmail, amount, orderId, serviceName, transactionId) {
  try {
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    const user = users[0];

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    const previousBalance = user.balance || 0;
    const newBalance = previousBalance - amount;
    const newReservedBalance = Math.max((user.reserved_balance || 0) - amount, 0);

    // تحديث الرصيد والرصيد المحجوز
    await base44.asServiceRole.entities.User.update(user.id, {
      balance: newBalance,
      reserved_balance: newReservedBalance
    });

    // تسجيل تثبيت الخصم
    await base44.asServiceRole.entities.BalanceLog.create({
      user_email: userEmail,
      transaction_type: 'confirm',
      amount: amount,
      previous_balance: previousBalance,
      new_balance: newBalance,
      order_id: orderId,
      service_name: serviceName,
      status: 'completed',
      transaction_id: transactionId,
      notes: `تم تثبيت خصم الرصيد للطلب ${orderId}`
    });

    return {
      success: true,
      transaction_id: transactionId,
      deducted_amount: amount,
      new_balance: newBalance
    };
  } catch (error) {
    console.error('خطأ في تثبيت الخصم:', error);
    throw error;
  }
}

export async function refundBalance(base44, userEmail, amount, orderId, serviceName, reason) {
  const transactionId = `REF-${orderId}-${Date.now()}`;

  try {
    const users = await base44.asServiceRole.entities.User.filter({ email: userEmail });
    const user = users[0];

    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    const previousBalance = user.balance || 0;
    const newBalance = previousBalance + amount;
    const newReservedBalance = Math.max((user.reserved_balance || 0) - amount, 0);

    // تحديث الرصيد والرصيد المحجوز
    await base44.asServiceRole.entities.User.update(user.id, {
      balance: newBalance,
      reserved_balance: newReservedBalance
    });

    // تسجيل عملية الإرجاع
    await base44.asServiceRole.entities.BalanceLog.create({
      user_email: userEmail,
      transaction_type: 'refund',
      amount: amount,
      previous_balance: previousBalance,
      new_balance: newBalance,
      order_id: orderId,
      service_name: serviceName,
      status: 'completed',
      transaction_id: transactionId,
      notes: `تم إرجاع الرصيد: ${reason}`
    });

    return {
      success: true,
      transaction_id: transactionId,
      refunded_amount: amount,
      new_balance: newBalance
    };
  } catch (error) {
    console.error('خطأ في إرجاع الرصيد:', error);

    // تسجيل فشل العملية
    await base44.asServiceRole.entities.BalanceLog.create({
      user_email: userEmail,
      transaction_type: 'refund',
      amount: amount,
      order_id: orderId,
      service_name: serviceName,
      status: 'failed',
      transaction_id: transactionId,
      notes: `فشل إرجاع الرصيد: ${error.message}`
    });

    throw error;
  }
}

/**
 * API endpoint للتحكم بالرصيد من لوحة التحكم
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // التحقق من أن المستخدم هو admin
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { action, user_email, amount, order_id, service_name, reason } = await req.json();

    switch (action) {
      case 'check':
        const balanceInfo = await checkBalance(base44, user_email, amount || 0);
        return Response.json(balanceInfo);

      case 'reserve':
        const reserveResult = await reserveBalance(base44, user_email, amount, order_id, service_name);
        return Response.json(reserveResult);

      case 'confirm':
        const confirmResult = await confirmDeduction(base44, user_email, amount, order_id, service_name, `TXN-${Date.now()}`);
        return Response.json(confirmResult);

      case 'refund':
        const refundResult = await refundBalance(base44, user_email, amount, order_id, service_name, reason);
        return Response.json(refundResult);

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in manageBalance:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});