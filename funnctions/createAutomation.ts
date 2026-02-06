import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    
    const {
      name,
      automation_type, // 'scheduled' or 'entity'
      function_name,
      
      // For scheduled automations
      schedule_type, // 'simple', 'cron', or one-time
      repeat_interval,
      repeat_unit,
      repeat_on_days,
      repeat_on_day_of_month,
      start_time,
      one_time_date,
      schedule_mode,
      
      // For entity automations
      entity_name,
      event_types, // array: 'create', 'update', 'delete'
      
      // For both
      function_args,
      description,
      is_active
    } = payload;

    if (!name || !automation_type || !function_name) {
      return Response.json(
        { error: 'Missing required fields: name, automation_type, function_name' },
        { status: 400 }
      );
    }

    // Build automation config
    const automationConfig = {
      automation_type,
      name,
      function_name,
      description: description || '',
      is_active: is_active !== false,
    };

    // Add type-specific fields
    if (automation_type === 'scheduled') {
      automationConfig.schedule_type = schedule_type || 'simple';
      automationConfig.repeat_interval = repeat_interval;
      automationConfig.repeat_unit = repeat_unit;
      if (repeat_on_days) automationConfig.repeat_on_days = repeat_on_days;
      if (repeat_on_day_of_month) automationConfig.repeat_on_day_of_month = repeat_on_day_of_month;
      if (start_time) automationConfig.start_time = start_time;
      if (schedule_mode) automationConfig.schedule_mode = schedule_mode;
      if (one_time_date) automationConfig.one_time_date = one_time_date;
    } else if (automation_type === 'entity') {
      automationConfig.entity_name = entity_name;
      automationConfig.event_types = event_types || ['create'];
    }

    if (function_args) {
      automationConfig.function_args = function_args;
    }

    // Create automation using service role
    const automation = await base44.asServiceRole.functions.invoke('_createAutomation', automationConfig);

    return Response.json({
      success: true,
      automation: automation
    });
  } catch (error) {
    console.error('Error creating automation:', error);
    return Response.json(
      { error: error.message || 'Failed to create automation' },
      { status: 500 }
    );
  }
});