import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Brand image mappings
        const brandMappings = [
            { keywords: ['pubg'], image: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/03/PUBG_Mobile_logo.png/300px-PUBG_Mobile_logo.png' },
            { keywords: ['free fire'], image: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Free_Fire_Logo.png' },
            { keywords: ['apple', 'iphone', 'icloud'], image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/300px-Apple_logo_black.svg.png' },
            { keywords: ['samsung'], image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/300px-Samsung_Logo.svg.png' },
            { keywords: ['xiaomi', 'mi account'], image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/300px-Xiaomi_logo_%282021-%29.svg.png' },
            { keywords: ['tiktok'], image: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/TikTok_logo.svg/300px-TikTok_logo.svg.png' }
        ];

        // Fetch all services
        const allServices = await base44.asServiceRole.entities.Service.list('-created_date', 10000);

        const stats = {
            total: allServices.length,
            brand_matched: 0,
            dynamic_generated: 0,
            updated: 0
        };

        // Process in batches to avoid rate limits
        const BATCH_SIZE = 50;
        const DELAY_MS = 100;

        for (let i = 0; i < allServices.length; i += BATCH_SIZE) {
            const batch = allServices.slice(i, i + BATCH_SIZE);
            
            const updatePromises = batch.map(async (service) => {
                const name = service.name.toLowerCase();
                let imageUrl = null;

                // Check brand mappings
                for (const brand of brandMappings) {
                    if (brand.keywords.some(kw => name.includes(kw))) {
                        imageUrl = brand.image;
                        stats.brand_matched++;
                        break;
                    }
                }

                // If no brand match, generate dynamic placeholder
                if (!imageUrl) {
                    const encodedName = encodeURIComponent(service.name);
                    imageUrl = `https://placehold.co/600x400/1e293b/FFF/png?text=${encodedName}`;
                    stats.dynamic_generated++;
                }

                // Update service with image
                await base44.asServiceRole.entities.Service.update(service.id, {
                    image_url: imageUrl
                });
                stats.updated++;
            });

            await Promise.all(updatePromises);
            
            // Small delay between batches
            if (i + BATCH_SIZE < allServices.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_MS));
            }
        }

        return Response.json({
            success: true,
            message: 'تم تعيين الصور لجميع الخدمات بنجاح',
            stats
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});