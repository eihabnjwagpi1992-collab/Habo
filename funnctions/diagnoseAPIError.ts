/**
 * تشخيص أخطاء API - تحديد ما إذا كان الخطأ من CORS أو parameter mismatch
 */

export function diagnoseAPIError(error, request, response) {
  const diagnosis = {
    error_type: null,
    error_message: error?.message || 'Unknown error',
    is_cors: false,
    is_parameter_mismatch: false,
    is_authentication: false,
    is_server_error: false,
    suggestions: [],
    raw_error: error?.message,
    http_status: response?.status,
    response_body: response?.body
  };

  // تحليل رسالة الخطأ
  const errorMsg = (error?.message || '').toLowerCase();

  // CORS errors
  if (
    errorMsg.includes('cors') ||
    errorMsg.includes('cross-origin') ||
    errorMsg.includes('access-control-allow-origin')
  ) {
    diagnosis.is_cors = true;
    diagnosis.error_type = 'CORS_ERROR';
    diagnosis.suggestions.push('✓ الخطأ: CORS - السماح من الخادم الخارجي');
    diagnosis.suggestions.push('✓ الحل: يجب استخدام backend proxy بدلاً من direct fetch');
    return diagnosis;
  }

  // Failed to fetch (usually CORS or network)
  if (errorMsg.includes('failed to fetch')) {
    diagnosis.error_type = 'FAILED_TO_FETCH';
    diagnosis.suggestions.push('✓ الخطأ: فشل الاتصال - احتمالية CORS أو network');
    diagnosis.suggestions.push('✓ تحقق من: اتصال الشبكة و CORS headers');
    diagnosis.suggestions.push('✓ الحل: استخدام backend function بدلاً من client-side fetch');
    diagnosis.is_cors = true; // عادة ما يكون CORS
    return diagnosis;
  }

  // Parameter/Field mismatch
  if (response?.body?.includes('ERROR') || response?.body?.includes('error')) {
    const bodyStr = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
    
    if (
      bodyStr.includes('parameter') ||
      bodyStr.includes('field') ||
      bodyStr.includes('invalid') ||
      bodyStr.includes('missing')
    ) {
      diagnosis.is_parameter_mismatch = true;
      diagnosis.error_type = 'PARAMETER_MISMATCH';
      diagnosis.suggestions.push('✓ الخطأ: عدم تطابق الحقول/المعاملات');
      diagnosis.suggestions.push('✓ تحقق من: أسماء الحقول والقيم المرسلة');
      diagnosis.suggestions.push('✓ الحل: مراجعة smartFieldMapper والتأكد من المعايرة الصحيحة');
      return diagnosis;
    }
  }

  // Authentication errors
  if (
    response?.status === 401 ||
    response?.status === 403 ||
    errorMsg.includes('unauthorized') ||
    errorMsg.includes('authentication') ||
    errorMsg.includes('api_key') ||
    errorMsg.includes('apikey')
  ) {
    diagnosis.is_authentication = true;
    diagnosis.error_type = 'AUTHENTICATION_ERROR';
    diagnosis.suggestions.push('✓ الخطأ: مشكلة في المصادقة/API Key');
    diagnosis.suggestions.push('✓ تحقق من: API Key و Username صحيحة');
    diagnosis.suggestions.push('✓ الحل: تحديث بيانات المزود في لوحة التحكم');
    return diagnosis;
  }

  // Server errors
  if (response?.status >= 500) {
    diagnosis.is_server_error = true;
    diagnosis.error_type = 'SERVER_ERROR';
    diagnosis.suggestions.push('✓ الخطأ: خطأ في خادم المزود (5xx)');
    diagnosis.suggestions.push('✓ الحل: تحقق من حالة خادم المزود أو اتصل به');
    return diagnosis;
  }

  return diagnosis;
}

export function formatDiagnosisReport(diagnosis) {
  let report = `
═══════════════════════════════════════════
  تقرير تشخيص الخطأ
═══════════════════════════════════════════

نوع الخطأ: ${diagnosis.error_type || 'UNKNOWN'}
رسالة الخطأ: ${diagnosis.error_message}

البيانات الخام:
- HTTP Status: ${diagnosis.http_status || 'N/A'}
- الخطأ الأصلي: ${diagnosis.raw_error}

التصنيفات:
- CORS Error: ${diagnosis.is_cors ? '✓ نعم' : '✗ لا'}
- Parameter Mismatch: ${diagnosis.is_parameter_mismatch ? '✓ نعم' : '✗ لا'}
- Authentication Error: ${diagnosis.is_authentication ? '✓ نعم' : '✗ لا'}
- Server Error: ${diagnosis.is_server_error ? '✓ نعم' : '✗ لا'}

التوصيات:
${diagnosis.suggestions.map(s => `  ${s}`).join('\n')}

${diagnosis.response_body ? `رد API:
${typeof diagnosis.response_body === 'string' ? diagnosis.response_body : JSON.stringify(diagnosis.response_body, null, 2)}` : ''}

═══════════════════════════════════════════
  `;
  return report;
}