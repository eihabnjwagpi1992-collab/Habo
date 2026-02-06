import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getProviderMapper } from './smartFieldMapper.js';
import { diagnoseAPIError, formatDiagnosisReport } from './diagnoseAPIError.js';
import { checkBalance, reserveBalance, confirmDeduction, refundBalance } from './manageBalance.js';

/**
 * إرسال الطلب تلقائياً للمزود عند إنشاء طلب جديد
 * مع نظام الرصيد المتقدم
 */
export default async function submitOrderToProvider(orderId) {
  const base44 = createClientFromRequest({});
  let reserveTransactionId = null;

  try {
    // احصل على الطلب
    const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
    const order = orders[0];

    if (!order) {
      return { success: false, error: 'الطلب غير موجود' };
    }

    // احصل على بيانات الخدمة والمزود
    const services = await base44.asServiceRole.entities.Service.filter({ id: order.service_id });
    const service = services[0];

    if (!service) {
      return { success: false, error: 'الخدمة غير موجودة' };
    }

    // احصل على بيانات المستخدم
    const orderCreator = order.created_by;
    if (!orderCreator) {
      return { success: false, error: 'لم يتم العثور على مالك الطلب' };
    }

    // خطوة 1: التحقق من الرصيد
    const balanceCheck = await checkBalance(base44, orderCreator, order.amount);
    if (!balanceCheck.can_purchase) {
      return { 
        success: false, 
        error: `رصيد غير كافي. الرصيد المتاح: ${balanceCheck.available_balance}, المطلوب: ${order.amount}`
      };
    }

    // خطوة 2: حجز الرصيد
    const reserveResult = await reserveBalance(base44, orderCreator, order.amount, orderId, service.name);
    reserveTransactionId = reserveResult.transaction_id;

    const providers = await base44.asServiceRole.entities.APIProvider.filter({ id: service.provider_id });
    const provider = providers[0];

    if (!provider || !provider.auto_submit_enabled) {
      // إرجاع الرصيد المحجوز
      await refundBalance(base44, orderCreator, order.amount, orderId, service.name, 'الإرسال التلقائي غير مفعل');
      return { success: false, error: 'الإرسال التلقائي غير مفعل' };
    }

    // احصل على معايرة الحقول المناسبة للمزود
    const mapperConfig = getProviderMapper(provider.name);
    const fieldMappings = mapperConfig.mapper(order, service);

    // تحضير بيانات الطلب مع المعايرة
    const payload = buildRequestPayload(order, service, provider, fieldMappings);

    // أرسل الطلب للمزود
    const response = await submitToProvider(provider, payload, mapperConfig);

    // سجل محاولة الإرسال مع التشخيص المفصل
    const detailedLogText = response.detailed_log ? 
      JSON.stringify(response.detailed_log, null, 2) : 
      'No detailed log available';

    const errorDiagnosisText = response.detailed_log?.error_diagnosis ? 
      JSON.stringify(response.detailed_log.error_diagnosis, null, 2) : 
      null;

    await base44.entities.APILog.create({
      order_id: orderId,
      provider_id: service.provider_id,
      provider_name: provider.name,
      action: 'submit_order',
      request_payload: JSON.stringify(payload),
      response_payload: JSON.stringify(response.data || response.error),
      http_status: response.http_status || (response.success ? 200 : 400),
      success: response.success,
      error_message: response.error,
      mapping_used: provider.name,
      field_mappings: JSON.stringify(fieldMappings),
      // إضافة حقول التشخيص
      detailed_log: detailedLogText,
      error_diagnosis: errorDiagnosisText
    });

    if (!response.success) {
      // خطأ: إرجاع الرصيد المحجوز تلقائياً
      await refundBalance(base44, orderCreator, order.amount, orderId, service.name, `فشل الإرسال للمزود: ${response.error}`);

      // حدّث حالة الطلب
      await base44.asServiceRole.entities.Order.update(orderId, {
        status: 'failed',
        admin_notes: `فشل الإرسال للمزود: ${response.error}. تم إرجاع الرصيد تلقائياً`
      });

      return { success: false, error: response.error };
    }

    // احفظ معلومات الطلب الخارجي
    const externalOrder = await base44.asServiceRole.entities.ExternalOrder.create({
      local_order_id: orderId,
      provider_id: service.provider_id,
      external_order_id: response.order_id,
      service_code: service.external_service_id,
      status: 'submitted',
      external_status: response.status,
      target_device: order.imei || order.player_id || order.email_target,
      request_payload: JSON.stringify(payload),
      response_payload: JSON.stringify(response.data),
      submitted_at: new Date().toISOString()
    });

    // خطوة 3: تثبيت الخصم عند النجاح
    await confirmDeduction(base44, orderCreator, order.amount, orderId, service.name, reserveTransactionId);

    // حدّث حالة الطلب
    await base44.asServiceRole.entities.Order.update(orderId, {
      status: 'processing'
    });

    return {
      success: true,
      external_order_id: response.order_id,
      message: 'تم إرسال الطلب للمزود بنجاح والخصم تم تثبيته'
    };
  } catch (error) {
    console.error('خطأ في إرسال الطلب للمزود:', error);
    
    // إرجاع الرصيد المحجوز في حالة الخطأ
    if (reserveTransactionId) {
      try {
        const orders = await base44.asServiceRole.entities.Order.filter({ id: orderId });
        const order = orders[0];
        const services = await base44.asServiceRole.entities.Service.filter({ id: order.service_id });
        const service = services[0];
        
        await refundBalance(base44, order.created_by, order.amount, orderId, service?.name, `خطأ في المعالجة: ${error.message}`);
      } catch (refundError) {
        console.error('فشل إرجاع الرصيد:', refundError);
      }
    }
    
    // سجل الخطأ
    await base44.asServiceRole.entities.APILog.create({
      order_id: orderId,
      provider_id: '',
      provider_name: 'Unknown',
      action: 'submit_order',
      success: false,
      error_message: error.message
    });

    return { success: false, error: error.message };
  }
}

