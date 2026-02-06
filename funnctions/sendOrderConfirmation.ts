import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event } = await req.json();

    if (!event || event.type !== 'create' || event.entity_name !== 'Order') {
      return Response.json({ error: 'Invalid event' }, { status: 400 });
    }

    // Fetch order details
    const order = await base44.asServiceRole.entities.Order.get(event.entity_id);
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch service details
    const service = await base44.asServiceRole.entities.Service.get(order.service_id);
    
    // Get user email from created_by
    const userEmail = order.created_by;
    if (!userEmail) {
      return Response.json({ error: 'User email not found' }, { status: 400 });
    }

    // Get Gmail access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('gmail');

    // Build email content
    const emailSubject = `Order Confirmation #${order.id.slice(0, 8).toUpperCase()}`;
    const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #00d4ff, #3b82f6); color: white; padding: 20px; border-radius: 8px; }
    .order-details { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .detail-label { font-weight: bold; }
    .amount { color: #10b981; font-weight: bold; font-size: 18px; }
    .status-badge { display: inline-block; padding: 6px 12px; background: #fbbf24; color: #78350f; border-radius: 4px; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmation</h1>
      <p>Thank you for your order!</p>
    </div>

    <div class="order-details">
      <div class="detail-row">
        <span class="detail-label">Order ID:</span>
        <span>${order.id.slice(0, 8).toUpperCase()}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Service:</span>
        <span>${service?.name || order.service_name}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Amount:</span>
        <span class="amount">$${order.amount?.toFixed(2) || '0.00'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="status-badge">${order.status?.toUpperCase() || 'PENDING'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Order Date:</span>
        <span>${new Date(order.created_date).toLocaleString()}</span>
      </div>
    </div>

    <p>Your order has been received and is being processed. Processing typically takes ${service?.processing_time || '1-24 hours'}.</p>

    <p>You can track your order status in your dashboard at any time.</p>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Tsmart GSM. All rights reserved.</p>
      <p>If you have any questions, please contact our support team.</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    // Send via Gmail API
    const message = {
      to: userEmail,
      subject: emailSubject,
      html: emailBody,
    };

    const encodedMessage = btoa(
      [
        `From: noreply@tsmartgsm.com`,
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        `Content-Type: text/html; charset=utf-8`,
        '',
        message.html
      ].join('\r\n')
    ).replace(/\+/g, '-').replace(/\//g, '_');

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gmail API error:', error);
      return Response.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return Response.json({ success: true, message: 'Order confirmation sent' });
  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});