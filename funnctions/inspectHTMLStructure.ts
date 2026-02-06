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
    let baseUrl = provider.base_url;
    if (!baseUrl.endsWith('/')) baseUrl += '/';

    const params = new URLSearchParams({
      action: 'imeiservicelist',
      username: provider.username,
      apiaccesskey: provider.api_key
    });

    const url = baseUrl + '?' + params.toString();
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const html = await response.text();

    // Extract different types of data patterns
    const analysis = {
      htmlLength: html.length,
      htmlPreview: html.substring(0, 2000),
      patterns: {
        hasTables: /<table[^>]*>/i.test(html),
        hasJson: /\{[\s\S]*?\}/m.test(html),
        hasJsonLd: /<script[^>]*type="application\/ld\+json"[^>]*>/i.test(html),
        hasScripts: /<script[^>]*>/i.test(html),
        hasData: /data-/i.test(html),
        hasApi: /api|service|product/i.test(html)
      },
      // Try to find JSON data embedded in scripts
      embeddedJson: [],
      // Try to find text patterns that look like service data
      textPatterns: []
    };

    // Look for JSON in script tags
    const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let scriptMatch;
    while ((scriptMatch = scriptPattern.exec(html)) !== null) {
      const scriptContent = scriptMatch[1];
      try {
        const jsonMatch = scriptContent.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.SUCCESS || parsed.services || parsed.data) {
            analysis.embeddedJson.push({
              found: true,
              keys: Object.keys(parsed).slice(0, 5),
              preview: JSON.stringify(parsed).substring(0, 200)
            });
          }
        }
      } catch (e) {
        // Silent
      }
    }

    // Look for service data patterns
    const servicePattern = /service[^<]*(?:id|name|price|cost)[\s\S]*?(?=<|service)/gi;
    const matches = html.match(servicePattern);
    if (matches) {
      analysis.textPatterns = matches.slice(0, 5).map(m => m.substring(0, 100));
    }

    // Extract all text content and look for tabular data
    const textContent = html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    analysis.textContentPreview = textContent.substring(0, 1000);

    return Response.json(analysis, { status: 200 });

  } catch (error) {
    return Response.json({
      error: error.message
    }, { status: 500 });
  }
});