/**
 * بناء بيانات الطلب حسب صيغة المزود مع معايرة الحقول
 */
function buildRequestPayload(order, service, provider, fieldMappings) {
  return fieldMappings;
}

/**
 * استخراج تفاصيل الجهاز من الطلب
 */
function extractDeviceDetails(order) {
  const details = {};

  if (order.imei) {
    details.imei = order.imei;
    details.device_type = 'mobile';
  }

  if (order.player_id) {
    details.player_id = order.player_id;
    details.device_type = 'gaming';
  }

  if (order.email_target) {
    details.email = order.email_target;
    details.device_type = 'digital';
  }

  return details;
}

/**
 * أرسل الطلب للمزود مع تسجيل مفصل
 */
async function submitToProvider(provider, payload, mapperConfig) {
  const detailedLog = {
    timestamp: new Date().toISOString(),
    provider: provider.name,
    url: '',
    headers: {},
    payload_sent: null,
    response_received: null,
    error_diagnosis: null
  };

  try {
    const isDHRU = provider.name?.toLowerCase().includes('dhru') || provider.name?.toLowerCase().includes('powergsm');
    
    let url = provider.base_url;
    if (!url.endsWith('/')) url += '/';
    
    let body, headers = {};

    if (isDHRU) {
      // DHRU يتطلب صيغة Form Data وليس JSON
      url += 'api';
      const formData = new FormData();
      formData.append('action', 'placeimeiorder');
      formData.append('username', provider.username);
      formData.append('apiaccesskey', provider.api_key);
      
      const parametersObj = {
        ID: payload.ID,
        customfield: payload.customfield
      };
      
      try {
        // محاولة Buffer.from (Node.js)
        formData.append('parameters', Buffer.from(JSON.stringify(parametersObj)).toString('base64'));
      } catch (e) {
        // fallback للمتصفح
        formData.append('parameters', btoa(JSON.stringify(parametersObj)));
      }
      
      body = formData;
      detailedLog.payload_sent = {
        action: 'placeimeiorder',
        username: provider.username,
        apiaccesskey: '***HIDDEN***',
        parameters: parametersObj
      };
    } else {
      // معايرة عامة
      headers = {
        'Content-Type': provider.api_format === 'xml' ? 'application/xml' : 'application/json',
        'X-API-Key': provider.api_key,
        'Authorization': `Bearer ${provider.api_key}`
      };

      body = provider.api_format === 'xml'
        ? jsonToXml(payload)
        : JSON.stringify(payload);
      
      detailedLog.payload_sent = payload;
      url += mapperConfig.endpoint;
    }

    detailedLog.url = url;
    detailedLog.headers = {
      'Content-Type': headers['Content-Type'] || 'multipart/form-data',
      'X-API-Key': headers['X-API-Key'] ? '***HIDDEN***' : 'N/A'
    };

    console.log('📤 Sending request to provider:', detailedLog);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });

    const responseText = await response.text();
    let data;

    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    detailedLog.response_received = {
      status: response.status,
      body: data
    };

    console.log('📥 Response from provider:', detailedLog.response_received);

    if (!response.ok) {
      const errorMsg = data.ERROR?.[0]?.MESSAGE || 
                       data.message || 
                       data.error || 
                       `خطأ من المزود: ${response.status}`;
      
      detailedLog.error_diagnosis = diagnoseAPIError(
        new Error(errorMsg),
        detailedLog.payload_sent,
        { status: response.status, body: data }
      );

      console.error('❌ API Error Diagnosis:\n', formatDiagnosisReport(detailedLog.error_diagnosis));
      
      return {
        success: false,
        error: errorMsg,
        http_status: response.status,
        data,
        detailed_log: detailedLog
      };
    }

    // تحقق من وجود أخطاء في الرد حتى لو كان status 200
    if (data.ERROR) {
      const errorMsg = data.ERROR[0]?.MESSAGE || 'خطأ من المزود';
      
      detailedLog.error_diagnosis = diagnoseAPIError(
        new Error(errorMsg),
        detailedLog.payload_sent,
        { status: 200, body: data }
      );

      console.error('❌ API Error Diagnosis:\n', formatDiagnosisReport(detailedLog.error_diagnosis));
      
      return {
        success: false,
        error: errorMsg,
        http_status: 200,
        data,
        detailed_log: detailedLog
      };
    }

    console.log('✅ Order submitted successfully');

    return {
      success: true,
      order_id: data.REFERENCEID || data.order_id || data.id,
      status: data.status || 'submitted',
      http_status: 200,
      data,
      detailed_log: detailedLog
    };
  } catch (error) {
    detailedLog.error_diagnosis = diagnoseAPIError(
      error,
      detailedLog.payload_sent,
      detailedLog.response_received
    );

    console.error('❌ Network Error Diagnosis:\n', formatDiagnosisReport(detailedLog.error_diagnosis));

    return {
      success: false,
      error: error.message,
      http_status: 0,
      detailed_log: detailedLog
    };
  }
}

/**
 * تحويل JSON إلى XML بسيط
 */
function jsonToXml(obj, rootName = 'order') {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>`;

  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      xml += jsonToXml(obj[key], key);
    } else {
      xml += `<${key}>${escapeXml(obj[key])}</${key}>`;
    }
  }

  xml += `</${rootName}>`;
  return xml;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
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