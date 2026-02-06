import { base44 } from '@/api/base44Client';

/**
 * فحص حالة الطلبات المعلقة لدى المزودين وتحديثها تلقائياً
 * يتم استدعاء هذه الدالة من خلال جدولة أوتوماتيكية
 */
export default async function pollProviderOrderStatus() {
  try {
    // احصل على جميع الطلبات الخارجية المعلقة أو قيد المعالجة
    const pendingOrders = await base44.entities.ExternalOrder.filter({
      status: { $in: ['submitted', 'processing'] }
    }, '-updated_date', 100);

    if (pendingOrders.length === 0) {
      return { success: true, checked: 0, updated: 0 };
    }

    let updated = 0;

    for (const externalOrder of pendingOrders) {
      const result = await checkAndUpdateOrder(externalOrder);
      if (result.status_changed) {
        updated++;
      }
    }

    return {
      success: true,
      checked: pendingOrders.length,
      updated: updated,
      message: `تم فحص ${pendingOrders.length} طلب و تحديث ${updated} منها`
    };
  } catch (error) {
    console.error('خطأ في فحص حالات الطلبات:', error);
    return { success: false, error: error.message };
  }
}

/**
 * فحص وتحديث طلب واحد
 */
async function checkAndUpdateOrder(externalOrder) {
  try {
    // احصل على بيانات المزود
    const providers = await base44.entities.APIProvider.filter({
      id: externalOrder.provider_id
    });
    const provider = providers[0];

    if (!provider) {
      return { success: false, status_changed: false };
    }

    // تحقق من الحالة لدى المزود
    const statusResponse = await checkProviderStatus(provider, externalOrder.external_order_id);

    if (!statusResponse.success) {
      return { success: false, status_changed: false };
    }

    const newStatus = statusResponse.status;
    const result = statusResponse.result;

    // تحقق إذا كانت هناك تغيير في الحالة
    if (externalOrder.external_status === newStatus) {
      return { success: true, status_changed: false };
    }

    // حدّث الطلب الخارجي
    await base44.entities.ExternalOrder.update(externalOrder.id, {
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

    if (!localOrder) {
      return { success: true, status_changed: true };
    }

    const localStatus = mapExternalStatusToLocal(newStatus);

    // تحديث الطلب المحلي إذا تغيرت الحالة
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
        is_read: false
      });

      // أرسل بريد إلكتروني للمستخدم
      try {
        const users = await base44.entities.User.filter({
          email: localOrder.created_by
        });
        const user = users[0];

        if (user?.email) {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `${notificationMessage.title} - TsmartGSM`,
            body: `
              <h2>${notificationMessage.title}</h2>
              <p>${notificationMessage.message}</p>
              ${result ? `<p><strong>النتيجة:</strong> ${result}</p>` : ''}
              <p><strong>رقم الطلب:</strong> ${externalOrder.local_order_id}</p>
            `
          });
        }
      } catch (emailError) {
        console.error('خطأ في إرسال البريد:', emailError);
      }
    }

    return { success: true, status_changed: true };
  } catch (error) {
    console.error('خطأ في تحديث الطلب:', error);
    return { success: false, status_changed: false, error: error.message };
  }
}

/**
 * فحص حالة الطلب لدى المزود
 */
async function checkProviderStatus(provider, externalOrderId) {
  try {
    const headers = {
      'X-API-Key': provider.api_key,
      'Authorization': `Bearer ${provider.api_key}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(`${provider.base_url}/orders/${externalOrderId}/status`, {
      method: 'GET',
      headers
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
      result: data.result || data.code || null
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
      title: '✓ تم بنجاح',
      message: 'اكتمل طلبك بنجاح! يمكنك الآن الحصول على النتيجة من قسم الطلبات'
    },
    failed: {
      title: '✗ فشل الطلب',
      message: 'للأسف فشل معالجة طلبك. سيتم استرجاع المبلغ خلال 24 ساعة'
    },
    processing: {
      title: '⏳ جاري المعالجة',
      message: 'يتم معالجة طلبك حالياً، سيتم إخطارك عند الانتهاء'
    },
    pending: {
      title: '📋 قيد المراجعة',
      message: 'طلبك قيد المراجعة، يرجى الانتظار'
    }
  };

  return messages[status] || { title: '📬 تحديث الطلب', message: 'تم تحديث حالة طلبك' };
}

/**
 * تحويل XML إلى JSON
 */
function xmlToJson(xmlString) {
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlString, 'application/xml');

    if (xml.documentElement.tagName === 'parsererror') {
      throw new Error('خطأ في تحليل XML');
    }

    return xmlElementToJson(xml.documentElement);
  } catch (error) {
    console.error('خطأ في تحويل XML:', error);
    return {};
  }
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