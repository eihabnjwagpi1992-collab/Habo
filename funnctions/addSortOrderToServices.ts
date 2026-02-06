import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Add sort_order to services if missing
 * Ensures stable ordering within categories
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const allServices = await base44.asServiceRole.entities.Service.filter({}, '-created_date', 2000);
    
    let updated = 0;
    const errors = [];

    // Group by category
    const byCategory = {};
    allServices.forEach(service => {
      const cat = service.category || 'uncategorized';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(service);
    });

    // For each category, assign sort_order if missing
    for (const [category, services] of Object.entries(byCategory)) {
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        if (!service.sort_order) {
          try {
            await base44.asServiceRole.entities.Service.update(service.id, {
              sort_order: i
            });
            updated++;
          } catch (e) {
            errors.push({ service_id: service.id, error: e.message });
          }
        }
      }
    }

    return Response.json({
      success: true,
      updated_count: updated,
      errors: errors.slice(0, 5)
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});