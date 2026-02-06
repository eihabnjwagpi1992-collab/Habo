import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data, force_regenerate } = await req.json();

    // التحقق من وجود البيانات والتأكد من عدم وجود صورة بالفعل
    if (!data || !data.id || (data.image_url && !force_regenerate)) {
      return Response.json({ skipped: true, reason: 'No service data or image already exists' });
    }

    const service = data;
    
    // تعريفات الفئات مع أنماط متنوعة
    const categoryStyles = {
      'device_unlock': {
        label: 'فتح أجهزة',
        style: 'modern tech icon, minimalist smartphone unlock interface, security theme, bright colors',
        mood: 'professional and trustworthy'
      },
      'game_topup': {
        label: 'شحن ألعاب',
        style: 'gaming icon, joystick and digital coins, vibrant colors, exciting',
        mood: 'dynamic and fun'
      },
      'live_apps': {
        label: 'تطبيقات بث',
        style: 'streaming icon, play button and broadcast waves, modern flat design',
        mood: 'energetic and live'
      },
      'tool_activation': {
        label: 'تفعيل أدوات',
        style: 'tool and activation icon, gears and lightning, technical theme',
        mood: 'powerful and efficient'
      },
      'software_service': {
        label: 'برامج',
        style: 'software icon, code symbol and computer, digital theme',
        mood: 'innovative and technical'
      },
      'digital_service': {
        label: 'خدمات رقمية',
        style: 'digital service icon, cloud and network, global connectivity',
        mood: 'modern and connected'
      }
    };

    const categoryConfig = categoryStyles[service.category] || categoryStyles['digital_service'];

    // إنشاء prompt ذكي ومتنوع للصورة
    const prompt = `Create a professional, modern, unique icon for a service called "${service.name}". 
    
    Category: ${categoryConfig.label}
    Style: ${categoryConfig.style}
    Mood: ${categoryConfig.mood}
    
    ${service.description ? `Description/Details: ${service.description}` : ''}
    
    Design requirements:
    - Square format 512x512
    - High quality, detailed, professional
    - Suitable for mobile app interface
    - Use a vibrant color palette with good contrast
    - Modern flat or semi-realistic design
    - Include subtle gradients or shadows for depth
    - Should be immediately recognizable and stand out
    - Professional aesthetic for enterprise/commercial use
    - Make it unique and memorable
    
    Art style: Modern, sleek, professional UI icon with premium appearance`;

    console.log('Generating image for service:', service.name, 'Category:', service.category);

    // استدعاء AI لتوليد الصورة
    const response = await base44.integrations.Core.GenerateImage({
      prompt: prompt
    });

    if (!response.url) {
      console.error('No URL returned from image generation');
      return Response.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    // تحديث الخدمة بالصورة الجديدة
    await base44.asServiceRole.entities.Service.update(service.id, {
      image_url: response.url
    });

    console.log('Image generated successfully for:', service.name);
    return Response.json({ 
      success: true, 
      service_id: service.id,
      service_name: service.name,
      image_url: response.url
    });

  } catch (error) {
    console.error('Error generating service image:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});