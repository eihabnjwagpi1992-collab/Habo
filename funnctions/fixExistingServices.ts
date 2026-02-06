import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const services = await base44.asServiceRole.entities.Service.filter({
      $or: [{ category: 'gsm_server' }, { category: null }, { category: '' }]
    }, 'created_date', 1000);

    let updated = 0;
    for (const service of services) {
      const groupName = service.subcategory;
      if (!groupName) continue;
      const categoryKey = groupName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      const existingCats = await base44.asServiceRole.entities.ServiceCategory.filter({ category_key: categoryKey });
      if (existingCats.length === 0) {
        await base44.asServiceRole.entities.ServiceCategory.create({ title: groupName, category_key: categoryKey, is_active: true, sort_order: 100 });
      }
      await base44.asServiceRole.entities.Service.update(service.id, { category: categoryKey });
      updated++;
    }
    return Response.json({ success: true, services_updated: updated });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
});
