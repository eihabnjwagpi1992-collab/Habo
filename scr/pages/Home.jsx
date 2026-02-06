import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import HeroSection from "@/components/home/HeroSection";
import FinalCategoriesSection from "@/components/home/FinalCategoriesSection";
import FeaturedServices from "@/components/home/FeaturedServices";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import CTASection from "@/components/home/CTASection";

export default function Home() {
  const {
    data: featuredServices = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['featured-services'],
    queryFn: () =>
      base44.entities.Service.filter(
        { is_featured: true, is_active: true },
        '-created_date',
        6
      ),
    staleTime: 1000 * 60 * 5, // 5 min
    refetchOnWindowFocus: false,
  });

  return (
    <div>
      <HeroSection />
      <FinalCategoriesSection />

      {/* Featured block */}
      {isError ? (
        <div className="container mx-auto max-w-7xl px-4 mt-6">
          <div
            className="p-4 rounded-2xl border"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)', color: 'var(--text-color)' }}
          >
            فشل تحميل الخدمات المميزة: {error?.message || 'Unknown error'}
          </div>
        </div>
      ) : (
        <FeaturedServices
          services={featuredServices}
          loading={isLoading}
        />
      )}

      <WhyChooseUs />
      <CTASection />
    </div>
  );
}
