import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Loader } from 'lucide-react';

const CATEGORIES = [
  {
    id: 'game_topup',
    title: 'Game Top-Up',
    description: 'Fast & global game recharge',
    prompt: 'Modern gaming top-up dashboard, neon gradients, controller icons, clean UI, high quality, 16:9, no text',
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 'live_streaming',
    title: 'Live Streaming Apps',
    description: 'Recharge & subscriptions',
    prompt: 'Live streaming mobile apps interface, glowing UI, creators theme, dark background, modern style, 16:9, no text',
    color: 'from-red-600 to-pink-600'
  },
  {
    id: 'apple_icloud',
    title: 'Apple iCloud Services',
    description: 'Activation & security services',
    prompt: 'Apple iCloud security concept, cloud icons, minimal clean design, blue and white tones, premium look, 16:9, no text',
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'frp_security',
    title: 'FRP & Security Services',
    description: 'Device protection solutions',
    prompt: 'Smartphone security lock concept, shield icon, tech background, dark professional style, 16:9, no text',
    color: 'from-orange-600 to-red-600'
  },
  {
    id: 'samsung',
    title: 'Samsung Services',
    description: 'Official Samsung solutions',
    prompt: 'Samsung smartphone service lab, clean workspace, blue tech lighting, professional repair theme, 16:9, no text',
    color: 'from-blue-700 to-cyan-600'
  },
  {
    id: 'xiaomi',
    title: 'Xiaomi Services',
    description: 'Authorized Xiaomi solutions',
    prompt: 'Xiaomi phone repair and software service, orange accents, modern tech desk, 16:9, no text',
    color: 'from-orange-600 to-yellow-600'
  },
  {
    id: 'tools_activation',
    title: 'Tools Activation',
    description: 'Professional GSM tools',
    prompt: 'GSM software tools dashboard, futuristic interface, glowing panels, dark tech theme, 16:9, no text',
    color: 'from-cyan-600 to-blue-600'
  },
  {
    id: 'tools_credits',
    title: 'Tools Credits',
    description: 'Credits & renewals',
    prompt: 'Digital credits and tokens concept, abstract tech shapes, clean modern style, 16:9, no text',
    color: 'from-yellow-600 to-orange-600'
  },
  {
    id: 'remote_services',
    title: 'Remote Services',
    description: 'Remote technical support',
    prompt: 'Remote desktop support screen, technician helping user, modern office tech style, 16:9, no text',
    color: 'from-green-600 to-emerald-600'
  },
  {
    id: 'social_media',
    title: 'Social Media Services',
    description: 'Growth & engagement',
    prompt: 'Social media analytics dashboard, growth charts, colorful icons, modern UI, 16:9, no text',
    color: 'from-indigo-600 to-purple-600'
  }
];

export default function FinalCategoriesSection() {
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateImages = async () => {
      const generatedImages = {};
      
      for (const cat of CATEGORIES) {
        try {
          const result = await base44.integrations.Core.GenerateImage({
            prompt: cat.prompt
          });
          generatedImages[cat.id] = result.url;
        } catch (e) {
          console.error(`Failed to generate image for ${cat.title}:`, e);
          generatedImages[cat.id] = `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80`;
        }
      }
      
      setImages(generatedImages);
      setLoading(false);
    };

    generateImages();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <section className="py-20 px-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-color)' }}
          >
            Our Services
          </h2>
          <p 
            className="text-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Everything you need in one platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={createPageUrl('Services') + `?category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl aspect-video cursor-pointer"
              style={{ borderRadius: '16px' }}
            >
              {/* Image Background */}
              <img
                src={images[category.id] || category.image}
                alt={category.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />

              {/* Overlay Gradient */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(59, 130, 246, 0.3))`
                }}
              />

              {/* Dark Overlay for Text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 group-hover:translate-y-0 transition-all duration-300">
                <h3 
                  className="text-lg md:text-xl font-bold mb-1 group-hover:text-white transition-colors"
                  style={{ color: 'var(--primary)' }}
                >
                  {category.title}
                </h3>
                <p 
                  className="text-xs md:text-sm opacity-90"
                  style={{ color: '#e0e0e0' }}
                >
                  {category.description}
                </p>
              </div>

              {/* Hover Border */}
              <div 
                className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ borderColor: 'var(--primary)', borderRadius: '16px' }}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}