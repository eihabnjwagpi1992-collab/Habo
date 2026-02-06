import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function CategoryCard({ category, onSelect, isLoading }) {
  return (
    <div
      onClick={() => !isLoading && onSelect(category)}
      className="relative overflow-hidden rounded-2xl aspect-video cursor-pointer group"
    >
      {/* Background Image */}
      <img
        src={category.image_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80'}
        alt={category.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
      />

      {/* Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Hover Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(59, 130, 246, 0.3))`
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Tags */}
        {category.tags && category.tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {category.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title & Description */}
        <div className="group-hover:translate-y-0 transition-all duration-300">
          <h3 
            className="text-lg md:text-xl font-bold mb-1 text-white group-hover:text-cyan-300 transition-colors"
          >
            {category.title}
          </h3>
          <p className="text-xs md:text-sm text-gray-200">
            {category.description}
          </p>
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-xs text-cyan-300">Explore</span>
            <ChevronRight className="w-4 h-4 text-cyan-300" />
          </div>
        </div>
      </div>

      {/* Border on Hover */}
      <div 
        className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ borderColor: 'var(--primary)', borderRadius: '16px' }}
      />
    </div>
  );
}
