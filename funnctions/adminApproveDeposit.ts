import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * دالة محمية لقبول/رفض طلبات الإيداع
 * يجب أن يكون المستخدم admin لتنفيذ هذه العملية
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // التحقق من المصادقة
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ التحقق من الصلاحيات - MUST BE ADMIN
    if (user.role !== 'admin') {
      console.warn(`⛔ Unauthorized admin action attempt by ${user.email}`);
      return Response.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const { deposit_id, action, admin_note } = await req.json();

    if (!deposit_id || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    // جلب طلب الإيداع
    const deposits = await base44.asServiceRole.entities.DepositRequest.filter({ id: deposit_id });
    const deposit = deposits[0];

    if (!deposit) {
      return Response.json({ error: 'Deposit request not found' }, { status: 404 });
    }

    if (deposit.status !== 'pending') {
      return Response.json(
        { error: `Deposit already ${deposit.status}` },
        { status: 409 }
      );
    }

    if (action === 'approve') {
      // تحديث حالة الإيداع
      await base44.asServiceRole.entities.DepositRequest.update(deposit_id, {
        status: 'approved',
        admin_note: admin_note || 'Approved by admin',
        reviewed_at: new Date().toISOString()
      });

      // إضافة الرصيد للمستخدم
      const targetUsers = await base44.asServiceRole.entities.User.filter({
        email: deposit.user_email
      });
      const targetUser = targetUsers[0];

      if (targetUser) {
        const newBalance = (targetUser.balance || 0) + deposit.amount;

        await base44.asServiceRole.entities.User.update(targetUser.id, {
          balance: newBalance
        });

        // تسجيل عملية الإيداع في balance_logs
        await base44.asServiceRole.entities.BalanceLog.create({
          user_email: deposit.user_email,
          transaction_type: 'deposit',
          amount: deposit.amount,
          previous_balance: targetUser.balance || 0,
          new_balance: newBalance,
          status: 'completed',
          transaction_id: `DEP-${deposit_id}`,
          notes: `إيداع موثق من ${deposit.method} - الرقم المرجعي: ${deposit.reference_number}`
        });

        // إنشاء إشعار للمستخدم
        await base44.asServiceRole.entities.Notification.create({
          title: 'تم قبول الإيداع',
          message: `تم قبول طلب إيداعك بقيمة $${deposit.amount}`,
          type: 'completed',
          is_read: false
        });
      }

      return Response.json({
        success: true,
        message: 'Deposit approved successfully',
        deposit_id,
        amount: deposit.amount
      });

    } else {
      // رفض الإيداع
      await base44.asServiceRole.entities.DepositRequest.update(deposit_id, {
        status: 'rejected',
        admin_note: admin_note || 'Rejected by admin',
        reviewed_at: new Date().toISOString()
      });

      // إنشاء إشعار بالرفض
      await base44.asServiceRole.entities.Notification.create({
        title: 'تم رفض الإيداع',
        message: `تم رفض طلب الإيداع الخاص بك. السبب: ${admin_note || 'بدون تفاصيل'}`,
        type: 'failed',
        is_read: false
      });

      return Response.json({
        success: true,
        message: 'Deposit rejected',
        deposit_id
      });
    }

  } catch (error) {
    console.error('Error in adminApproveDeposit:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
