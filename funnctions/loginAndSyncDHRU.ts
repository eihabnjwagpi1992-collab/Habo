import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const { providerId, email, password } = payload;

    const providers = await base44.asServiceRole.entities.APIProvider.filter({ id: providerId });
    if (!providers?.[0]) {
      return Response.json({ error: 'Provider not found' }, { status: 404 });
    }

    const provider = providers[0];
    let baseUrl = provider.base_url;
    if (!baseUrl.endsWith('/')) baseUrl += '/';

    const result = {
      steps: [],
      services: null
    };

    // Step 1: Try login
    const loginResult = {
      step: 'Login',
      status: 'pending'
    };
    result.steps.push(loginResult);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const loginResponse = await fetch(baseUrl + 'login', {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      });

      loginResult.status = loginResponse.ok ? 'SUCCESS' : 'FAILED';
      loginResult.httpStatus = loginResponse.status;

      // Get cookies from Set-Cookie headers
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      loginResult.hasCookies = !!setCookieHeader;

      // Step 2: Try API with authenticated session
      if (loginResponse.ok || setCookieHeader) {
        const apiResult = {
          step: 'API Call with Session',
          status: 'pending'
        };
        result.steps.push(apiResult);

        const params = new URLSearchParams({
          action: 'imeiservicelist',
          username: provider.username,
          apiaccesskey: provider.api_key
        });

        const apiResponse = await fetch(baseUrl + '?' + params.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cookie': setCookieHeader || ''
          }
        });

        const responseText = await apiResponse.text();

        apiResult.status = apiResponse.ok ? 'SUCCESS' : 'FAILED';
        apiResult.httpStatus = apiResponse.status;
        apiResult.responseLength = responseText.length;

        // Try to parse response
        try {
          const json = JSON.parse(responseText);
          apiResult.parsedJSON = true;
          apiResult.keys = Object.keys(json).slice(0, 5);
          result.services = json;
        } catch (e) {
          apiResult.parsedJSON = false;
          apiResult.responsePreview = responseText.substring(0, 300);
        }
      }
    } catch (e) {
      loginResult.error = e.message;
    }

    return Response.json(result, { status: 200 });

  } catch (error) {
    return Response.json({
      error: error.message,
      stack: error.stack?.substring(0, 300)
    }, { status: 500 });
  }
});