import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (!data || !data.id) {
      return Response.json({ error: 'Missing order data' }, { status: 400 });
    }

    const order = data;
    const userEmail = order.created_by;

    if (!userEmail) {
      return Response.json({ error: 'No user email found' }, { status: 400 });
    }

    // تحديد نوع الرسالة حسب الحالة
    let subject, body;

    if (order.status === 'completed') {
      subject = '✅ تم قبول طلبك - Your Order Accepted';
      body = `
        <h2>تم قبول طلبك بنجاح! ✅</h2>
        <p><strong>رقم الطلب:</strong> ${order.id}</p>
        <p><strong>الخدمة:</strong> ${order.service_name}</p>
        <p><strong>المبلغ:</strong> $${order.amount?.toFixed(2)}</p>
        <p><strong>الحالة:</strong> مكتمل</p>
        <p>شكراً لاستخدامك خدماتنا!</p>
        ${order.result ? `<p><strong>النتيجة:</strong> ${order.result}</p>` : ''}
      `;
    } else if (order.status === 'failed') {
      subject = '❌ تم رفض طلبك - Your Order Failed';
      body = `
        <h2>للأسف تم رفض طلبك ❌</h2>
        <p><strong>رقم الطلب:</strong> ${order.id}</p>
        <p><strong>الخدمة:</strong> ${order.service_name}</p>
        <p><strong>المبلغ:</strong> $${order.amount?.toFixed(2)}</p>
        <p><strong>الحالة:</strong> فشل</p>
        ${order.notes ? `<p><strong>ملاحظات:</strong> ${order.notes}</p>` : ''}
        <p>يرجى التواصل معنا للحصول على المساعدة.</p>
      `;
    } else if (order.status === 'processing') {
      subject = '⏳ جاري معالجة طلبك - Your Order is Processing';
      body = `
        <h2>جاري معالجة طلبك ⏳</h2>
        <p><strong>رقم الطلب:</strong> ${order.id}</p>
        <p><strong>الخدمة:</strong> ${order.service_name}</p>
        <p>سيتم إخطارك عند اكتمال الطلب.</p>
      `;
    } else if (order.status === 'refunded') {
      subject = '💰 تم استرجاع مبلغك - Your Refund Processed';
      body = `
        <h2>تم استرجاع رصيدك 💰</h2>
        <p><strong>رقم الطلب:</strong> ${order.id}</p>
        <p><strong>المبلغ المسترجع:</strong> $${order.amount?.toFixed(2)}</p>
        <p>تم إضافة المبلغ إلى حسابك.</p>
      `;
    }

    if (subject && body) {
      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: subject,
        body: body
      });
    }

    return Response.json({ success: true, message: 'Email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});