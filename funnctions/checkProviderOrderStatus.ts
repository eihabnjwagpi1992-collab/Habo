import { base44 } from '@/api/base44Client';

/**
 * التحقق من حالة الطلب لدى المزود وتحديث الطلب المحلي
 */
export default async function checkProviderOrderStatus(externalOrderId) {
  try {
    // احصل على بيانات الطلب الخارجي
    const externalOrders = await base44.entities.ExternalOrder.filter({
      id: externalOrderId
    });
    const externalOrder = externalOrders[0];

    if (!externalOrder) {
      return { success: false, error: 'الطلب الخارجي غير موجود' };
    }

    // احصل على بيانات المزود
    const providers = await base44.entities.APIProvider.filter({
      id: externalOrder.provider_id
    });
    const provider = providers[0];

    if (!provider) {
      return { success: false, error: 'المزود غير موجود' };
    }

    // تحقق من حالة الطلب لدى المزود
    const statusResponse = await checkStatusAtProvider(provider, externalOrder.external_order_id);

    if (!statusResponse.success) {
      return { success: false, error: statusResponse.error };
    }

    const newStatus = statusResponse.status;
    const result = statusResponse.result || null;

    // حدّث الطلب الخارجي
    await base44.entities.ExternalOrder.update(externalOrderId, {
      external_status: newStatus,
      result: result,
      last_check: new Date().toISOString(),
      status: mapExternalStatusToLocal(newStatus)
    });

    // احصل على الطلب المحلي
    const localOrders = await base44.entities.Order.filter({
      id: externalOrder.local_order_id
    });
    const localOrder = localOrders[0];

    if (localOrder) {
      const localStatus = mapExternalStatusToLocal(newStatus);

      // إذا كانت هناك تغيير في الحالة، حدّث الطلب المحلي
      if (localOrder.status !== localStatus) {
        await base44.entities.Order.update(externalOrder.local_order_id, {
          status: localStatus,
          result: result
        });

        // أرسل إشعار للمستخدم
        const notificationMessage = getNotificationMessage(localStatus);
        await base44.entities.Notification.create({
          order_id: externalOrder.local_order_id,
          title: notificationMessage.title,
          message: notificationMessage.message,
          type: localStatus,
          is_read: false,
          created_by: localOrder.created_by
        });

        // أرسل بريد إلكتروني
        const users = await base44.entities.User.filter({
          id: localOrder.created_by
        });
        const user = users[0];

        if (user?.email) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `${notificationMessage.title} - Tsmart GSM`,
            body: `<h2>${notificationMessage.title}</h2><p>${notificationMessage.message}</p>${result ? `<p><strong>النتيجة:</strong> ${result}</p>` : ''}`
          });
        }
      }
    }

    return {
      success: true,
      old_status: externalOrder.status,
      new_status: newStatus,
      result: result,
      message: 'تم التحقق من حالة الطلب بنجاح'
    };
  } catch (error) {
    console.error('خطأ في التحقق من حالة الطلب:', error);
    return { success: false, error: error.message };
  }
}

/**
 * تحقق من حالة الطلب لدى المزود
 */
async function checkStatusAtProvider(provider, externalOrderId) {
  try {
    const headers = {
      'X-API-Key': provider.api_key,
      'Authorization': `Bearer ${provider.api_key}`
    };

    const response = await fetch(`${provider.base_url}/orders/${externalOrderId}/status`, {
      method: 'GET',
      headers,
      auth: provider.username ? {
        username: provider.username,
        password: provider.password
      } : undefined
    });

    if (!response.ok) {
      return {
        success: false,
        error: `خطأ من المزود: ${response.status}`
      };
    }

    const data = provider.api_format === 'xml'
      ? xmlToJson(await response.text())
      : await response.json();

    return {
      success: true,
      status: data.status || 'unknown',
      result: data.result || null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * تحويل حالة المزود إلى حالة محلية
 */
function mapExternalStatusToLocal(externalStatus) {
  const statusMap = {
    'success': 'completed',
    'completed': 'completed',
    'approved': 'completed',
    'pending': 'pending',
    'processing': 'processing',
    'in_progress': 'processing',
    'failed': 'failed',
    'error': 'failed',
    'rejected': 'failed'
  };

  return statusMap[externalStatus?.toLowerCase()] || 'pending';
}

/**
 * احصل على رسالة الإشعار
 */
function getNotificationMessage(status) {
  const messages = {
    completed: {
      title: 'تم بنجاح ✓',
      message: 'اكتمل طلبك بنجاح. يمكنك الآن الحصول على النتيجة'
    },
    failed: {
      title: 'فشل الطلب ✗',
      message: 'للأسف فشل معالجة طلبك. سيتم استرجاع المبلغ قريباً'
    },
    processing: {
      title: 'جاري المعالجة',
      message: 'يتم معالجة طلبك حالياً، يرجى الانتظار'
    },
    pending: {
      title: 'قيد المراجعة',
      message: 'طلبك قيد المراجعة من قبل الفريق'
    }
  };

  return messages[status] || { title: 'تحديث الطلب', message: 'تم تحديث حالة طلبك' };
}

function xmlToJson(xmlString) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlString, 'application/xml');

  if (xml.documentElement.tagName === 'parsererror') {
    throw new Error('خطأ في تحليل XML');
  }

  return xmlElementToJson(xml.documentElement);
}

function xmlElementToJson(element) {
  const result = {};

  if (element.children.length === 0) {
    return element.textContent;
  }

  for (const child of element.children) {
    if (result[child.tagName]) {
      if (!Array.isArray(result[child.tagName])) {
        result[child.tagName] = [result[child.tagName]];
      }
      result[child.tagName].push(xmlElementToJson(child));
    } else {
      result[child.tagName] = xmlElementToJson(child);
    }
  }

  return result;
}