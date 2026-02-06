import { base44 } from '@/api/base44Client';

/**
 * Triggered when an Order status changes
 * Creates a notification and sends an email to the user
 */
export default async function handleOrderStatusChange(event) {
  try {
    const { data: order, id: orderId, previousData } = event;

    // Check if status actually changed
    if (previousData?.status === order.status) {
      return { success: false, reason: 'Status did not change' };
    }

    const statusMessages = {
      pending: {
        title: 'جاري المراجعة',
        message: 'تم استقبال طلبك وهو قيد المراجعة'
      },
      processing: {
        title: 'جاري المعالجة',
        message: 'نحن نعالج طلبك الآن'
      },
      completed: {
        title: 'تم بنجاح',
        message: 'اكتمل طلبك بنجاح. يمكنك الآن الحصول على النتيجة'
      },
      failed: {
        title: 'فشل الطلب',
        message: 'للأسف فشل معالجة طلبك. سيتم استرجاع المبلغ في الحساب'
      },
      refunded: {
        title: 'تم استرجاع المبلغ',
        message: 'تم استرجاع المبلغ إلى حسابك بنجاح'
      }
    };

    const messageConfig = statusMessages[order.status] || statusMessages.pending;

    // Create notification in database
    await base44.entities.Notification.create({
      order_id: orderId,
      title: messageConfig.title,
      message: `${messageConfig.message} - الطلب: ${order.service_name}`,
      type: order.status,
      is_read: false,
      created_by: order.created_by
    });

    // Get user email
    const users = await base44.entities.User.filter({ id: order.created_by });
    const user = users[0];

    if (user?.email) {
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: user.email,
        subject: `${messageConfig.title} - Tsmart GSM`,
        body: `
          <h2>${messageConfig.title}</h2>
          <p>${messageConfig.message}</p>
          <p><strong>تفاصيل الطلب:</strong></p>
          <ul>
            <li>الخدمة: ${order.service_name}</li>
            <li>المبلغ: $${order.amount?.toFixed(2)}</li>
            <li>حالة الطلب: ${statusMessages[order.status]?.title}</li>
          </ul>
          ${order.result ? `<p><strong>النتيجة:</strong> ${order.result}</p>` : ''}
          <p>شكراً لاستخدامك خدماتنا</p>
        `
      });
    }

    return { success: true, notificationCreated: true, emailSent: !!user?.email };
  } catch (error) {
    console.error('Error handling order status change:', error);
    return { success: false, error: error.message };
  }
}