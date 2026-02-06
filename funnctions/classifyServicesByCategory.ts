import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * One-time migration: Classify services using keyword dictionary
 * Uses bulkUpdate for efficiency instead of individual updates
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const keywordDictionary = {
      apple_icloud: ['icloud', 'apple', 'apple id', 'ios', 'fmi', 'find my', 'mdm', 'activation lock', 'icloud unlock', 'serial', 'sn'],
      frp_security: ['frp', 'google lock', 'factory reset protection', 'kg lock', 'security', 'bypass frp', 'android lock'],
      samsung: ['samsung', 'sm-', 'galaxy', 'knox', 'samsung kg', 'samsung frp', 'csc', 'imei repair samsung'],
      xiaomi: ['xiaomi', 'mi', 'redmi', 'poco', 'mi unlock', 'xiaomi frp', 'edl', 'mi auth'],
      tools_credits: ['credit', 'credits', 'token', 'tokens', 'renewal', 'subscription', 'tool credit', 'refill credit'],
      tools_activation: ['chimera', 'dft', 'unlocktool', 'umt', 'eft', 'hydra', 'z3x', 'octoplus', 'license', 'dongle'],
      game_topup: ['pubg', 'uc', 'free fire', 'ff', 'diamond', 'mobile legends', 'ml', 'cod', 'warzone', 'steam', 'gift card', 'roblox', 'robux', 'genshin', 'valorant', 'fifa', 'playstation', 'psn', 'xbox', 'battle pass'],
      live_streaming: ['tiktok', 'tik tok', 'bigo', 'likee', 'tango', 'live streaming', 'livestream', 'coins', 'diamonds', 'agency', 'host'],
      remote_services: ['remote', 'teamviewer', 'anydesk', 'usb redirect', 'remote unlock', 'remote fix', 'session'],
      social_media: ['instagram', 'insta', 'facebook', 'fb', 'youtube', 'yt', 'twitter', 'followers', 'likes', 'views', 'subscribers']
    };

    const categoryPriority = ['apple_icloud', 'frp_security', 'samsung', 'xiaomi', 'tools_credits', 'tools_activation', 'game_topup', 'live_streaming', 'remote_services', 'social_media'];

    // Fetch all services in chunks
    const allServices = await base44.asServiceRole.entities.Service.filter({}, '-created_date', 2000);
    
    const updates = [];
    const stats = { classified: 0, changed: 0, category_distribution: {} };

    for (const service of allServices) {
      const serviceName = (service.name || '').toLowerCase();
      let matchedCategory = null;

      // Find category by priority
      for (const category of categoryPriority) {
        if (keywordDictionary[category].some(keyword => serviceName.includes(keyword))) {
          matchedCategory = category;
          break;
        }
      }

      if (matchedCategory) {
        stats.classified++;
        stats.category_distribution[matchedCategory] = (stats.category_distribution[matchedCategory] || 0) + 1;
        
        if (service.category !== matchedCategory) {
          stats.changed++;
          updates.push({ id: service.id, category: matchedCategory });
        }
      }
    }

    // Bulk update in chunks
    const CHUNK_SIZE = 20;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(u => 
        base44.asServiceRole.entities.Service.update(u.id, { category: u.category })
      ));
    }

    return Response.json({
      success: true,
      total_services: allServices.length,
      ...stats
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});