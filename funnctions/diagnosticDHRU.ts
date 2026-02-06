import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { providerId } = payload;

    const providers = await base44.asServiceRole.entities.APIProvider.filter({ id: providerId });
    if (!providers?.[0]) {
      return Response.json({ error: 'Provider not found' }, { status: 404 });
    }

    const provider = providers[0];
    const diagnostics = {
      provider: {
        name: provider.name,
        base_url: provider.base_url,
        username: provider.username,
        hasApiKey: !!provider.api_key,
        is_active: provider.is_active
      },
      tests: []
    };

    if (!provider.is_active) {
      diagnostics.tests.push({
        test: 'Provider Active Check',
        status: 'FAILED',
        reason: 'Provider is not active'
      });
      return Response.json(diagnostics, { status: 200 });
    }

    if (!provider.username || !provider.api_key) {
      diagnostics.tests.push({
        test: 'Credentials Check',
        status: 'FAILED',
        reason: `Missing: ${!provider.username ? 'username' : ''} ${!provider.api_key ? 'api_key' : ''}`
      });
      return Response.json(diagnostics, { status: 200 });
    }

    // Test 1: Direct GET with URL params
    let url = provider.base_url;
    if (!url.endsWith('/')) url += '/';
    
    const params = new URLSearchParams();
    params.append('action', 'imeiservicelist');
    params.append('username', provider.username);
    params.append('apiaccesskey', provider.api_key);
    
    const urlWithParams = url + '?' + params.toString();
    
    try {
      const response = await fetch(urlWithParams, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const responseText = await response.text();
      
      diagnostics.tests.push({
        test: 'GET with URL params',
        status: response.ok ? 'SUCCESS' : 'HTTP_ERROR',
        httpStatus: response.status,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200),
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok && responseText) {
        try {
          const json = JSON.parse(responseText);
          diagnostics.tests[diagnostics.tests.length - 1].parsedJSON = json;
        } catch (e) {
          diagnostics.tests[diagnostics.tests.length - 1].jsonError = e.message;
        }
      }
    } catch (e) {
      diagnostics.tests.push({
        test: 'GET with URL params',
        status: 'FETCH_ERROR',
        error: e.message
      });
    }

    // Test 2: Try POST with FormData
    try {
      const formData = new FormData();
      formData.append('action', 'imeiservicelist');
      formData.append('username', provider.username);
      formData.append('apiaccesskey', provider.api_key);

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const responseText = await response.text();
      
      diagnostics.tests.push({
        test: 'POST with FormData',
        status: response.ok ? 'SUCCESS' : 'HTTP_ERROR',
        httpStatus: response.status,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200)
      });

      if (response.ok && responseText) {
        try {
          const json = JSON.parse(responseText);
          diagnostics.tests[diagnostics.tests.length - 1].parsedJSON = json;
        } catch (e) {
          diagnostics.tests[diagnostics.tests.length - 1].jsonError = e.message;
        }
      }
    } catch (e) {
      diagnostics.tests.push({
        test: 'POST with FormData',
        status: 'FETCH_ERROR',
        error: e.message
      });
    }

    // Test 3: Try different endpoints
    const endpoints = [
      '',
      'api/',
      'api/v1/',
      'client/api/',
      'fusion/api/'
    ];

    for (const endpoint of endpoints) {
      try {
        const testUrl = url + endpoint + '?' + params.toString();
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const responseText = await response.text();
          diagnostics.tests.push({
            test: `GET endpoint: ${endpoint || 'root'}`,
            status: 'SUCCESS',
            httpStatus: response.status,
            responseLength: responseText.length,
            responsePreview: responseText.substring(0, 150)
          });

          if (responseText) {
            try {
              diagnostics.tests[diagnostics.tests.length - 1].parsedJSON = JSON.parse(responseText);
            } catch (e) {
              diagnostics.tests[diagnostics.tests.length - 1].jsonError = e.message;
            }
          }
        }
      } catch (e) {
        // Silent fail for endpoint tests
      }
    }

    return Response.json(diagnostics, { status: 200 });

  } catch (error) {
    return Response.json({
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 });
  }
});