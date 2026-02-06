import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from '@/api/base44Client';
import { 
  Image as ImageIcon,
  RotateCw,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function ImageGenerationCenter() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [generationStatus, setGenerationStatus] = useState({});

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => base44.entities.Service.list('-created_date'),
    initialData: [],
  });

  const generateImageMutation = useMutation({
    mutationFn: (service) => base44.functions.invoke('generateServiceImages', { 
      data: service,
      force_regenerate: true 
    }),
    onMutate: (service) => {
      setGenerationStatus(prev => ({...prev, [service.id]: 'generating'}));
    },
    onSuccess: (response, service) => {
      setGenerationStatus(prev => ({...prev, [service.id]: 'success'}));
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      toast.success(`Image generated for ${service.name}`);
      setTimeout(() => {
        setGenerationStatus(prev => ({...prev, [service.id]: null}));
      }, 2000);
    },
    onError: (error, service) => {
      setGenerationStatus(prev => ({...prev, [service.id]: 'error'}));
      toast.error(`Failed to generate image for ${service.name}`);
    }
  });

  const generateAllImagesMutation = useMutation({
    mutationFn: async (servicesToGenerate) => {
      const results = [];
      for (const service of servicesToGenerate) {
        try {
          setGenerationStatus(prev => ({...prev, [service.id]: 'generating'}));
          const result = await base44.functions.invoke('generateServiceImages', { 
            data: service,
            force_regenerate: true 
          });
          results.push({ service: service.name, success: true });
        } catch (error) {
          results.push({ service: service.name, success: false, error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      const successCount = results.filter(r => r.success).length;
      toast.success(`Generated ${successCount} images successfully`);
      setGenerationStatus({});
    },
    onError: () => {
      toast.error('Batch generation encountered errors');
      setGenerationStatus({});
    }
  });

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subcategory?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const servicesWithoutImages = filteredServices.filter(s => !s.image_url);
  const categories = [...new Set(services.map(s => s.category))].filter(Boolean);

  return (
    <div className="py-8 px-4" style={{ color: 'var(--text-color)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <ImageIcon className="w-8 h-8" style={{ color: 'var(--primary)' }} />
            Image Generation Center
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Generate AI images for all your services with smart batch processing
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <GlowCard className="p-4">
            <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">Total Services</p>
            <p className="text-2xl font-bold">{services.length}</p>
          </GlowCard>
          <GlowCard className="p-4">
            <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">With Images</p>
            <p className="text-2xl font-bold">{services.filter(s => s.image_url).length}</p>
          </GlowCard>
          <GlowCard className="p-4">
            <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">Without Images</p>
            <p className="text-2xl font-bold text-orange-500">{servicesWithoutImages.length}</p>
          </GlowCard>
          <GlowCard className="p-4">
            <p style={{ color: 'var(--text-muted)' }} className="text-sm mb-2">Coverage</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
              {services.length > 0 
                ? Math.round((services.filter(s => s.image_url).length / services.length) * 100)
                : 0}%
            </p>
          </GlowCard>
        </div>

        {/* Actions */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <Button
            onClick={() => generateAllImagesMutation.mutate(servicesWithoutImages)}
            disabled={servicesWithoutImages.length === 0 || generateAllImagesMutation.isPending}
            className="text-white flex-1"
            style={{ background: 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))' }}
          >
            {generateAllImagesMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating All ({servicesWithoutImages.length})...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate All Missing Images ({servicesWithoutImages.length})
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-10 border"
              style={{ 
                backgroundColor: 'var(--input-bg)', 
                borderColor: 'var(--input-border)',
                color: 'var(--text-color)'
              }}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger 
              className="w-full md:w-48 h-10 border"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-color)'
              }}
            >
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent
              style={{
                backgroundColor: 'var(--card-bg)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)'
              }}
            >
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--text-muted)' }}>No services found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const status = generationStatus[service.id];
              
              return (
                <GlowCard key={service.id} className="p-6 flex flex-col">
                  {/* Image Preview */}
                  <div 
                    className="mb-4 rounded-lg overflow-hidden h-40 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    {service.image_url ? (
                      <img 
                        src={service.image_url} 
                        alt={service.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-12 h-12" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>

                  {/* Service Info */}
                  <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-color)' }}>
                    {service.name}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                    {service.category}
                  </p>

                  {/* Status Badge */}
                  <div className="mb-4 flex items-center gap-2">
                    {service.image_url ? (
                      <Badge className="bg-green-500/20 text-green-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Has Image
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-500/20 text-orange-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Missing Image
                      </Badge>
                    )}
                  </div>

                  {/* Generation Status */}
                  {status === 'generating' && (
                    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg mb-4" style={{ backgroundColor: 'var(--hover-bg)' }}>
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />
                      <span className="text-sm" style={{ color: 'var(--primary)' }}>Generating...</span>
                    </div>
                  )}
                  
                  {status === 'success' && (
                    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg mb-4 bg-green-500/20">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Generated!</span>
                    </div>
                  )}
                  
                  {status === 'error' && (
                    <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg mb-4 bg-red-500/20">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">Failed</span>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => generateImageMutation.mutate(service)}
                    disabled={status === 'generating' || generateImageMutation.isPending}
                    className="w-full text-white mt-auto"
                    style={{ 
                      background: service.image_url 
                        ? 'linear-gradient(to right, #3b82f6, #06b6d4)' 
                        : 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))'
                    }}
                  >
                    {status === 'generating' ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-4 h-4 mr-2" />
                        {service.image_url ? 'Regenerate' : 'Generate'} Image
                      </>
                    )}
                  </Button>
                </GlowCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}