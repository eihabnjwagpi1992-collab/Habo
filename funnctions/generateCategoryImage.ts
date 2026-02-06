import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate or refresh AI images for service categories
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { category_id, force_regenerate } = await req.json();
    const category = await base44.asServiceRole.entities.ServiceCategory.filter({ id: category_id });

    if (!category || category.length === 0) {
      return Response.json({ error: 'Category not found' }, { status: 404 });
    }

    const cat = category[0];

    // Skip if already has image and not forcing regenerate
    if (cat.image_url && !force_regenerate) {
      return Response.json({ success: false, message: 'Category already has image' }, { status: 200 });
    }

    // Use existing prompt or create new one
    const prompt = cat.image_prompt || getDefaultPrompt(cat.category_key);

    // Generate image
    const result = await base44.integrations.Core.GenerateImage({
      prompt: prompt
    });

    // Update category with new image
    await base44.asServiceRole.entities.ServiceCategory.update(category_id, {
      image_url: result.url,
      image_prompt: prompt
    });

    return Response.json({
      success: true,
      image_url: result.url,
      category: cat.title
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getDefaultPrompt(categoryKey) {
  const prompts = {
    game_topup: 'Modern gaming top-up dashboard, neon gradients, controller icons, clean UI, high quality, 16:9, no text',
    live_streaming: 'Live streaming mobile apps interface, glowing UI, creators theme, dark background, modern style, 16:9, no text',
    apple_icloud: 'Apple iCloud security concept, cloud icons, minimal clean design, blue and white tones, premium look, 16:9, no text',
    frp_security: 'Smartphone security lock concept, shield icon, tech background, dark professional style, 16:9, no text',
    samsung: 'Samsung smartphone service lab, clean workspace, blue tech lighting, professional repair theme, 16:9, no text',
    xiaomi: 'Xiaomi phone repair and software service, orange accents, modern tech desk, 16:9, no text',
    tools_activation: 'GSM software tools dashboard, futuristic interface, glowing panels, dark tech theme, 16:9, no text',
    tools_credits: 'Digital credits and tokens concept, abstract tech shapes, clean modern style, 16:9, no text',
    remote_services: 'Remote desktop support screen, technician helping user, modern office tech style, 16:9, no text',
    social_media: 'Social media analytics dashboard, growth charts, colorful icons, modern UI, 16:9, no text'
  };

  return prompts[categoryKey] || 'Professional service concept, clean modern design, dark background, 16:9, no text';
}