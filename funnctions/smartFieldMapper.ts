/**
 * Smart Field Mapper - تحويل الحقول المحلية إلى حقول مطلوبة من المزود
 */

export function mapFieldsForDHRU(order, service) {
  const mapped = {
    action: 'placeimeiorder',
    username: '', // سيتم إضافته من قبل submitToProvider
    apiaccesskey: '', // سيتم إضافته من قبل submitToProvider
    ID: service.external_service_id,
    customfield: ''
  };

  const customFields = {};

  // حسب نوع الخدمة
  if (service.input_type === 'IMEI_SERVICE' || service.category === 'gsm_server') {
    // خدمات IMEI
    if (order.imei) {
      customFields['IMEI'] = order.imei;
    }
    if (order.custom_inputs?.network) {
      customFields['Network'] = order.custom_inputs.network;
    }
    if (order.custom_inputs?.mobile) {
      customFields['Mobile'] = order.custom_inputs.mobile;
    }
  } else if (service.input_type === 'GAME_TOPUP' || service.category === 'game_topup') {
    // خدمات الألعاب
    if (order.player_id) {
      customFields['Username'] = order.player_id;
    }
    if (order.custom_inputs?.quantity) {
      customFields['Quantity'] = order.custom_inputs.quantity;
    }
  } else if (service.input_type === 'SIMPLE') {
    // خدمات بسيطة
    if (order.email_target) {
      customFields['Email'] = order.email_target;
    }
  }

  mapped.customfield = Buffer.from(JSON.stringify(customFields)).toString('base64');
  return mapped;
}

export function mapFieldsForStarkCard(order, service) {
  const mapped = {
    service_id: service.external_service_id,
    reference_id: order.id,
    amount: order.amount
  };

  // حسب نوع الخدمة
  if (service.input_type === 'IMEI_SERVICE') {
    mapped.imei = order.imei;
    if (order.custom_inputs) {
      mapped.custom_data = order.custom_inputs;
    }
  } else if (service.input_type === 'GAME_TOPUP') {
    mapped.player_id = order.player_id;
    mapped.quantity = order.custom_inputs?.quantity;
  } else if (service.input_type === 'SIMPLE') {
    mapped.target = order.email_target || order.imei || order.player_id;
  }

  return mapped;
}

export function mapFieldsForGeneric(order, service) {
  return {
    service_code: service.external_service_id,
    reference: order.id,
    amount: order.amount,
    device: order.imei || order.player_id || order.email_target,
    quantity: order.custom_inputs?.quantity,
    ...order.custom_inputs
  };
}

export function getProviderMapper(providerName) {
  const name = (providerName || '').toLowerCase();
  
  if (name.includes('dhru') || name.includes('powergsm')) {
    return {
      mapper: mapFieldsForDHRU,
      format: 'form',
      endpoint: 'placeimeiorder'
    };
  } else if (name.includes('stark')) {
    return {
      mapper: mapFieldsForStarkCard,
      format: 'json',
      endpoint: '/orders/submit'
    };
  }
  
  return {
    mapper: mapFieldsForGeneric,
    format: 'json',
    endpoint: '/orders/submit'
  };
}